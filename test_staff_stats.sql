-- Test queries for staff dashboard stats
-- Run these in Supabase SQL Editor to debug

-- 1. Check if pending_rewards table exists and has data
SELECT COUNT(*) as total_pending_rewards
FROM pending_rewards
WHERE status = 'pending';

-- 2. Check pending beans (sum of pending points)
SELECT 
  COUNT(*) as count_of_pending_points,
  SUM(amount) as total_pending_beans
FROM pending_rewards
WHERE status = 'pending' 
  AND reward_type = 'points';

-- 3. Check all pending rewards by type
SELECT 
  reward_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM pending_rewards
WHERE status = 'pending'
GROUP BY reward_type;

-- 4. Check active rewards
SELECT COUNT(*) as active_rewards_count
FROM user_rewards
WHERE status = 'active';

-- 5. Check all user_rewards statuses
SELECT 
  status,
  COUNT(*) as count
FROM user_rewards
GROUP BY status;

-- 6. Sample of pending rewards
SELECT 
  id,
  user_id,
  reward_type,
  amount,
  reward_name,
  status,
  earned_at
FROM pending_rewards
WHERE status = 'pending'
LIMIT 5;

-- 7. Sample of active rewards
SELECT 
  id,
  user_id,
  reward_name,
  status,
  created_at,
  expires_at
FROM user_rewards
WHERE status = 'active'
LIMIT 5;
