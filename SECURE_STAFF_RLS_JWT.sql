-- =============================================
-- SECURE SOLUTION: Use JWT claims for role checking
-- =============================================
-- This avoids circular dependencies by storing role in JWT

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff and admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP FUNCTION IF EXISTS public.is_staff_or_admin();

-- =============================================
-- POLICIES USING JWT CLAIMS
-- =============================================

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Staff/Admin can view all users (using JWT claim)
--    Note: You need to set user_role in JWT claims via Supabase Auth hooks
CREATE POLICY "Staff can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('staff', 'admin')
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('staff', 'admin')
  );

-- 3. Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- TRIGGER: Sync role to JWT metadata
-- =============================================
-- This function updates the JWT metadata when role changes

CREATE OR REPLACE FUNCTION public.sync_role_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS sync_role_to_jwt_trigger ON public.users;
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_jwt();

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

-- =============================================
-- IMPORTANT: After running this
-- =============================================
-- 1. All existing users need to log out and log back in
-- 2. Their JWT will be refreshed with the role claim
-- 3. Then the policies will work correctly
