-- =============================================
-- PRE-MIGRATION VERIFICATION & BACKUP
-- =============================================
-- Run this BEFORE the beans migration to verify current state
-- =============================================

-- 1. CHECK CURRENT SYSTEM STATE
-- =============================================

SELECT '=== CURRENT POINTS SYSTEM STATE ===' as info;

-- Count total users
SELECT 
  'Total Users' as metric,
  COUNT(*) as value
FROM public.users;

-- Count users with points
SELECT 
  'Users with Points' as metric,
  COUNT(DISTINCT user_id) as value
FROM public.points_transactions;

-- Total points in circulation
SELECT 
  'Total Points in Circulation' as metric,
  COALESCE(SUM(balance_after), 0) as value
FROM (
  SELECT DISTINCT ON (user_id) balance_after 
  FROM public.points_transactions 
  ORDER BY user_id, created_at DESC
) AS latest_balances;

-- Active point configs
SELECT 
  'Active Point Configs' as metric,
  COUNT(*) as value
FROM public.points_config
WHERE active = TRUE;

-- Active rewards
SELECT 
  'Active Rewards' as metric,
  COUNT(*) as value
FROM public.points_rewards
WHERE active = TRUE;

-- Recent transactions (last 24 hours)
SELECT 
  'Transactions (24h)' as metric,
  COUNT(*) as value
FROM public.points_transactions
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. SAMPLE CURRENT POINT VALUES
-- =============================================

SELECT '=== CURRENT POINT CONFIGURATIONS ===' as info;

SELECT 
  action_type,
  points_amount as current_points,
  description,
  active
FROM public.points_config
WHERE active = TRUE
ORDER BY points_amount DESC
LIMIT 10;

-- 3. SAMPLE CURRENT REWARD COSTS
-- =============================================

SELECT '=== CURRENT REWARD COSTS ===' as info;

SELECT 
  name,
  points_required as current_cost,
  reward_type,
  active
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required ASC;

-- 4. SAMPLE USER BALANCES (Top 10)
-- =============================================

SELECT '=== TOP 10 USER BALANCES ===' as info;

SELECT 
  u.name,
  u.email,
  COALESCE(upb.total_points, 0) as current_balance
FROM public.users u
LEFT JOIN public.user_points_balance upb ON upb.user_id = u.id
ORDER BY upb.total_points DESC NULLS LAST
LIMIT 10;

-- 5. CHECK FOR POTENTIAL ISSUES
-- =============================================

SELECT '=== POTENTIAL ISSUES CHECK ===' as info;

-- Check for negative balances
SELECT 
  'Users with Negative Balance' as issue,
  COUNT(*) as count
FROM public.user_points_balance
WHERE total_points < 0;

-- Check for orphaned transactions
SELECT 
  'Orphaned Transactions' as issue,
  COUNT(*) as count
FROM public.points_transactions pt
LEFT JOIN public.users u ON u.id = pt.user_id
WHERE u.id IS NULL;

-- Check for missing configs
SELECT 
  'Transactions with Missing Configs' as issue,
  COUNT(DISTINCT source) as count
FROM public.points_transactions pt
LEFT JOIN public.points_config pc ON pc.action_type = pt.source
WHERE pc.id IS NULL
  AND pt.source NOT IN ('manual_add', 'manual_remove', 'redemption');

-- 6. BACKUP RECOMMENDATION
-- =============================================

SELECT '=== BACKUP INSTRUCTIONS ===' as info;

SELECT 
  'Run this command in your terminal:' as step_1,
  'supabase db dump > backup_pre_beans_' || to_char(NOW(), 'YYYYMMDD_HH24MISS') || '.sql' as command;

SELECT 
  'Or use Supabase Dashboard:' as step_2,
  'Settings > Database > Create Backup' as location;

-- 7. MIGRATION READINESS
-- =============================================

SELECT '=== MIGRATION READINESS ===' as info;

