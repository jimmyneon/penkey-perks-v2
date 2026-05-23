-- =============================================
-- Fix add_coffee_stamp - Cap at 10, no auto-reset
-- =============================================

CREATE OR REPLACE FUNCTION public.add_coffee_stamp(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_location_valid BOOLEAN := FALSE;
  v_stamp_count INTEGER;
  v_last_stamp TIMESTAMP;
BEGIN
  -- Get current stamp count
  SELECT COUNT(*) INTO v_stamp_count
  FROM public.coffee_stamps
  WHERE user_id = p_user_id;
  
  -- Check if already at 10 stamps
  IF v_stamp_count >= 10 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You already have 10 stamps! Redeem your free coffee first.',
      'stamp_count', v_stamp_count
    );
  END IF;
  
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
  v_stamp_count := v_stamp_count + 1;
  
  -- Check if reached 10 stamps milestone
  IF v_stamp_count = 10 THEN
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
    
    RETURN jsonb_build_object(
      'success', TRUE,
      'stamp_count', v_stamp_count,
      'milestone_reached', TRUE,
      'message', 'Congratulations! You earned a free coffee! Show the QR code to staff to redeem.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'stamp_count', v_stamp_count,
    'milestone_reached', FALSE,
    'message', 'Coffee stamp added! ' || (10 - v_stamp_count) || ' more for a free coffee.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_coffee_stamp IS 'Add a coffee stamp with GPS validation, cap at 10 stamps, auto-reward at 10';

-- =============================================
-- Create function to reset stamps when reward is redeemed
-- =============================================

CREATE OR REPLACE FUNCTION public.reset_coffee_stamps_on_redeem()
RETURNS TRIGGER AS $$
BEGIN
  -- Only reset if it's a Free Coffee reward being redeemed
  IF NEW.status = 'redeemed' AND OLD.status = 'active' THEN
    -- Check if this is a Free Coffee reward
    IF EXISTS (
      SELECT 1 FROM public.rewards 
      WHERE id = NEW.reward_id AND name = 'Free Coffee'
    ) THEN
      -- Delete 10 oldest stamps for this user
      DELETE FROM public.coffee_stamps
      WHERE id IN (
        SELECT id FROM public.coffee_stamps
        WHERE user_id = NEW.user_id
        ORDER BY created_at ASC
        LIMIT 10
      );
      
      -- Add 10 points for redeeming free coffee
      INSERT INTO public.points_transactions (user_id, points, balance_after, source, description)
      SELECT 
        NEW.user_id,
        10,
        COALESCE((SELECT SUM(points) FROM public.points_transactions WHERE user_id = NEW.user_id), 0) + 10,
        'reward_redemption',
        'Redeemed Free Coffee (+10 bonus points)'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.points_transactions 
        WHERE user_id = NEW.user_id 
        AND source = 'reward_redemption'
        AND metadata->>'reward_id' = NEW.id::text
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS reset_stamps_on_coffee_redeem ON public.user_rewards;

-- Create trigger
CREATE TRIGGER reset_stamps_on_coffee_redeem
  AFTER UPDATE ON public.user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_coffee_stamps_on_redeem();

SELECT '✅ Coffee stamp system updated: Cap at 10, reset on redemption, +10 points bonus!' as message;
