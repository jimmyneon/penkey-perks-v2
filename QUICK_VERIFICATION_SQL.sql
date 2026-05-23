-- =============================================
-- QUICK VERIFICATION SQL
-- =============================================
-- Run these queries to verify system is working
-- =============================================

-- =============================================
-- 1. SYSTEM HEALTH CHECK
-- =============================================

SELECT public.system_health_check();

-- Expected: "status": "healthy", "data_issues": 0


-- =============================================
-- 2. GET YOUR USER ID
-- =============================================

SELECT id, email, name, points, stamps, pending_rewards_count 
FROM users 
WHERE email = 'your@email.com';  -- Replace with your email

-- Copy the 'id' value for next queries


-- =============================================
-- 3. CHECK LATEST GAME PLAY (Replace YOUR_USER_ID)
-- =============================================

SELECT 
  gp.id as game_play_id,
  gp.created_at,
  mg.display_name as game,
  gp.prize_type,
  gp.prize_value,
  gp.prize_label,
  gp.status as game_status,
  gp.pending_reward_id,
  pr.id as pending_id,
  pr.game_play_id,
  pr.status as pending_status,
  CASE 
    WHEN gp.pending_reward_id = pr.id AND pr.game_play_id = gp.id 
    THEN '✅ PROPERLY LINKED' 
    WHEN gp.pending_reward_id IS NULL AND gp.prize_type = 'nothing'
    THEN '✅ NOTHING PRIZE (NO PENDING NEEDED)'
    ELSE '❌ NOT LINKED' 
  END as link_status
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'YOUR_USER_ID'  -- Replace this
ORDER BY gp.created_at DESC
LIMIT 5;

-- Expected: link_status = '✅ PROPERLY LINKED' for prizes


-- =============================================
-- 4. CHECK ALL PENDING REWARDS
-- =============================================

SELECT 
  pr.id,
  pr.created_at,
  pr.reward_name,
  pr.reward_type,
  pr.amount,
  pr.status,
  pr.game_play_id,
  pr.claimed_at,
  EXTRACT(DAY FROM pr.expires_at - NOW()) as days_until_expiry,
  CASE 
    WHEN pr.game_play_id IS NOT NULL THEN '✅ Linked to game' 
    ELSE '❌ Orphaned' 
  END as link_status
FROM pending_rewards pr
WHERE pr.user_id = 'YOUR_USER_ID'  -- Replace this
ORDER BY pr.created_at DESC
LIMIT 10;

-- Expected: All should have game_play_id (not null)


-- =============================================
-- 5. CHECK FOR DATA ISSUES
-- =============================================

SELECT * FROM public.reconcile_pending_rewards();

-- Expected: Empty (no rows) = no issues
-- If you see "orphaned_pending", those are from BEFORE the fix


-- =============================================
-- 6. VERIFY USER PENDING COUNT IS ACCURATE
-- =============================================

SELECT 
  u.id,
  u.name,
  u.pending_rewards_count as recorded_count,
  COUNT(pr.id) as actual_count,
  CASE 
    WHEN u.pending_rewards_count = COUNT(pr.id) THEN '✅ ACCURATE' 
    ELSE '❌ MISMATCH' 
  END as status
FROM users u
LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
WHERE u.id = 'YOUR_USER_ID'  -- Replace this
GROUP BY u.id, u.name, u.pending_rewards_count;

-- Expected: status = '✅ ACCURATE'


-- =============================================
-- 7. COMPLETE ACTIVITY SUMMARY
-- =============================================

SELECT 
  'Total Games Played' as metric,
  COUNT(*)::text as value
FROM game_plays
WHERE user_id = 'YOUR_USER_ID'  -- Replace this

UNION ALL

SELECT 
  'Games Today',
  COUNT(*)::text
FROM game_plays
WHERE user_id = 'YOUR_USER_ID'  -- Replace this
  AND created_at >= CURRENT_DATE

UNION ALL

SELECT 
  'Pending Rewards',
  COUNT(*)::text
FROM pending_rewards
WHERE user_id = 'YOUR_USER_ID'  -- Replace this
  AND status = 'pending'

UNION ALL

SELECT 
  'Pending Points',
  COALESCE(SUM(amount), 0)::text
FROM pending_rewards
WHERE user_id = 'YOUR_USER_ID'  -- Replace this
  AND status = 'pending'
  AND reward_type = 'points'

UNION ALL

SELECT 
  'Pending Stamps',
  COALESCE(SUM(amount), 0)::text
FROM pending_rewards
WHERE user_id = 'YOUR_USER_ID'  -- Replace this
  AND status = 'pending'
  AND reward_type = 'stamps';


-- =============================================
-- 8. CHECK INDEXES EXIST
-- =============================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('game_plays', 'pending_rewards', 'users')
ORDER BY tablename, indexname;

-- Expected: Should see multiple indexes for each table


-- =============================================
-- 9. CHECK FUNCTIONS EXIST
-- =============================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'award_game_prize_pending',
    'reconcile_pending_rewards',
    'fix_pending_counts',
    'system_health_check'
  )
ORDER BY routine_name;

-- Expected: All 4 functions should exist


-- =============================================
-- 10. SYSTEM OVERVIEW
-- =============================================

SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM users

UNION ALL

SELECT 
  'Games Enabled',
  COUNT(*)::text
FROM mini_games
WHERE enabled = true

UNION ALL

SELECT 
  'Games Played Today',
  COUNT(*)::text
FROM game_plays
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT 
  'Total Pending Rewards',
  COUNT(*)::text
FROM pending_rewards
WHERE status = 'pending'

UNION ALL

SELECT 
  'Data Issues',
  COUNT(*)::text
FROM reconcile_pending_rewards()

UNION ALL

SELECT 
  'Orphaned Pending',
  COUNT(*)::text
FROM reconcile_pending_rewards()
WHERE issue_type = 'orphaned_pending';


-- =============================================
-- QUICK COPY-PASTE VERSION (Replace YOUR_USER_ID)
-- =============================================

-- Get user ID:
SELECT id FROM users WHERE email = 'your@email.com';

-- Check everything at once:
SELECT 
  gp.created_at,
  mg.display_name as game,
  gp.prize_value,
  gp.status,
  CASE 
    WHEN gp.pending_reward_id = pr.id AND pr.game_play_id = gp.id 
    THEN '✅ LINKED' 
    ELSE '❌ NOT LINKED' 
  END as status
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'YOUR_USER_ID'
ORDER BY gp.created_at DESC
LIMIT 3;


-- =============================================
-- SUCCESS CRITERIA
-- =============================================

/*
✅ System health shows "healthy"
✅ data_issues = 0
✅ All game plays have link_status = '✅ PROPERLY LINKED'
✅ All pending rewards have game_play_id (not null)
✅ User pending count matches actual count
✅ All 4 functions exist
✅ Multiple indexes exist
✅ No orphaned pending (for NEW games after fix)
*/
