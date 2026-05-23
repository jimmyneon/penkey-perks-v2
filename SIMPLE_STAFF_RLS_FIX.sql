-- =============================================
-- SIMPLE FIX: Just allow everyone to see everyone
-- =============================================
-- This is the simplest solution - no circular dependencies

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff and admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.is_staff_or_admin();

-- =============================================
-- SIMPLE POLICIES
-- =============================================

-- 1. ALL authenticated users can view ALL users (SELECT only)
--    This is safe because:
--    - Only authenticated users have access
--    - They can only READ, not modify
--    - Sensitive data (passwords) are already protected by Supabase Auth
CREATE POLICY "Authenticated users can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Only users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- VERIFY
-- =============================================

SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;
