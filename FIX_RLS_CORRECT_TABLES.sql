-- =============================================
-- FIX: RLS for correct tables (points_transactions & coffee_stamps)
-- =============================================

-- =============================================
-- POINTS_TRANSACTIONS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Authenticated users can view all transactions" ON public.points_transactions;

-- Allow all authenticated users to view all transactions (read-only)
CREATE POLICY "Authenticated users can view all transactions"
  ON public.points_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- COFFEE_STAMPS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own stamps" ON public.coffee_stamps;
DROP POLICY IF EXISTS "Authenticated users can view all stamps" ON public.coffee_stamps;

-- Allow all authenticated users to view all stamps (read-only)
CREATE POLICY "Authenticated users can view all stamps"
  ON public.coffee_stamps
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
  AND tablename IN ('points_transactions', 'coffee_stamps')
ORDER BY tablename, policyname;
