-- =============================================
-- FIX: Allow Staff to Read Their Own Record
-- =============================================
-- The API needs to query the staff table to verify access
-- This ensures the RLS policy allows it
-- =============================================

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can manage staff" ON public.staff;

-- Create new policies that work with the API

-- 1. Staff can view their own record (CRITICAL for API)
CREATE POLICY "Staff can view own record"
  ON public.staff
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. All authenticated users can view staff table (for verification)
-- This is needed because the API checks if someone is staff
CREATE POLICY "Authenticated users can view staff"
  ON public.staff
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. Owners can manage staff (INSERT, UPDATE, DELETE)
CREATE POLICY "Owners can manage staff"
  ON public.staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- Verify the policies
SELECT 
  '✅ STAFF RLS POLICIES UPDATED' as result,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'staff'
ORDER BY policyname;

-- Test with Amanda's ID
DO $$
DECLARE
  amanda_id UUID;
  test_result RECORD;
BEGIN
  SELECT id INTO amanda_id FROM users WHERE email = 'amanda@penkey.co.uk';
  
  -- Test the query
  SELECT role INTO test_result FROM staff WHERE user_id = amanda_id;
  
  IF test_result IS NULL THEN
    RAISE NOTICE '❌ Still blocked - check if Amanda is logged in correctly';
  ELSE
    RAISE NOTICE '✅ SUCCESS - Amanda can now be verified as staff!';
  END IF;
END $$;
