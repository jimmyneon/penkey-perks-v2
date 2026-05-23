-- =============================================
-- VERIFY BEANS SYSTEM
-- =============================================
-- Checks all systems are updated to beans
-- No user creation needed
-- =============================================

-- =============================================
-- 1. VERIFY GAME PRIZES
-- =============================================

SELECT 
  '🎮 GAME PRIZES' as "Check",
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE prize_value >= 50) as updated_to_beans,
  COUNT(*) FILTER (WHERE prize_value < 50) as still_old_values,
  CASE 
    WHEN COUNT(*) FILTER (WHERE prize_value < 50 AND prize_type = 'points') = 0 
    THEN '✅ All Updated'
    ELSE '❌ Needs Update'
  END as status
FROM public.game_prizes
WHERE prize_type = 'points' AND active = TRUE;

-- Show sample prizes
SELECT 
  mg.display_name as game,
  gp.label,
  gp.prize_value as beans,
  gp.probability
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.prize_type = 'points' AND gp.active = TRUE
ORDER BY gp.prize_value DESC
LIMIT 10;

-- =============================================
-- 2. VERIFY POINT CONFIGS
-- =============================================

SELECT 
  '⚙️  POINT CONFIGS' as "Check",
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE points_amount >= 50) as updated_to_beans,
  COUNT(*) FILTER (WHERE points_amount < 50) as still_old_values,
  CASE 
    WHEN COUNT(*) FILTER (WHERE points_amount < 50 AND action_type != 'profile_complete') = 0 
    THEN '✅ All Updated'
    ELSE '❌ Needs Update'
  END as status
FROM public.points_config
WHERE active = TRUE;

-- Show sample configs
SELECT 
  action_type,
  points_amount as beans,
  description
FROM public.points_config
WHERE active = TRUE
ORDER BY points_amount DESC
LIMIT 10;

-- =============================================
-- 3. VERIFY REWARDS CATALOG
-- =============================================

SELECT 
  '🎁 REWARDS' as "Check",
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE points_required >= 1000) as updated_to_beans,
  COUNT(*) FILTER (WHERE points_required < 1000) as still_old_values,
  CASE 
    WHEN COUNT(*) FILTER (WHERE points_required < 1000) = 0 
    THEN '✅ All Updated'
    ELSE '❌ Needs Update'
  END as status
FROM public.points_rewards
WHERE active = TRUE;

-- Show all rewards
SELECT 
  name,
  points_required as beans_cost,
  reward_type,
  expiry_days
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required DESC;

-- =============================================
-- 4. CHECK EXISTING USERS (if any)
-- =============================================

SELECT 
  '👥 EXISTING USERS' as "Check",
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.points_transactions pt 
    WHERE pt.user_id = users.id
  )) as users_with_transactions,
  COALESCE(AVG((
    SELECT balance_after 
    FROM public.points_transactions pt 
    WHERE pt.user_id = users.id 
    ORDER BY created_at DESC 
    LIMIT 1
  )), 0)::INTEGER as avg_balance
FROM public.users
WHERE role = 'customer';

-- =============================================
-- 5. CHECK SIGNUP BONUS FUNCTION
-- =============================================

SELECT 
  '🎁 SIGNUP BONUS' as "Check",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'award_signup_bonus'
    ) THEN '✅ Function Exists'
    ELSE '❌ Function Missing'
  END as function_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_user_signup_bonus'
    ) THEN '✅ Trigger Exists'
    ELSE '❌ Trigger Missing'
  END as trigger_status;

-- =============================================
-- FINAL SUMMARY
-- =============================================

DO $$
DECLARE
  v_game_prizes_ok BOOLEAN;
  v_configs_ok BOOLEAN;
  v_rewards_ok BOOLEAN;
BEGIN
  -- Check game prizes
  SELECT COUNT(*) FILTER (WHERE prize_value < 50 AND prize_type = 'points') = 0
  INTO v_game_prizes_ok
  FROM public.game_prizes
  WHERE active = TRUE;
  
  -- Check configs
  SELECT COUNT(*) FILTER (WHERE points_amount < 50 AND action_type != 'profile_complete') = 0
  INTO v_configs_ok
  FROM public.points_config
  WHERE active = TRUE;
  
  -- Check rewards
  SELECT COUNT(*) FILTER (WHERE points_required < 1000) = 0
  INTO v_rewards_ok
  FROM public.points_rewards
  WHERE active = TRUE;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🫘 BEANS SYSTEM VERIFICATION';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_game_prizes_ok THEN
    RAISE NOTICE '✅ Game Prizes: Updated to beans';
  ELSE
    RAISE NOTICE '❌ Game Prizes: Still have old values';
    RAISE NOTICE '   → Run: 20251011_update_game_prizes_to_beans.sql';
  END IF;
  
  IF v_configs_ok THEN
    RAISE NOTICE '✅ Point Configs: Updated to beans';
  ELSE
    RAISE NOTICE '❌ Point Configs: Still have old values';
    RAISE NOTICE '   → Already in main migration';
  END IF;
  
  IF v_rewards_ok THEN
    RAISE NOTICE '✅ Rewards Catalog: Updated to beans';
  ELSE
    RAISE NOTICE '❌ Rewards Catalog: Still have old values';
    RAISE NOTICE '   → Already in main migration';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_game_prizes_ok AND v_configs_ok AND v_rewards_ok THEN
    RAISE NOTICE '🎉 ALL SYSTEMS UPDATED TO BEANS!';
    RAISE NOTICE '✅ Ready to deploy!';
  ELSE
    RAISE NOTICE '⚠️  Some systems need updating (see above)';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📝 To test with a real user:';
  RAISE NOTICE '   1. Create account via signup page';
  RAISE NOTICE '   2. Check pending_rewards table';
  RAISE NOTICE '   3. Should see: 250 beans + free coffee';
  RAISE NOTICE '';
END $$;
