-- =============================================
-- FIX STAFF RLS POLICIES FOR DASHBOARD STATS
-- =============================================
-- Issue: Staff cannot view pending_rewards and user_rewards for dashboard stats
-- Solution: Add policies that check users.role instead of staff table
-- =============================================

-- =============================================
-- 1. FIX PENDING_REWARDS RLS
-- =============================================

-- Add policy for staff/admin to view all pending rewards
DROP POLICY IF EXISTS "Staff can view all pending rewards" ON public.pending_rewards;
CREATE POLICY "Staff can view all pending rewards"
  ON public.pending_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- =============================================
-- 2. FIX USER_REWARDS RLS
-- =============================================

-- The existing "Staff can view all rewards" policy checks for staff table
-- which doesn't exist. Let's drop it and recreate with correct logic.

DROP POLICY IF EXISTS "Staff can view all rewards" ON public.user_rewards;
CREATE POLICY "Staff can view all rewards"
  ON public.user_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- Also fix the update policy
DROP POLICY IF EXISTS "Staff can update rewards" ON public.user_rewards;
CREATE POLICY "Staff can update rewards"
  ON public.user_rewards
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

-- =============================================
-- 3. VERIFY POLICIES
-- =============================================

-- Check pending_rewards policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'pending_rewards'
ORDER BY policyname;

-- Check user_rewards policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_rewards'
ORDER BY policyname;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Staff RLS policies fixed!' as message;
SELECT 'Staff can now view pending_rewards for dashboard stats' as fix1;
SELECT 'Staff can now view user_rewards for dashboard stats' as fix2;
