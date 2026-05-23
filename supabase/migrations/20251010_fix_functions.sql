-- =============================================
-- FIX: Recreate functions without check_and_issue_rewards
-- =============================================
-- This fixes the "function check_and_issue_rewards does not exist" error

-- Drop and recreate add_coffee_stamp function
DROP FUNCTION IF EXISTS public.add_coffee_stamp(UUID, DECIMAL, DECIMAL);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate play_game_enhanced function
DROP FUNCTION IF EXISTS public.play_game_enhanced(UUID, UUID);

CREATE OR REPLACE FUNCTION public.play_game_enhanced(
  p_user_id UUID,
  p_game_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_can_play BOOLEAN;
  v_prize RECORD;
  v_random DECIMAL;
  v_cumulative_prob DECIMAL := 0;
  v_total_prob DECIMAL := 0;
BEGIN
  -- Check if user can play
  SELECT public.can_play_game(p_user_id, p_game_id) INTO v_can_play;
  
  IF NOT v_can_play THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You have already played today'
    );
  END IF;
  
  -- Calculate total probability of available prizes
  SELECT SUM(probability) INTO v_total_prob
  FROM public.game_prizes 
  WHERE game_id = p_game_id 
    AND active = TRUE
    AND (stock_limit IS NULL OR stock_used < stock_limit);
  
  IF v_total_prob = 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'No prizes available today'
    );
  END IF;
  
  -- Get random number
  v_random := random() * v_total_prob;
  
  -- Select prize based on probability and stock
  FOR v_prize IN 
    SELECT * FROM public.game_prizes 
    WHERE game_id = p_game_id 
      AND active = TRUE
      AND (stock_limit IS NULL OR stock_used < stock_limit)
    ORDER BY probability DESC
  LOOP
    v_cumulative_prob := v_cumulative_prob + v_prize.probability;
    
    IF v_random <= v_cumulative_prob THEN
      -- Winner!
      
      -- Update stock
      IF v_prize.stock_limit IS NOT NULL THEN
        UPDATE public.game_prizes 
        SET stock_used = stock_used + 1 
        WHERE id = v_prize.id;
      END IF;
      
      -- Log game play
      INSERT INTO public.game_plays (user_id, game_id, prize_type, prize_value)
      VALUES (p_user_id, p_game_id, v_prize.prize_type, v_prize.prize_value);
      
      -- Award prize based on category
      IF v_prize.prize_category = 'stamps' THEN
        -- Add coffee stamps
        FOR i IN 1..COALESCE(v_prize.prize_value, 1) LOOP
          INSERT INTO public.coffee_stamps (user_id, location_verified)
          VALUES (p_user_id, FALSE);
        END LOOP;
        
      ELSIF v_prize.prize_category = 'points' THEN
        -- Add points
        PERFORM public.add_points(
          p_user_id, 
          v_prize.prize_value, 
          'game_bonus', 
          'Won from ' || v_prize.label
        );
        
      ELSIF v_prize.prize_category IN ('food', 'drink') THEN
        -- Create instant reward voucher
        INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
        SELECT 
          p_user_id,
          r.id,
          'GAME-' || substr(md5(random()::text), 1, 12),
          NOW() + INTERVAL '7 days'
        FROM public.rewards r
        WHERE r.name = v_prize.label AND r.active = TRUE
        LIMIT 1;
      END IF;
      
      -- Log transaction
      INSERT INTO public.transactions (user_id, action, details)
      VALUES (p_user_id, 'game_play', jsonb_build_object(
        'game_id', p_game_id,
        'prize_label', v_prize.label,
        'prize_type', v_prize.prize_type
      ));
      
      RETURN jsonb_build_object(
        'success', TRUE,
        'prize', row_to_json(v_prize)
      );
    END IF;
  END LOOP;
  
  -- Shouldn't reach here if probabilities are correct
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', 'Prize selection error'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.add_coffee_stamp IS 'Add a coffee stamp with GPS validation and auto-reward at 10 stamps';
COMMENT ON FUNCTION public.play_game_enhanced IS 'Play a game with stock limits and probability-based prize selection';

-- Done!
