-- =============================================
-- FIX: Remove circular dependency in staff RLS
-- =============================================
-- The issue: Staff policy checks users table, but needs access to users table to check!

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- =============================================
-- SOLUTION: Use a simpler approach
-- =============================================

-- 1. Everyone can view their own profile (no circular dependency)
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Users with staff/admin role can view ALL users
--    This works because they can first see themselves (policy #1)
--    Then this policy grants additional access
CREATE POLICY "Staff and admin can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- First check own record (which we can always see via policy #1)
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('staff', 'admin')
  );

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Admins can do everything
CREATE POLICY "Admins can manage all users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

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

-- Test as staff user (run after applying)
-- SELECT * FROM users WHERE id = auth.uid();
-- SELECT * FROM users LIMIT 5;
