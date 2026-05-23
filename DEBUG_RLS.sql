-- Debug RLS issue

-- 1. Check if you can see your own record in user_points_balance
SELECT 
  '1. Your record in user_points_balance:' as info,
  *
FROM user_points_balance
WHERE user_id = auth.uid();

-- 2. Try with SECURITY DEFINER to bypass RLS
SELECT 
  '2. Direct query (bypassing RLS):' as info,
  total_points
FROM public.user_points_balance
WHERE user_id = auth.uid();

-- 3. Check what auth.uid() returns
SELECT 
  '3. Your user ID:' as info,
  auth.uid() as user_id;

-- 4. Check if the record exists at all (using service role)
-- This needs to be run as service role or with RLS disabled
SELECT 
  '4. Does record exist?:' as info,
  COUNT(*) as count,
  MAX(total_points) as max_points
FROM user_points_balance
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903';
