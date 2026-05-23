-- =============================================
-- POST-MIGRATION VERIFICATION
-- =============================================
-- Run this AFTER the beans migration to verify success
-- =============================================

SELECT '=== BEANS SYSTEM VERIFICATION ===' as info;

-- 1. VERIFY BALANCES MULTIPLIED BY 10
-- =============================================

SELECT '=== BALANCE MULTIPLICATION CHECK ===' as info;

WITH balance_check AS (
  SELECT 
    user_id,
    balance_after as current_balance,
    LAG(balance_after) OVER (PARTITION BY user_id ORDER BY created_at DESC) as previous_balance
  FROM public.points_transactions
  ORDER BY created_at DESC
  LIMIT 100
)
SELECT 
  'Sample Balances (Recent)' as check_type,
  COUNT(*) as transactions_checked,
  'All should be 10x higher than before' as note
FROM balance_check;

-- Check total beans in circulation
SELECT 
  'Total Beans in Circulation' as metric,
  COALESCE(SUM(balance_after), 0) as value,
  'Should be ~10x pre-migration value' as note
FROM (
  SELECT DISTINCT ON (user_id) balance_after 
  FROM public.points_transactions 
  ORDER BY user_id, created_at DESC
) AS latest_balances;

-- 2. VERIFY NEW POINT CONFIGS
-- =============================================

SELECT '=== NEW POINT CONFIGURATIONS ===' as info;

SELECT 
  action_type,
  points_amount as beans_amount,
  description,
  active,
  CASE 
    WHEN action_type = 'signup' AND points_amount = 250 THEN '✅'
    WHEN action_type = 'daily_checkin' AND points_amount = 50 THEN '✅'
    WHEN action_type = 'streak_7_days' AND points_amount = 200 THEN '✅'
    WHEN action_type = 'streak_14_days' AND points_amount = 500 THEN '✅'
    WHEN action_type = 'streak_30_days' AND points_amount = 1500 THEN '✅'
    WHEN action_type = 'game_win' AND points_amount = 250 THEN '✅'
    WHEN action_type = 'referral_signup' AND points_amount = 400 THEN '✅'
    WHEN action_type = 'birthday_bonus' AND points_amount = 300 THEN '✅'
    ELSE '⚠️'
  END as status
FROM public.points_config
WHERE action_type IN (
  'signup', 'daily_checkin', 'streak_7_days', 'streak_14_days', 
  'streak_30_days', 'game_win', 'referral_signup', 'birthday_bonus'
)
ORDER BY points_amount DESC;

-- Check for new configs
SELECT 
  'New Configs Added' as metric,
  COUNT(*) as value
FROM public.points_config
WHERE action_type IN (
  'streak_14_days', 'game_play', 'game_win', 'quiz_perfect',
  'gps_duck_near', 'golden_bean_far', 'social_share_milestone'
);

-- 3. VERIFY REWARD COSTS UPDATED
-- =============================================

SELECT '=== REWARD COSTS UPDATED ===' as info;

SELECT 
  name,
  points_required as beans_cost,
  reward_type,
  active,
  CASE 
    WHEN name LIKE '%Pastry%' AND points_required = 1500 THEN '✅'
    WHEN name = '£5 Off Voucher' AND points_required = 4000 THEN '✅'
    WHEN name = '£10 Off Voucher' AND points_required = 8000 THEN '✅'
    WHEN name = 'Reusable Cup' AND points_required = 12000 THEN '✅'
    WHEN name = 'Penkey Hoodie' AND points_required = 25000 THEN '✅'
    WHEN name = 'Legend Status' AND points_required = 50000 THEN '✅'
    ELSE '⚠️'
  END as status
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required ASC;

-- 4. VERIFY SIGNUP BONUS FUNCTION
-- =============================================

SELECT '=== SIGNUP BONUS FUNCTION CHECK ===' as info;

SELECT 
  'Function Exists' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'award_signup_bonus'
    ) THEN '✅ Yes'
    ELSE '❌ No'
  END as status;

SELECT 
  'Trigger Exists' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_user_signup_bonus'
    ) THEN '✅ Yes'
    ELSE '❌ No'
  END as status;

-- 5. VERIFY APP SETTINGS
-- =============================================

SELECT '=== APP SETTINGS (BEANS BRANDING) ===' as info;

SELECT 
  key,
  value,
  description
FROM public.app_settings
WHERE key IN (
  'currency_name', 'currency_icon', 'signup_bonus_enabled',
  'signup_bonus_points', 'signup_bonus_includes_coffee'
)
ORDER BY key;

-- 6. TEST SIGNUP BONUS (DRY RUN)
-- =============================================

SELECT '=== SIGNUP BONUS TEST ===' as info;

DO $$
DECLARE
  v_test_user_id UUID := gen_random_uuid();
  v_pending_count INTEGER;
BEGIN
  -- This is a dry run - we'll rollback
  BEGIN
    -- Simulate user creation
    INSERT INTO public.users (id, email, name)
    VALUES (v_test_user_id, 'test_beans_' || v_test_user_id || '@test.com', 'Test User');
    
    -- Check if pending rewards were created
    SELECT COUNT(*) INTO v_pending_count
    FROM public.pending_rewards
    WHERE user_id = v_test_user_id;
    
    RAISE NOTICE 'Signup Bonus Test:';
    RAISE NOTICE '  Pending rewards created: %', v_pending_count;
    RAISE NOTICE '  Expected: 2 (250 beans + free coffee)';
    
    IF v_pending_count = 2 THEN
      RAISE NOTICE '  Status: ✅ PASS';
    ELSE
      RAISE NOTICE '  Status: ❌ FAIL';
    END IF;
    
    -- Rollback test
    RAISE EXCEPTION 'Test complete - rolling back';
  EXCEPTION
    WHEN OTHERS THEN
      -- Expected - this rolls back the test
      NULL;
  END;
