-- Check what happened during check-in

-- 1. Today's check-in record
SELECT 
  '1. Today''s check-in:' as info,
  checked_in_at,
  points_awarded,
  streak_count,
  streak_multiplier,
  metadata
FROM check_ins
WHERE user_id = auth.uid()
  AND DATE(checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE;

-- 2. Recent points transactions (last hour)
SELECT 
  '2. Recent transactions:' as info,
  created_at,
  amount,
  source,
  description
FROM points_transactions
WHERE user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 3. Pending rewards status
SELECT 
  '3. Pending rewards:' as info,
  id,
  amount,
  reward_name,
  status,
  earned_at,
  claimed_at
FROM pending_rewards
WHERE user_id = auth.uid()
ORDER BY earned_at DESC
LIMIT 10;

-- 4. Current balance
SELECT 
  '4. Current balance:' as info,
  get_user_points(auth.uid()) as balance;
