-- =============================================
-- FIX POINTS SYSTEM RLS & SECURITY
-- =============================================
-- This ensures:
-- 1. All transactions are logged
-- 2. Users can only modify points via functions
-- 3. Users can view their own transactions
-- 4. Proper audit trail

-- 1. Ensure RLS is enabled
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view own points transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Prevent direct inserts" ON public.points_transactions;
DROP POLICY IF EXISTS "Prevent updates" ON public.points_transactions;
DROP POLICY IF EXISTS "Prevent deletes" ON public.points_transactions;

-- 3. Create secure policies

-- Allow users to view their own transactions
CREATE POLICY "Users can view own points transactions" 
  ON public.points_transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Prevent direct inserts (only via function with SECURITY DEFINER)
CREATE POLICY "Prevent direct inserts" 
  ON public.points_transactions
  FOR INSERT 
  WITH CHECK (false);

-- Prevent updates (transactions are immutable)
CREATE POLICY "Prevent updates" 
  ON public.points_transactions
  FOR UPDATE 
  USING (false);

-- Prevent deletes (transactions are permanent)
CREATE POLICY "Prevent deletes" 
  ON public.points_transactions
  FOR DELETE 
  USING (false);

-- 4. Verify add_points function (should already exist from main migration)
-- This is just to ensure it's correct
CREATE OR REPLACE FUNCTION public.add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  v_new_balance := public.get_user_points(p_user_id) + p_amount;
  
  -- Insert transaction (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.points_transactions (
    user_id, amount, balance_after, source, description, metadata
  ) VALUES (
    p_user_id, p_amount, v_new_balance, p_source, p_description, p_metadata
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add helpful comment
COMMENT ON TABLE public.points_transactions IS 'Immutable ledger of all point transactions. Users can only add via add_points() function.';
COMMENT ON FUNCTION public.add_points IS 'Securely add or remove points from user account. All transactions are logged.';
