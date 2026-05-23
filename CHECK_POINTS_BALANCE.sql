-- Check how points/beans are stored
-- Option 1: Check if there's a user_points or balances table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%point%' OR table_name LIKE '%balance%' OR table_name LIKE '%bean%')
ORDER BY table_name;

-- Option 2: Calculate balance from transactions
SELECT 
  'Your calculated balance from transactions:' as info,
  COALESCE(SUM(amount), 0) as total_beans
FROM points_transactions
WHERE user_id = auth.uid();
