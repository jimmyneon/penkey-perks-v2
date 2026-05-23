-- Fix get_user_points to use user_points_balance table instead

CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Use user_points_balance table (faster and more reliable)
  RETURN COALESCE(
    (SELECT total_points FROM public.user_points_balance WHERE user_id = p_user_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_points IS 'Get user current points balance from user_points_balance table';

-- Test it
SELECT get_user_points(auth.uid()) as balance;
