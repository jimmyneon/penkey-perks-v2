-- =============================================
-- BEANS SYSTEM - FINAL VERIFICATION CHECKLIST
-- =============================================
-- Run this to verify EVERYTHING is updated to beans
-- =============================================

-- =============================================
-- 1. CHECK POINTS CONFIG (Action Rewards)
-- =============================================

SELECT 
  '1️⃣ POINTS CONFIG' as check_category,
  action_type,
  points_amount as beans,
  description,
  CASE 
    WHEN points_amount >= 50 THEN '✅ Updated'
    ELSE '❌ Still old value'
  END as status
FROM public.points_config
WHERE active = TRUE
ORDER BY points_amount DESC;

-- =============================================
-- 2. CHECK GAME PRIZES
-- =============================================

SELECT 
  '2️⃣ GAME PRIZES' as check_category,
  mg.display_name as game,
  gp.label,
  gp.prize_value as beans,
  CASE 
    WHEN gp.prize_type = 'points' AND gp.prize_value >= 50 THEN '✅ Updated to beans'
    WHEN gp.prize_type = 'points' AND gp.prize_value < 50 THEN '❌ Still old points'
    WHEN gp.prize_type = 'stamps' THEN '✅ Stamps (unchanged)'
    WHEN gp.prize_type = 'nothing' THEN '✅ Nothing (unchanged)'
    ELSE '⚠️ Check this'
  END as status
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.active = TRUE
ORDER BY mg.display_name, gp.prize_value DESC;

-- =============================================
-- 3. CHECK REWARDS CATALOG (Redemption Costs)
-- =============================================

SELECT 
  '3️⃣ REWARDS CATALOG' as check_category,
  name,
  points_required as beans_cost,
  reward_type,
  CASE 
    WHEN points_required >= 1000 THEN '✅ Updated to beans'
    WHEN points_required < 1000 THEN '❌ Still old points'
    ELSE '⚠️ Check this'
  END as status
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required DESC;

-- =============================================
-- 4. CHECK USER BALANCES
-- =============================================

SELECT 
  '4️⃣ USER BALANCES' as check_category,
  COUNT(*) as total_users,
  AVG(balance_after) as avg_beans,
  MAX(balance_after) as max_beans,
  MIN(balance_after) as min_beans,
  CASE 
    WHEN AVG(balance_after) >= 100 THEN '✅ Balances multiplied'
    ELSE '❌ Balances not updated'
  END as status
FROM (
  SELECT DISTINCT ON (user_id) 
    user_id,
    balance_after
  FROM public.points_transactions
  ORDER BY user_id, created_at DESC
) latest_balances;

-- =============================================
-- 5. CHECK RECENT TRANSACTIONS
-- =============================================

SELECT 
  '5️⃣ RECENT TRANSACTIONS' as check_category,
  source,
  COUNT(*) as count,
  AVG(amount) as avg_beans,
  MAX(amount) as max_beans,
  CASE 
    WHEN AVG(amount) >= 50 THEN '✅ Using bean values'
    ELSE '❌ Still using old values'
  END as status
FROM public.points_transactions
WHERE created_at > NOW() - INTERVAL '7 days'
AND amount > 0
GROUP BY source
ORDER BY avg_beans DESC;

-- =============================================
-- 6. CHECK PENDING REWARDS
-- =============================================

SELECT 
  '6️⃣ PENDING REWARDS' as check_category,
  reward_type,
  COUNT(*) as count,
  AVG(amount) as avg_amount,
  MAX(amount) as max_amount,
  CASE 
    WHEN reward_type = 'points' AND AVG(amount) >= 50 THEN '✅ Bean values'
    WHEN reward_type = 'points' AND AVG(amount) < 50 THEN '❌ Old point values'
    WHEN reward_type != 'points' THEN '✅ Non-point reward'
    ELSE '⚠️ Check this'
  END as status
FROM public.pending_rewards
WHERE status = 'pending'
GROUP BY reward_type;

-- =============================================
-- 7. CHECK SIGNUP BONUS
-- =============================================

SELECT 
  '7️⃣ SIGNUP BONUS' as check_category,
  reward_type,
  amount,
  reward_name,
  COUNT(*) as pending_count,
  CASE 
    WHEN reward_type = 'points' AND amount = 250 THEN '✅ Correct (250 beans)'
    WHEN reward_type = 'voucher' THEN '✅ Free coffee'
    ELSE '❌ Wrong amount'
  END as status
FROM public.pending_rewards
WHERE reward_name LIKE '%Signup%' OR reward_name LIKE '%Welcome%'
GROUP BY reward_type, amount, reward_name;

-- =============================================
-- 8. CHECK APP SETTINGS
-- =============================================

SELECT 
  '8️⃣ APP SETTINGS' as check_category,
  key,
  value,
  CASE 
    WHEN key LIKE '%currency%' THEN '✅ Currency setting'
    WHEN key LIKE '%signup_bonus%' THEN '✅ Signup bonus setting'
    ELSE '✅ Other setting'
  END as status
FROM public.app_settings
WHERE key LIKE '%bean%' OR key LIKE '%currency%' OR key LIKE '%signup%'
ORDER BY key;

-- =============================================
-- 9. SUMMARY - WHAT NEEDS UPDATING?
-- =============================================

DO $$
DECLARE
  v_old_game_prizes INTEGER;
  v_old_rewards INTEGER;
  v_old_config INTEGER;
  v_issues TEXT := '';
BEGIN
  -- Check for old game prizes
  SELECT COUNT(*) INTO v_old_game_prizes
  FROM public.game_prizes
  WHERE prize_type = 'points' AND prize_value < 50 AND active = TRUE;
  
  -- Check for old rewards
  SELECT COUNT(*) INTO v_old_rewards
  FROM public.points_rewards
  WHERE points_required < 1000 AND active = TRUE;
  
  -- Check for old config
  SELECT COUNT(*) INTO v_old_config
  FROM public.points_config
  WHERE points_amount < 50 AND active = TRUE AND action_type != 'profile_complete';
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🫘 BEANS SYSTEM - FINAL CHECK SUMMARY';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_old_game_prizes > 0 THEN
    v_issues := v_issues || '❌ ' || v_old_game_prizes || ' game prizes need updating' || E'\n';
    RAISE NOTICE '❌ % game prizes still have old point values', v_old_game_prizes;
    RAISE NOTICE '   → Run: 20251011_update_game_prizes_to_beans.sql';
  ELSE
    RAISE NOTICE '✅ All game prizes updated to beans';
  END IF;
  
  IF v_old_rewards > 0 THEN
    v_issues := v_issues || '❌ ' || v_old_rewards || ' rewards need updating' || E'\n';
    RAISE NOTICE '❌ % rewards still have old point costs', v_old_rewards;
    RAISE NOTICE '   → Already fixed in main migration';
  ELSE
    RAISE NOTICE '✅ All rewards updated to beans';
  END IF;
  
  IF v_old_config > 0 THEN
    v_issues := v_issues || '❌ ' || v_old_config || ' configs need updating' || E'\n';
    RAISE NOTICE '❌ % point configs still have old values', v_old_config;
    RAISE NOTICE '   → Already fixed in main migration';
  ELSE
    RAISE NOTICE '✅ All point configs updated to beans';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_issues = '' THEN
    RAISE NOTICE '🎉 ALL SYSTEMS UPDATED TO BEANS! 🫘';
    RAISE NOTICE '✅ Ready to deploy!';
  ELSE
    RAISE NOTICE '⚠️  ISSUES FOUND - SEE ABOVE FOR FIXES';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
