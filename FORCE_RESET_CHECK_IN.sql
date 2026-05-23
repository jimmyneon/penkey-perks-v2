-- =============================================
-- FORCE RESET CHECK-IN - EMERGENCY FIX
-- =============================================
-- Run this if the migration didn't apply properly

-- 1. Drop and recreate the can_check_in function to ensure it's using the new table
DROP FUNCTION IF EXISTS public.can_check_in(UUID);

CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_check_in TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check last check-in from check_ins table (NEW SYSTEM)
  SELECT MAX(checked_in_at) INTO last_check_in
  FROM public.check_ins
  WHERE user_id = p_user_id;
  
  -- If never checked in, allow it
  IF last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if it's a new day (midnight-to-midnight UK time)
  RETURN DATE(last_check_in AT TIME ZONE 'Europe/London') < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clear any check-ins from today
DELETE FROM public.check_ins
WHERE DATE(checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE;

-- 3. Test the function
SELECT 
  'Testing can_check_in function:' as test,
  can_check_in(auth.uid()) as result,
  'Should be TRUE' as expected;

-- 4. Show what's in check_ins table
SELECT 
  'Check-ins table contents:' as info,
  COUNT(*) as total_records,
  MAX(checked_in_at) as last_check_in
FROM public.check_ins;

-- 5. If you want to completely reset (CAREFUL - deletes all check-in history)
-- Uncomment the line below if you want to start fresh
-- DELETE FROM public.check_ins;

SELECT '✅ Check-in function reset! Try checking in now.' as message;
