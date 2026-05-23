-- =============================================
-- FIX: Allow staff to view customer points and stamps
-- =============================================

-- =============================================
-- USER_POINTS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;
DROP POLICY IF EXISTS "Staff can view all points" ON public.user_points;
DROP POLICY IF EXISTS "Authenticated users can view all points" ON public.user_points;

-- Allow all authenticated users to view all points (read-only)
CREATE POLICY "Authenticated users can view all points"
  ON public.user_points
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- USER_STAMPS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own stamps" ON public.user_stamps;
DROP POLICY IF EXISTS "Staff can view all stamps" ON public.user_stamps;
DROP POLICY IF EXISTS "Authenticated users can view all stamps" ON public.user_stamps;

-- Allow all authenticated users to view all stamps (read-only)
CREATE POLICY "Authenticated users can view all stamps"
  ON public.user_stamps
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- VERIFY
-- =============================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_points', 'user_stamps')
ORDER BY tablename, policyname;
