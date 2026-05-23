-- Find where points balance is stored

-- 1. Check if there's a user_points_balance table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%point%'
ORDER BY table_name;

-- 2. Check your balance in user_points_balance (if it exists)
SELECT * FROM user_points_balance WHERE user_id = auth.uid();

-- 3. Alternative: Check if there's a get_user_points function
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%point%' OR routine_name LIKE '%balance%')
ORDER BY routine_name;
