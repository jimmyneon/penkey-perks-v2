-- =============================================
-- FIX USER_REWARDS AND REWARDS RLS POLICIES
-- Issue: Users cannot insert into user_rewards due to missing RLS policy
-- =============================================

-- =============================================
-- REWARDS TABLE (Catalog)
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards catalog" ON public.rewards;

-- Allow everyone to view active rewards (catalog)
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards
  FOR SELECT
  USING (active = true);

-- Allow admins to manage rewards catalog
CREATE POLICY "Admins can manage rewards catalog"
  ON public.rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('owner', 'employee')
    )
  );

-- =============================================
-- USER_REWARDS TABLE (User's redeemed rewards)
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can redeem rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.user_rewards;

-- Allow users to view their own rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own rewards (for redemptions)
CREATE POLICY "Users can insert own rewards"
  ON public.user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own rewards (for status changes)
CREATE POLICY "Users can update own rewards"
  ON public.user_rewards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow staff to redeem rewards (update status to 'redeemed')
CREATE POLICY "Staff can redeem rewards"
  ON public.user_rewards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- Allow admins full access
CREATE POLICY "Admins can manage all rewards"
  ON public.user_rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );
