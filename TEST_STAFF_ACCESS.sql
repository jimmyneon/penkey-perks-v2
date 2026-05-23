-- =============================================
-- TEST: Can staff see themselves?
-- =============================================
-- Run this while logged in as staff user in Supabase

-- Test 1: Can you see your own user record?
SELECT 
  id,
  email,
  role,
  name
FROM public.users
WHERE id = auth.uid();

-- Test 2: What is your current user ID?
SELECT auth.uid() as my_user_id;

-- Test 3: Check if you exist in users table
SELECT COUNT(*) as user_exists
FROM public.users
WHERE id = auth.uid();

-- Test 4: Try to see all users (should work if you're staff)
SELECT 
  id,
  email,
  role,
  name
FROM public.users
LIMIT 5;
