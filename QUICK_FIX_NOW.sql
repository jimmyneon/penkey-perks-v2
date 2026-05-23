-- =============================================
-- QUICK FIX: Allow authenticated users to view all users
-- =============================================
-- This is the fastest way to get staff scanner working

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Staff and admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- Simple policy: All authenticated users can view all users (read-only)
CREATE POLICY "Authenticated users can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can still only update their own profile
-- (this policy should already exist, but just in case)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
