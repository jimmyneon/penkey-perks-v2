-- =============================================
-- FIXED: Allow Staff to View Customers AND Themselves
-- =============================================
-- Copy and paste this into Supabase SQL Editor and run it

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;

-- Allow users to view their own profile (MUST BE FIRST)
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow staff to view all users (in addition to their own)
CREATE POLICY "Staff can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users staff_user
      WHERE staff_user.id = auth.uid()
      AND staff_user.role IN ('staff', 'admin')
    )
  );

-- Verify it worked
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;
