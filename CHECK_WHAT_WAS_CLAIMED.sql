-- Check what was claimed and what's still pending

-- 1. Check pending rewards (should be empty after claim)
SELECT 
  '1. Still pending:' as info,
  id,
  reward_type,
  amount,
  reward_name,
  status,
  earned_at,
  claimed_at
FROM pending_rewards
WHERE user_id = auth.uid()
  AND status = 'pending'
ORDER BY earned_at DESC;

-- 2. Check what was claimed today
SELECT 
  '2. Claimed today:' as info,
  id,
  reward_type,
  amount,
  reward_name,
  status,
  earned_at,
  claimed_at
FROM pending_rewards
WHERE user_id = auth.uid()
  AND status = 'claimed'
  AND DATE(claimed_at) = CURRENT_DATE
ORDER BY claimed_at DESC;

-- 3. Check recent points transactions
SELECT 
  '3. Recent transactions:' as info,
  created_at,
  amount,
  source,
  description
FROM points_transactions
WHERE user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. Summary
SELECT 
  '4. Summary:' as info,
  (SELECT SUM(amount) FROM pending_rewards WHERE user_id = auth.uid() AND status = 'pending' AND reward_type = 'points') as still_pending,
  (SELECT SUM(amount) FROM pending_rewards WHERE user_id = auth.uid() AND status = 'claimed' AND reward_type = 'points' AND DATE(claimed_at) = CURRENT_DATE) as claimed_today,
  get_user_points(auth.uid()) as current_balance;
