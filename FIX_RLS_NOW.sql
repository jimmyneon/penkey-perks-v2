-- =============================================
-- APPLY THIS IN SUPABASE SQL EDITOR NOW
-- =============================================
-- This fixes RLS policies so you can see your rewards

-- Fix rewards table RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards catalog" ON public.rewards;
DROP POLICY IF EXISTS "Users can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Public can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Authenticated users can view all rewards" ON public.rewards;

-- Allow authenticated users to view all rewards
CREATE POLICY "Authenticated users can view all rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix user_rewards table RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can redeem rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can view all rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can update rewards" ON public.user_rewards;

-- Allow users to SELECT their own rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to INSERT their own rewards
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

-- Test the fix
SELECT 'Rewards count:' as test, COUNT(*) as count FROM public.rewards WHERE active = true
UNION ALL
SELECT 'User rewards count:' as test, COUNT(*) as count FROM public.user_rewards WHERE user_id = auth.uid();
