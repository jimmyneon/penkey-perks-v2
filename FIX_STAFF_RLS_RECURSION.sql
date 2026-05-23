-- =============================================
-- FIX STAFF TABLE RLS INFINITE RECURSION
-- =============================================
-- This fixes the infinite recursion error in staff table policies
-- =============================================

-- Drop all existing policies on staff table
DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
DROP POLICY IF EXISTS "Staff can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Users can view staff table" ON public.staff;
DROP POLICY IF EXISTS "Anyone can view staff" ON public.staff;
DROP POLICY IF EXISTS "Service role full access" ON public.staff;

-- Create simple, non-recursive policies
-- Policy 1: Allow users to view the staff table (to check if they're staff)
CREATE POLICY "Allow authenticated users to view staff"
  ON public.staff
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access to staff"
  ON public.staff
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'staff';

-- Success message
SELECT '✅ Staff RLS policies fixed - infinite recursion resolved!' as message;
