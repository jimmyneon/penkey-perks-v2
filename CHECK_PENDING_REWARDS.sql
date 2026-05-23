-- =============================================
-- CHECK PENDING REWARDS STATUS
-- =============================================

-- 1. Check your current pending rewards
SELECT 
  '1. Your pending rewards:' as info,
  id,
  reward_type,
  amount,
  reward_name,
  source,
  status,
  earned_at,
  expires_at,
  claimed_at
FROM pending_rewards
WHERE user_id = auth.uid()
ORDER BY earned_at DESC;

-- 2. Check your beans balance (using get_user_points function)
SELECT 
  '2. Your current beans:' as info,
  get_user_points(auth.uid()) as current_beans,
  get_lifetime_points(auth.uid()) as lifetime_beans;

-- 3. Check recent points transactions
SELECT 
  '3. Recent points transactions:' as info,
  created_at,
  amount,
  source,
  description
FROM points_transactions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check today's check-in
SELECT 
  '4. Today''s check-in:' as info,
  checked_in_at,
  points_awarded,
  streak_count,
  streak_multiplier
FROM check_ins
WHERE user_id = auth.uid()
  AND DATE(checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE;

-- 5. Summary
SELECT 
  '5. Summary:' as info,
  (SELECT COUNT(*) FROM pending_rewards WHERE user_id = auth.uid() AND status = 'pending') as pending_count,
  (SELECT SUM(amount) FROM pending_rewards WHERE user_id = auth.uid() AND status = 'pending' AND reward_type = 'points') as pending_beans,
  (SELECT SUM(amount) FROM pending_rewards WHERE user_id = auth.uid() AND status = 'claimed' AND reward_type = 'points') as claimed_beans,
  get_user_points(auth.uid()) as current_balance;
