-- Fix RLS on points_transactions table

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'points_transactions';

-- Drop any restrictive policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.points_transactions;

-- Create proper policies
CREATE POLICY "Users can view their own transactions"
  ON public.points_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions"
  ON public.points_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;

-- Test it
SELECT COUNT(*), SUM(amount) as balance
FROM public.points_transactions
WHERE user_id = auth.uid();

-- Test get_user_points
SELECT get_user_points(auth.uid()) as balance;
