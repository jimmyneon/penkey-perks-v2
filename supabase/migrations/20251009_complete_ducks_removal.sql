-- =============================================
-- COMPLETE DUCKS TABLE REMOVAL & FIX CHECK-IN LOGIC
-- =============================================

-- 1. Drop old ducks table if it exists
DROP TABLE IF EXISTS public.ducks CASCADE;

-- 2. Update can_check_in to check points_transactions (for check-ins)
-- Check-ins award points, so we check the transactions table
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

-- 3. Remove old duck count function (no longer needed)
-- Skip this - function doesn't exist in this database

-- 4. Add helpful comments
COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in (24-hour cooldown based on points_transactions with source=visit)';
