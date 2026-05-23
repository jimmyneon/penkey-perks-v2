-- =============================================
-- FIX ALL RLS POLICIES FOR REWARDS SYSTEM
-- =============================================
-- Issue: user_rewards and rewards tables returning 0 rows due to RLS

-- =============================================
-- 1. FIX REWARDS TABLE RLS (Catalog)
-- =============================================

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards catalog" ON public.rewards;
DROP POLICY IF EXISTS "Users can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Public can view active rewards" ON public.rewards;

-- Allow EVERYONE to view active rewards (no auth required)
CREATE POLICY "Public can view active rewards"
  ON public.rewards
  FOR SELECT
  USING (active = true);

-- Allow authenticated users to view all rewards
CREATE POLICY "Authenticated users can view all rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage rewards
CREATE POLICY "Admins can manage rewards"
  ON public.rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- =============================================
-- 2. FIX USER_REWARDS TABLE RLS
-- =============================================

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can redeem rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.user_rewards;

-- Allow users to SELECT their own rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to INSERT their own rewards (when redeeming)
CREATE POLICY "Users can insert own rewards"
  ON public.user_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own rewards
CREATE POLICY "Users can update own rewards"
  ON public.user_rewards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow staff to view all rewards
CREATE POLICY "Staff can view all rewards"
  ON public.user_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- Allow staff to update rewards (for redemption)
CREATE POLICY "Staff can update rewards"
  ON public.user_rewards
  FOR UPDATE
  TO authenticated
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
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- =============================================
-- 3. VERIFY POLICIES
-- =============================================

-- Show all policies on rewards table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rewards'
ORDER BY policyname;

-- Show all policies on user_rewards table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_rewards'
ORDER BY policyname;

-- =============================================
-- 4. TEST QUERIES (Run as authenticated user)
-- =============================================

-- Test 1: Can you see rewards?
SELECT COUNT(*) as rewards_count FROM public.rewards WHERE active = true;

-- Test 2: Can you see your user_rewards?
SELECT COUNT(*) as user_rewards_count FROM public.user_rewards WHERE user_id = auth.uid();

-- Test 3: Full join test
SELECT 
  ur.id,
  ur.reward_id,
  r.name as reward_name
FROM public.user_rewards ur
LEFT JOIN public.rewards r ON ur.reward_id = r.id
WHERE ur.user_id = auth.uid()
  AND ur.status = 'active';
