-- =============================================
-- FINAL COMPREHENSIVE FIX - RUN THIS ONE
-- =============================================
-- This migration fixes ALL issues in one go

-- =============================================
-- 1. DROP OLD TABLES
-- =============================================

-- Drop ducks table completely (if exists)
DROP TABLE IF EXISTS public.ducks CASCADE;

-- =============================================
-- 2. FIX POINTS SYSTEM
-- =============================================

-- Ensure RLS is enabled on points_transactions
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on points_transactions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'points_transactions' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.points_transactions';
    END LOOP;
END $$;

-- Create secure policies
CREATE POLICY "Users can view own points transactions" 
  ON public.points_transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Prevent direct inserts" 
  ON public.points_transactions
  FOR INSERT 
  WITH CHECK (false);

CREATE POLICY "Prevent updates" 
  ON public.points_transactions
  FOR UPDATE 
  USING (false);

CREATE POLICY "Prevent deletes" 
  ON public.points_transactions
  FOR DELETE 
  USING (false);

-- =============================================
-- 3. FIX FUNCTIONS
-- =============================================

-- Fix get_user_points to query transactions directly
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM public.points_transactions WHERE user_id = p_user_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_lifetime_points to only count positive transactions
CREATE OR REPLACE FUNCTION public.get_lifetime_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM public.points_transactions 
     WHERE user_id = p_user_id AND amount > 0),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix can_check_in to check points_transactions (source='visit')
CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_check_in TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check last check-in from points_transactions (source = 'visit')
  SELECT MAX(created_at) INTO last_check_in
  FROM public.points_transactions
  WHERE user_id = p_user_id 
    AND source = 'visit';
  
  -- If never checked in, allow it
  IF last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if 24 hours have passed
  RETURN (NOW() - last_check_in) >= INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure add_points function is correct
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

-- =============================================
-- 4. ADD COMMENTS
-- =============================================

COMMENT ON TABLE public.points_transactions IS 'Immutable ledger of all point transactions. Users can only add via add_points() function.';
COMMENT ON FUNCTION public.add_points IS 'Securely add or remove points from user account. All transactions are logged.';
COMMENT ON FUNCTION public.get_user_points IS 'Get user current points balance by summing all transactions';
COMMENT ON FUNCTION public.get_lifetime_points IS 'Get total points ever earned (positive transactions only)';
COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in (24-hour cooldown based on points_transactions with source=visit)';

-- =============================================
-- 5. DROP OLD check_and_issue_rewards FUNCTION
-- =============================================
-- This function was calling get_user_duck_count which doesn't exist
-- It's not used in the new system, so just drop it

DROP FUNCTION IF EXISTS public.check_and_issue_rewards(UUID);

-- =============================================
-- DONE!
-- =============================================
