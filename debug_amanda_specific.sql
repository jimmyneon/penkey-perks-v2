-- Debug Amanda's specific access issue
-- Her role is 'staff' but she still can't scan
-- Run these in Supabase SQL Editor

-- 1. Test if Amanda's UUID works with the RLS policy
SELECT 
  'Testing Amanda RLS check' as test,
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = 'b700a10f-19d5-4a3a-a8e1-634080af1fa8'::uuid
    AND users.role IN ('staff', 'admin')
  ) as should_have_access;

-- 2. Check if Amanda's auth.uid() matches her users.id
-- This requires being logged in as Amanda, but we can check the structure
SELECT 
  id,
  email,
  name,
  role,
  created_at,
  updated_at
FROM users
WHERE id = 'b700a10f-19d5-4a3a-a8e1-634080af1fa8'::uuid;

-- 3. Check if there's an auth.users record for Amanda
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'amanda@penkey.co.uk';

-- 4. Verify the auth.users.id matches the public.users.id
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs Match'
    ELSE '❌ IDs DO NOT MATCH - THIS IS THE PROBLEM'
  END as id_match_status
FROM auth.users au
LEFT JOIN public.users u ON au.email = u.email
WHERE au.email = 'amanda@penkey.co.uk';

-- 5. Check all RLS policies that might affect Amanda
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'user_rewards', 'pending_rewards')
ORDER BY tablename, policyname;

-- 6. Test Amanda's access to user_rewards (as if she's logged in)
-- This simulates what happens when she tries to view rewards
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO json_build_object('sub', 'b700a10f-19d5-4a3a-a8e1-634080af1fa8')::text;

SELECT COUNT(*) as rewards_amanda_can_see
FROM user_rewards
WHERE status = 'active';

RESET role;