DO $$
DECLARE
  v_users_count INTEGER;
  v_points_count INTEGER;
  v_configs_count INTEGER;
  v_rewards_count INTEGER;
  v_ready BOOLEAN := TRUE;
  v_issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check user count
  SELECT COUNT(*) INTO v_users_count FROM public.users;
  IF v_users_count = 0 THEN
    v_ready := FALSE;
    v_issues := array_append(v_issues, 'No users found');
  END IF;
  
  -- Check points transactions
  SELECT COUNT(*) INTO v_points_count FROM public.points_transactions;
  
  -- Check configs
  SELECT COUNT(*) INTO v_configs_count FROM public.points_config WHERE active = TRUE;
  IF v_configs_count = 0 THEN
    v_ready := FALSE;
    v_issues := array_append(v_issues, 'No active point configs');
  END IF;
  
  -- Check rewards
  SELECT COUNT(*) INTO v_rewards_count FROM public.points_rewards WHERE active = TRUE;
  IF v_rewards_count = 0 THEN
    v_ready := FALSE;
    v_issues := array_append(v_issues, 'No active rewards');
  END IF;
  
  -- Output results
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'MIGRATION READINESS CHECK';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Users: %', v_users_count;
  RAISE NOTICE 'Point Transactions: %', v_points_count;
  RAISE NOTICE 'Active Configs: %', v_configs_count;
  RAISE NOTICE 'Active Rewards: %', v_rewards_count;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_ready THEN
    RAISE NOTICE '✅ READY TO MIGRATE';
    RAISE NOTICE 'Next step: Run 20251011_upgrade_to_beans_system.sql';
  ELSE
    RAISE NOTICE '❌ NOT READY - Issues found:';
    FOR i IN 1..array_length(v_issues, 1) LOOP
      RAISE NOTICE '  - %', v_issues[i];
    END LOOP;
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 8. ESTIMATED MIGRATION IMPACT
-- =============================================

SELECT '=== ESTIMATED MIGRATION IMPACT ===' as info;

WITH user_balances AS (
  SELECT 
    user_id,
    balance_after as current_balance,
    balance_after * 10 as new_balance
  FROM (
    SELECT DISTINCT ON (user_id) user_id, balance_after
    FROM public.points_transactions
    ORDER BY user_id, created_at DESC
  ) AS latest
)
SELECT 
  'Users Affected' as metric,
  COUNT(*) as count,
  'All users with points will have 10x balance' as note
FROM user_balances;

SELECT 
  'Average Current Balance' as metric,
  ROUND(AVG(balance_after)) as value,
  'Will become ' || ROUND(AVG(balance_after) * 10) || ' beans' as after_migration
FROM (
  SELECT DISTINCT ON (user_id) balance_after
  FROM public.points_transactions
  ORDER BY user_id, created_at DESC
) AS latest;

SELECT 
  'Highest Current Balance' as metric,
  MAX(balance_after) as value,
  'Will become ' || MAX(balance_after) * 10 || ' beans' as after_migration
FROM (
  SELECT DISTINCT ON (user_id) balance_after
  FROM public.points_transactions
  ORDER BY user_id, created_at DESC
) AS latest;

-- 9. FINAL CHECKLIST
-- =============================================

SELECT '=== FINAL CHECKLIST ===' as info;

SELECT 
  '☐ Database backup created' as checklist_item,
  1 as order_num
UNION ALL
SELECT '☐ Verified current state above', 2
UNION ALL
SELECT '☐ Reviewed migration script', 3
UNION ALL
SELECT '☐ Scheduled maintenance window (if production)', 4
UNION ALL
SELECT '☐ Notified team/users (if production)', 5
UNION ALL
SELECT '☐ Ready to run migration', 6
ORDER BY order_num;

SELECT '=== READY TO PROCEED ===' as info;
SELECT 'If all checks pass, run: supabase/migrations/20251011_upgrade_to_beans_system.sql' as next_step;
