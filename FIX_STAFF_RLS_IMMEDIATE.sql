-- =============================================
-- IMMEDIATE FIX: Allow API to Read Staff Table
-- =============================================
-- The API is being blocked by RLS when trying to verify staff access
-- This adds a policy that allows authenticated users to read staff table
-- =============================================

-- Drop ALL existing policies on staff table
DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff;

-- Create a simple policy that allows ANY authenticated user to read staff table
-- This is needed for the API to verify if someone is staff
CREATE POLICY "Allow authenticated users to read staff table"
  ON public.staff
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow staff to manage (for admin operations)
CREATE POLICY "Staff can manage staff table"
  ON public.staff
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- Verify RLS is enabled
SELECT 
  '1️⃣ RLS STATUS' as check,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'staff';

-- Show new policies
SELECT 
  '2️⃣ NEW POLICIES' as check,
  policyname,
  cmd as command,
  roles,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'staff'
ORDER BY policyname;

-- Test with the user ID from logs
DO $$
DECLARE
  test_user_id UUID := 'da34be25-6692-4976-b095-6a200df3bb34';
  staff_record RECORD;
BEGIN
  RAISE NOTICE 'Testing API query for user: %', test_user_id;
  
  -- This is the exact query the API uses
  SELECT role INTO staff_record
  FROM staff
  WHERE user_id = test_user_id;
  
  IF staff_record IS NULL THEN
    RAISE NOTICE '❌ STILL BLOCKED - Query returned NULL';
    RAISE NOTICE '   Check if user exists in staff table';
  ELSE
    RAISE NOTICE '✅ SUCCESS - Query returned role: %', staff_record;
    RAISE NOTICE '   API should now work!';
  END IF;
END $$;

SELECT '✅ RLS policies updated - try scanning again!' as result;
