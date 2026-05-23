-- =============================================
-- CHECK PENDING SYSTEM IS WORKING
-- =============================================

-- 1. Get your user ID
SELECT id, email, name, points, stamps, pending_rewards_count 
FROM users 
WHERE email = 'your@email.com';  -- Replace with your email

-- Copy the user ID for next queries

-- =============================================
-- 2. CHECK LATEST GAME PLAY
-- =============================================

SELECT 
  gp.id,
  gp.created_at,
  mg.display_name as game,
  gp.prize_type,
  gp.prize_value,
  gp.prize_label,
  gp.status,
  gp.pending_reward_id,
  CASE 
    WHEN gp.pending_reward_id IS NOT NULL THEN '✅ Has pending link'
    ELSE '❌ No pending link'
  END as has_link
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
WHERE gp.user_id = 'YOUR_USER_ID'  -- Replace this
ORDER BY gp.created_at DESC
LIMIT 3;

-- =============================================
-- 3. CHECK PENDING REWARDS
-- =============================================

SELECT 
  pr.id,
  pr.created_at,
  pr.reward_name,
  pr.reward_type,
  pr.amount,
  pr.status,
  pr.game_play_id,
  CASE 
    WHEN pr.game_play_id IS NOT NULL THEN '✅ Linked to game'
    ELSE '❌ Orphaned'
  END as has_link
FROM pending_rewards pr
WHERE pr.user_id = 'YOUR_USER_ID'  -- Replace this
ORDER BY pr.created_at DESC
LIMIT 5;

-- =============================================
-- 4. CHECK USER PENDING COUNT
-- =============================================

SELECT 
  u.id,
  u.name,
  u.pending_rewards_count as recorded_count,
  COUNT(pr.id) as actual_pending_count,
  CASE 
    WHEN u.pending_rewards_count = COUNT(pr.id) THEN '✅ MATCH'
    ELSE '❌ MISMATCH - Need to fix'
  END as status
FROM users u
LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
WHERE u.id = 'YOUR_USER_ID'  -- Replace this
GROUP BY u.id, u.name, u.pending_rewards_count;

-- =============================================
-- 5. FIX PENDING COUNT (if needed)
-- =============================================

SELECT public.fix_pending_counts();

-- =============================================
-- 6. CHECK SYSTEM HEALTH
-- =============================================

SELECT public.system_health_check();

-- =============================================
-- 7. CHECK FOR ISSUES
-- =============================================

SELECT * FROM public.reconcile_pending_rewards();

-- =============================================
-- QUICK DIAGNOSTIC
-- =============================================

-- All in one query (Replace YOUR_USER_ID):
SELECT 
  'Game Plays Today' as metric,
  COUNT(*)::text as value
FROM game_plays
WHERE user_id = 'YOUR_USER_ID'
  AND created_at >= CURRENT_DATE

UNION ALL

SELECT 
  'Pending Rewards',
  COUNT(*)::text
FROM pending_rewards
WHERE user_id = 'YOUR_USER_ID'
  AND status = 'pending'

UNION ALL

SELECT 
  'User Pending Count',
  pending_rewards_count::text
FROM users
WHERE id = 'YOUR_USER_ID';
