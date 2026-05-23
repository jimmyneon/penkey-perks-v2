-- Debug the entire points system

-- 1. Check if user_points_balance table exists
SELECT 
  '1. Points balance table:' as info,
  * 
FROM user_points_balance 
WHERE user_id = auth.uid();

-- 2. Check all points transactions
SELECT 
  '2. All points transactions:' as info,
  created_at,
  amount,
  source,
  description,
  balance_after
FROM points_transactions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 20;

-- 3. Calculate balance from transactions
SELECT 
  '3. Calculated from transactions:' as info,
  SUM(amount) as total_from_transactions
FROM points_transactions
WHERE user_id = auth.uid();

-- 4. Check what get_user_points returns
SELECT 
  '4. get_user_points function:' as info,
  get_user_points(auth.uid()) as function_result;

-- 5. Check pending_rewards table
SELECT 
  '5. All pending_rewards (any status):' as info,
  COUNT(*) as total_count,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_sum,
  SUM(CASE WHEN status = 'claimed' THEN amount ELSE 0 END) as claimed_sum,
  SUM(CASE WHEN status = 'expired' THEN amount ELSE 0 END) as expired_sum
FROM pending_rewards
WHERE user_id = auth.uid()
  AND reward_type = 'points';
