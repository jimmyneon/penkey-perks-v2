-- Debug why Amanda cannot scan but you can
-- Run these queries in Supabase SQL Editor

-- 1. Check Amanda's user record and role
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users
WHERE email ILIKE '%amanda%' OR name ILIKE '%amanda%';

-- 2. Check your user record for comparison
-- Replace with your email
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users
WHERE email = 'YOUR_EMAIL_HERE';

-- 3. Check if there's a staff table that might be interfering
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'staff'
) as staff_table_exists;

-- 4. If staff table exists, check its contents
SELECT * FROM staff;

-- 5. Check all RLS policies on user_rewards
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_rewards'
ORDER BY policyname;

-- 6. Check all RLS policies on pending_rewards
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pending_rewards'
ORDER BY policyname;

-- 7. Test if Amanda's role check works
-- Replace AMANDA_USER_ID with her actual UUID
SELECT 
  'Amanda role check' as test,
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = 'AMANDA_USER_ID'::uuid
    AND users.role IN ('staff', 'admin')
  ) as has_staff_access;

-- 8. Check all users with staff/admin roles
SELECT 
  id,
  email,
  name,
  role
FROM users
WHERE role IN ('staff', 'admin')
ORDER BY email;
