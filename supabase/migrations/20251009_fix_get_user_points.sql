-- =============================================
-- FIX: get_user_points to query transactions directly
-- =============================================
-- This ensures the function works with RLS enabled

-- Update get_user_points to query transactions table directly
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Calculate balance directly from transactions table
  -- SECURITY DEFINER allows this to bypass RLS
  RETURN COALESCE(
    (SELECT SUM(amount) FROM public.points_transactions WHERE user_id = p_user_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_lifetime_points to only count positive transactions
CREATE OR REPLACE FUNCTION public.get_lifetime_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Sum only positive transactions (earned points, not spent)
  RETURN COALESCE(
    (SELECT SUM(amount) FROM public.points_transactions 
     WHERE user_id = p_user_id AND amount > 0),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: VIEWs inherit RLS from underlying tables automatically
-- No need to add policies to the view itself

-- Add helpful comments
COMMENT ON FUNCTION public.get_user_points IS 'Get user current points balance by summing all transactions';
COMMENT ON FUNCTION public.get_lifetime_points IS 'Get total points ever earned (positive transactions only)';
