-- =============================================
-- FIX: Use a function to check staff role (bypasses RLS)
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff and admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create a function to check if user is staff (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO authenticated;

-- =============================================
-- Now create policies using the function
-- =============================================

-- 1. Everyone can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Staff can view all users (uses function that bypasses RLS)
CREATE POLICY "Staff and admin can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

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
  USING (public.is_staff_or_admin());

-- =============================================
-- VERIFY
-- =============================================

SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Test the function
SELECT public.is_staff_or_admin() as am_i_staff;
