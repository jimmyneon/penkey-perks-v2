-- =============================================
-- FINAL COFFEE FIX - Run this ONLY
-- =============================================
-- This will fix the coffee stamp function once and for all

-- Step 1: Drop the broken check_and_issue_rewards function
DROP FUNCTION IF EXISTS public.check_and_issue_rewards(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_and_issue_rewards() CASCADE;

-- Step 2: Drop ALL versions of add_coffee_stamp
DROP FUNCTION IF EXISTS public.add_coffee_stamp(UUID, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.add_coffee_stamp(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.add_coffee_stamp(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.add_coffee_stamp() CASCADE;

-- Step 3: Create the correct version
CREATE FUNCTION public.add_coffee_stamp(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_location_valid BOOLEAN := FALSE;
  v_stamp_count INTEGER;
  v_last_stamp TIMESTAMP;
BEGIN
  -- Check rate limiting (max 1 stamp per hour)
  SELECT MAX(created_at) INTO v_last_stamp
  FROM public.coffee_stamps
  WHERE user_id = p_user_id;
  
  IF v_last_stamp IS NOT NULL AND (NOW() - v_last_stamp) < INTERVAL '1 hour' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You can only add one coffee stamp per hour'
    );
  END IF;
  
  -- Validate location if provided (GPS validation)
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location_valid := public.validate_location(p_latitude, p_longitude);
    
    IF NOT v_location_valid THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'You must be at Penkey to add a coffee stamp'
      );
    END IF;
  END IF;
  
  -- Add stamp
  INSERT INTO public.coffee_stamps (user_id, latitude, longitude, location_verified)
  VALUES (p_user_id, p_latitude, p_longitude, v_location_valid);
  
  -- Get new count
  SELECT COUNT(*) INTO v_stamp_count
  FROM public.coffee_stamps
  WHERE user_id = p_user_id;
  
  -- Check if reached 10 stamps milestone
  IF v_stamp_count % 10 = 0 THEN
    -- Auto-issue free coffee reward
    INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
    SELECT 
      p_user_id,
      id,
      'COFFEE-' || substr(md5(random()::text), 1, 12),
      NOW() + INTERVAL '30 days'
    FROM public.rewards
    WHERE name = 'Free Coffee' AND active = TRUE
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'stamp_count', v_stamp_count,
    'milestone_reached', v_stamp_count % 10 = 0,
    'message', CASE 
      WHEN v_stamp_count % 10 = 0 THEN 'Congratulations! You earned a free coffee!'
      ELSE 'Coffee stamp added! ' || (10 - (v_stamp_count % 10)) || ' more for a free coffee.'
    END
  );
END;
$$;

COMMENT ON FUNCTION public.add_coffee_stamp IS 'Add a coffee stamp with GPS validation and auto-reward at 10 stamps';

-- Step 4: Verify it was created correctly
SELECT 
  'SUCCESS: add_coffee_stamp function created!' as status,
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE proname = 'add_coffee_stamp'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
