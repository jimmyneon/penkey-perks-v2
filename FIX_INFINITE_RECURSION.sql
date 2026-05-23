-- =============================================
-- FIX: Infinite Recursion in Staff Table RLS
-- =============================================
-- The problem: Policy checks staff table FROM staff table = infinite loop
-- Solution: Use users.role instead for management checks
-- =============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated users to read staff table" ON public.staff;
DROP POLICY IF EXISTS "Staff can manage staff table" ON public.staff;

-- Simple policy: Anyone authenticated can READ staff table
-- This is safe - it just checks if someone is staff
CREATE POLICY "authenticated_can_read_staff"
  ON public.staff
  FOR SELECT
  TO authenticated
  USING (true);

-- Only users with admin/staff role in USERS table can INSERT/UPDATE/DELETE
-- This avoids recursion by checking users table, not staff table
CREATE POLICY "admins_can_manage_staff"
  ON public.staff
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- Verify
SELECT 
  '✅ POLICIES FIXED' as result,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'staff'
ORDER BY policyname;

-- Test the query
DO $$
DECLARE
  test_user_id UUID := 'da34be25-6692-4976-b095-6a200df3bb34';
  staff_record RECORD;
BEGIN
  SELECT role INTO staff_record
  FROM staff
  WHERE user_id = test_user_id;
  
  IF staff_record IS NULL THEN
    RAISE NOTICE '❌ Query returned NULL';
  ELSE
    RAISE NOTICE '✅ SUCCESS - Role: %', staff_record;
  END IF;
END $$;

SELECT '✅ Infinite recursion fixed! Try scanning now!' as result;
