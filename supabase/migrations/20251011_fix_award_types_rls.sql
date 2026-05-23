-- =============================================
-- FIX AWARD TYPE LIMITS RLS
-- =============================================
-- Issue: Award types not showing due to RLS circular reference
-- Solution: Use is_staff_or_admin() function

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active award types" ON public.award_type_limits;
DROP POLICY IF EXISTS "Admins can manage award types" ON public.award_type_limits;
DROP POLICY IF EXISTS "Staff can create awards" ON public.manual_points_awards;
DROP POLICY IF EXISTS "Staff can view own awards" ON public.manual_points_awards;
DROP POLICY IF EXISTS "Admins can view all awards" ON public.manual_points_awards;
DROP POLICY IF EXISTS "Admins can update awards" ON public.manual_points_awards;

-- =============================================
-- AWARD TYPE LIMITS POLICIES
-- =============================================

-- Staff and admins can view all award types
CREATE POLICY "Staff can view award types"
  ON public.award_type_limits
  FOR SELECT
  TO authenticated
  USING (
    active = true 
    AND public.is_staff_or_admin()
  );

-- Admins can manage award types
CREATE POLICY "Admins can manage award types"
  ON public.award_type_limits
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin());

-- =============================================
-- MANUAL POINTS AWARDS POLICIES
-- =============================================

-- Staff can create awards
CREATE POLICY "Staff can create awards"
  ON public.manual_points_awards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_staff_or_admin()
    AND staff_id = auth.uid()
  );

-- Staff can view their own awards, admins can view all
CREATE POLICY "Staff can view awards"
  ON public.manual_points_awards
  FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid()
    OR public.is_staff_or_admin()
  );

-- Admins can update awards (for approval)
CREATE POLICY "Admins can update awards"
  ON public.manual_points_awards
  FOR UPDATE
  TO authenticated
  USING (public.is_staff_or_admin());