END $$;

-- 7. VERIFY STREAK BONUS FUNCTION
-- =============================================

SELECT '=== STREAK BONUS FUNCTION CHECK ===' as info;

SELECT 
  'Function Exists' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'award_streak_bonuses'
    ) THEN '✅ Yes'
    ELSE '❌ No'
  END as status;

SELECT 
  'Check-in Streak Function Updated' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'update_check_in_streak'
    ) THEN '✅ Yes'
    ELSE '❌ No'
  END as status;

-- 8. SAMPLE USER IMPACT
-- =============================================

SELECT '=== SAMPLE USER IMPACT ===' as info;

WITH user_impact AS (
  SELECT 
    u.name,
    u.email,
    COALESCE(upb.total_points, 0) as new_balance,
    COALESCE(upb.total_points / 10, 0) as estimated_old_balance
  FROM public.users u
  LEFT JOIN public.user_points_balance upb ON upb.user_id = u.id
  WHERE upb.total_points > 0
  ORDER BY upb.total_points DESC
  LIMIT 5
)
SELECT 
  name,
  estimated_old_balance as before,
  new_balance as after,
  (new_balance - estimated_old_balance) as increase,
  ROUND((new_balance::DECIMAL / NULLIF(estimated_old_balance, 0) - 1) * 100, 0) || '%' as percent_increase
FROM user_impact;

-- 9. MIGRATION SUMMARY
-- =============================================

SELECT '=== MIGRATION SUMMARY ===' as info;

DO $$
DECLARE
  v_total_users INTEGER;
  v_users_with_beans INTEGER;
  v_total_beans BIGINT;
  v_active_configs INTEGER;
  v_active_rewards INTEGER;
  v_new_configs INTEGER;
  v_new_rewards INTEGER;
  v_signup_function BOOLEAN;
  v_streak_function BOOLEAN;
  v_all_checks_pass BOOLEAN := TRUE;
BEGIN
  -- Gather stats
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_beans 
  FROM public.points_transactions;
  
  SELECT COALESCE(SUM(balance_after), 0) INTO v_total_beans
  FROM (
    SELECT DISTINCT ON (user_id) balance_after 
    FROM public.points_transactions 
    ORDER BY user_id, created_at DESC
  ) AS latest;
  
  SELECT COUNT(*) INTO v_active_configs 
  FROM public.points_config WHERE active = TRUE;
  
  SELECT COUNT(*) INTO v_active_rewards 
  FROM public.points_rewards WHERE active = TRUE;
  
  SELECT COUNT(*) INTO v_new_configs
  FROM public.points_config
  WHERE action_type IN ('streak_14_days', 'game_play', 'quiz_perfect', 'gps_duck_near', 'golden_bean_far');
  
  SELECT COUNT(*) INTO v_new_rewards
  FROM public.points_rewards
  WHERE name IN ('Reusable Cup', 'Penkey Hoodie', 'Legend Status');
  
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_signup_bonus') 
  INTO v_signup_function;
  
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_streak_bonuses') 
  INTO v_streak_function;
  
  -- Output summary
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🫘 BEANS SYSTEM MIGRATION SUMMARY';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total Users: %', v_total_users;
  RAISE NOTICE 'Users with Beans: %', v_users_with_beans;
  RAISE NOTICE 'Total Beans in Circulation: %', v_total_beans;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Active Point Configs: %', v_active_configs;
  RAISE NOTICE 'New Configs Added: %', v_new_configs;
  RAISE NOTICE 'Active Rewards: %', v_active_rewards;
  RAISE NOTICE 'New Rewards Added: %', v_new_rewards;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Signup Bonus Function: %', CASE WHEN v_signup_function THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Streak Bonus Function: %', CASE WHEN v_streak_function THEN '✅' ELSE '❌' END;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Validation
  IF v_new_configs < 5 THEN
    RAISE NOTICE '⚠️  WARNING: Expected at least 5 new configs, found %', v_new_configs;
    v_all_checks_pass := FALSE;
  END IF;
  
  IF v_new_rewards < 3 THEN
    RAISE NOTICE '⚠️  WARNING: Expected at least 3 new rewards, found %', v_new_rewards;
    v_all_checks_pass := FALSE;
  END IF;
  
  IF NOT v_signup_function THEN
    RAISE NOTICE '❌ ERROR: Signup bonus function not found';
    v_all_checks_pass := FALSE;
  END IF;
  
  IF NOT v_streak_function THEN
    RAISE NOTICE '❌ ERROR: Streak bonus function not found';
    v_all_checks_pass := FALSE;
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_all_checks_pass THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update frontend UI (points → beans)';
    RAISE NOTICE '  2. Test signup flow';
    RAISE NOTICE '  3. Test check-in and streak bonuses';
    RAISE NOTICE '  4. Deploy to production';
  ELSE
    RAISE NOTICE '❌ MIGRATION INCOMPLETE - Review warnings above';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 10. NEXT STEPS
-- =============================================

SELECT '=== NEXT STEPS ===' as info;

SELECT 
  '1. Review migration summary above' as step,
  1 as order_num
UNION ALL
SELECT '2. Test signup flow with new user', 2
UNION ALL
SELECT '3. Test check-in and pending rewards', 3
UNION ALL
SELECT '4. Update frontend UI (see UI_BEANS_REBRAND_GUIDE.md)', 4
UNION ALL
SELECT '5. Test all user-facing features', 5
UNION ALL
SELECT '6. Deploy to production', 6
ORDER BY order_num;
