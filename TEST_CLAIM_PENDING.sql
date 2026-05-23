-- Test claim_pending_rewards function

-- 1. Check what's pending before claim
SELECT 
  '1. Before claim:' as step,
  COUNT(*) as count,
  SUM(amount) as total_beans
FROM pending_rewards
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
  AND reward_type = 'points'
  AND status = 'pending';

-- 2. Test the claim function
SELECT claim_pending_rewards(
  'a409b642-e4e9-4159-a47c-c8a14b9bc903'::uuid,
  NULL,
  NULL
) as claim_result;

-- 3. Check what's pending after claim
SELECT 
  '3. After claim:' as step,
  COUNT(*) as count,
  SUM(amount) as total_beans
FROM pending_rewards
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
  AND reward_type = 'points'
  AND status = 'pending';

-- 4. Check balance after claim
SELECT get_user_points('a409b642-e4e9-4159-a47c-c8a14b9bc903') as new_balance;
