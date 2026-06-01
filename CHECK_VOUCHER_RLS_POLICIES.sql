-- ============================================================================
-- CHECK VOUCHER RLS POLICIES IN DETAIL
-- ============================================================================
-- This file specifically checks if RLS policies are preventing voucher access
-- ============================================================================

-- 1. CHECK IF RLS IS ENABLED
-- ============================================================================
SELECT 'Checking RLS enabled status...' as step;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
FROM pg_tables
WHERE tablename IN ('user_vouchers', 'voucher_templates')
  AND schemaname = 'public';

-- 2. LIST ALL RLS POLICIES ON user_vouchers
-- ============================================================================
SELECT 'Listing all RLS policies on user_vouchers...' as step;

SELECT 
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'user_vouchers'
  AND schemaname = 'public';

-- 3. LIST ALL RLS POLICIES ON voucher_templates
-- ============================================================================
SELECT 'Listing all RLS policies on voucher_templates...' as step;

SELECT 
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'voucher_templates'
  AND schemaname = 'public';

-- 4. TEST RLS POLICY BY CHECKING CURRENT USER
-- ============================================================================
SELECT 'Testing RLS with current user context...' as step;

-- This will show what the current auth.uid() would be
-- Run this while logged in as a test user
SELECT 
  auth.uid() as current_auth_uid,
  auth.role() as current_role;

-- 5. SIMULATE USER QUERY (REPLACE WITH ACTUAL USER_ID)
-- ============================================================================
SELECT 'Simulating user query (replace YOUR_USER_ID)...' as step;

-- This simulates what the dashboard does
-- Replace 'YOUR_USER_ID_HERE' with an actual user UUID to test
-- SELECT 
--   uv.id,
--   uv.user_id,
--   uv.voucher_template_id,
--   uv.status,
--   uv.qr_code,
--   uv.expires_at,
--   uv.created_at
-- FROM public.user_vouchers uv
-- WHERE uv.user_id = 'YOUR_USER_ID_HERE'
--   AND uv.status = 'active'
-- ORDER BY uv.created_at DESC;

-- 6. CHECK IF POLICIES USE auth.uid() CORRECTLY
-- ============================================================================
SELECT 'Checking if policies reference auth.uid()...' as step;

SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual ILIKE '%auth.uid()%' THEN 'YES - uses auth.uid()'
    WHEN with_check ILIKE '%auth.uid()%' THEN 'YES - uses auth.uid()'
    ELSE 'NO - does not use auth.uid()'
  END as uses_auth_uid
FROM pg_policies
WHERE tablename = 'user_vouchers'
  AND schemaname = 'public';

-- 7. CHECK FOR STAFF ROLES TABLE (USED IN RLS POLICIES)
-- ============================================================================
SELECT 'Checking staff_roles table existence and data...' as step;

SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'staff_roles' 
    AND table_schema = 'public'
  ) as staff_roles_exists;

-- If table exists, check its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'staff_roles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any staff members
SELECT 
  user_id,
  role,
  created_at
FROM public.staff_roles
LIMIT 10;

-- 8. CHECK IF THERE ARE ANY RLS POLICY CONFLICTS
-- ============================================================================
SELECT 'Checking for potential RLS policy conflicts...' as step;

-- Check if there are multiple policies for the same operation
SELECT 
  cmd as operation,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE tablename = 'user_vouchers'
  AND schemaname = 'public'
GROUP BY cmd
HAVING COUNT(*) > 1;
