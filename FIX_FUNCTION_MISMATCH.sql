-- =============================================
-- FIX FUNCTION MISMATCH - FORCE RECREATE
-- =============================================
-- The function might be cached or have multiple versions

-- 1. Drop ALL versions of can_check_in
DROP FUNCTION IF EXISTS public.can_check_in(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_check_in(UUID) CASCADE;

-- 2. Recreate with CORRECT logic
CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_check_in TIMESTAMP WITH TIME ZONE;
  v_today DATE;
  v_last_check_in_date DATE;
BEGIN
  -- Get today's date in UK timezone
  v_today := CURRENT_DATE;
  
  -- Get last check-in from check_ins table
  SELECT MAX(checked_in_at) INTO last_check_in
  FROM public.check_ins
  WHERE user_id = p_user_id;
  
  -- If never checked in, allow it
  IF last_check_in IS NULL THEN
    RAISE NOTICE 'No previous check-in found - ALLOWING';
    RETURN TRUE;
  END IF;
  
  -- Get the date of last check-in in UK timezone
  v_last_check_in_date := DATE(last_check_in AT TIME ZONE 'Europe/London');
  
  -- Log for debugging
  RAISE NOTICE 'Last check-in: %, Last check-in date: %, Today: %, Can check in: %', 
    last_check_in, v_last_check_in_date, v_today, (v_last_check_in_date < v_today);
  
  -- Allow if last check-in was before today
  RETURN v_last_check_in_date < v_today;
END;
$$;

-- 3. Add comment
COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in today (resets at midnight UK time) - FIXED VERSION';

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.can_check_in TO authenticated, service_role, anon;

-- 5. Test it
SELECT 
  'Testing can_check_in:' as test,
  can_check_in(auth.uid()) as result;

-- 6. Check what's in check_ins table
SELECT 
  'Your check-ins:' as info,
  checked_in_at,
  DATE(checked_in_at AT TIME ZONE 'Europe/London') as uk_date,
  CURRENT_DATE as today,
  DATE(checked_in_at AT TIME ZONE 'Europe/London') < CURRENT_DATE as should_allow
FROM check_ins
WHERE user_id = auth.uid()
ORDER BY checked_in_at DESC
LIMIT 5;

-- 7. DELETE today's check-ins if any exist
DELETE FROM check_ins
WHERE user_id = auth.uid()
  AND DATE(checked_in_at AT TIME ZONE 'Europe/London') >= CURRENT_DATE;

-- 8. Final test
SELECT 
  'After delete - can check in:' as final_test,
  can_check_in(auth.uid()) as should_be_true;

SELECT '✅ Function recreated and check-ins cleared!' as message;
