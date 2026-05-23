-- Check your current balance

SELECT get_user_points('a409b642-e4e9-4159-a47c-c8a14b9bc903') as current_balance;

-- Check recent transactions (last 10)
SELECT 
  created_at,
  amount,
  source,
  description,
  balance_after
FROM points_transactions
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
ORDER BY created_at DESC
LIMIT 10;

-- Check if pending rewards were claimed
SELECT 
  COUNT(*) as claimed_count,
  SUM(amount) as total_claimed
FROM pending_rewards
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903'
  AND status = 'claimed'
  AND claimed_at > NOW() - INTERVAL '1 hour';
