-- Check if add_points function exists and works

-- 1. Check if the function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'add_points';

-- 2. Try calling it manually (test with 1 bean)
SELECT add_points(
  p_user_id := auth.uid(),
  p_amount := 1,
  p_source := 'test',
  p_description := 'Test transaction'
) as new_balance;

-- 3. Check if the test transaction was created
SELECT * FROM points_transactions
WHERE user_id = auth.uid()
  AND source = 'test'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Check current balance after test
SELECT get_user_points(auth.uid()) as balance_after_test;
