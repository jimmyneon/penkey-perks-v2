-- Simple diagnostic - what's in points_transactions?

SELECT 
  COUNT(*) as total_transactions,
  SUM(amount) as total_balance,
  MAX(created_at) as last_transaction
FROM points_transactions
WHERE user_id = auth.uid();

-- Show last 5 transactions
SELECT 
  created_at,
  amount,
  source,
  description
FROM points_transactions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
