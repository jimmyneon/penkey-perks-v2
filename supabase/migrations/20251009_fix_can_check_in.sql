-- =============================================
-- FIX: Update can_check_in to use coffee_stamps
-- =============================================
-- The old function still references 'ducks' table
-- This updates it to use 'coffee_stamps' table

-- Update can_check_in function to use coffee_stamps
CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_check_in TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check last stamp from coffee_stamps table (not ducks)
  SELECT MAX(created_at) INTO last_check_in
  FROM public.coffee_stamps
  WHERE user_id = p_user_id;
  
  -- If never checked in, allow it
  IF last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if 24 hours have passed
  RETURN (NOW() - last_check_in) >= INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in (24-hour cooldown based on coffee_stamps table)';
