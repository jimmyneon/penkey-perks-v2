-- =============================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR NOW
-- This fixes the rewards redemption and display issue
-- =============================================

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('rewards', 'user_rewards') 
ORDER BY tablename, policyname;

-- =============================================
-- FIX REWARDS TABLE (Catalog)
-- =============================================

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
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
-- FIX USER_REWARDS TABLE (User's redeemed rewards)
-- =============================================

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can redeem rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.user_rewards;

-- Allow users to view their own rewards (CRITICAL FOR DISPLAY)
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own rewards (CRITICAL FOR REDEMPTION)
CREATE POLICY "Users can insert own rewards"
  ON public.user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own rewards
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

-- =============================================
-- VERIFY THE POLICIES WERE CREATED
-- =============================================

SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Allows viewing'
    WHEN cmd = 'INSERT' THEN 'Allows creating'
    WHEN cmd = 'UPDATE' THEN 'Allows updating'
    WHEN cmd = 'ALL' THEN 'Allows everything'
  END as description
FROM pg_policies 
WHERE tablename IN ('rewards', 'user_rewards')
ORDER BY tablename, policyname;

-- =============================================
-- TEST QUERY - Check if you can see your rewards
-- =============================================

-- This should return your redeemed rewards
SELECT 
  ur.id,
  ur.status,
  ur.created_at,
  r.name as reward_name,
  r.description
FROM public.user_rewards ur
JOIN public.rewards r ON ur.reward_id = r.id
WHERE ur.user_id = auth.uid()
ORDER BY ur.created_at DESC;

-- Success message
SELECT '✅ RLS Policies have been applied! Refresh your /rewards page to see your rewards.' as message;
