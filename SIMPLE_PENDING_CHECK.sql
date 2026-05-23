-- Simple check - exactly what the frontend queries

-- 1. What user are you?
SELECT 
  '1. Your user ID:' as info,
  auth.uid() as user_id,
  email
FROM users
WHERE id = auth.uid();

-- 2. Exact query the frontend uses
SELECT 
  '2. Pending rewards (exact frontend query):' as info,
  id,
  amount,
  reward_name,
  reward_type,
  status,
  earned_at,
  expires_at
FROM pending_rewards
WHERE user_id = auth.uid()
  AND reward_type = 'points'
  AND status = 'pending';

-- 3. Sum of pending (what the counter shows)
SELECT 
  '3. Total pending (what counter shows):' as info,
  SUM(amount) as total_pending
FROM pending_rewards
WHERE user_id = auth.uid()
  AND reward_type = 'points'
  AND status = 'pending';

-- 4. ALL pending_rewards for your user (any status)
SELECT 
  '4. ALL your pending_rewards:' as info,
  id,
  amount,
  reward_name,
  reward_type,
  status,
  earned_at,
  expires_at,
  claimed_at
FROM pending_rewards
WHERE user_id = auth.uid()
ORDER BY earned_at DESC;
