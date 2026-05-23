-- Fix get_user_points - user_points_balance is a VIEW, not a table
-- Views inherit RLS from underlying tables, so we just need to grant SELECT

-- Grant permissions on the view
GRANT SELECT ON public.user_points_balance TO authenticated, anon;

-- Update function to use the view with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Query the view (it will use the underlying table's RLS)
  SELECT total_points INTO v_balance
  FROM public.user_points_balance
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_points IS 'Get user current points balance from user_points_balance view';

-- Test it
SELECT get_user_points(auth.uid()) as balance;
