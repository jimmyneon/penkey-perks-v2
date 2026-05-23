-- Fix claim_pending_rewards function - remove "notes" column reference

CREATE OR REPLACE FUNCTION public.claim_pending_rewards(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_pending RECORD;
  v_claimed_count INTEGER := 0;
  v_total_points INTEGER := 0;
  v_total_stamps INTEGER := 0;
  v_total_game_plays INTEGER := 0;
  v_vouchers TEXT[] := ARRAY[]::TEXT[];
  v_location_valid BOOLEAN := true;
  v_app_url TEXT;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Validate location if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location_valid := public.validate_location(p_latitude, p_longitude);
    
    IF NOT v_location_valid THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You must be at Penkey to claim rewards'
      );
    END IF;
  END IF;
  
  -- Claim all pending rewards
  FOR v_pending IN
    SELECT * FROM public.pending_rewards
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY earned_at ASC
  LOOP
    -- Award based on type
    CASE v_pending.reward_type
      WHEN 'points' THEN
        -- Add points
        PERFORM public.add_points(
          p_user_id,
          v_pending.amount,
          v_pending.source,
          'Claimed: ' || v_pending.reward_name,
          v_pending.metadata
        );
        v_total_points := v_total_points + v_pending.amount;
        
      WHEN 'stamps' THEN
        -- Add stamps (FIXED - removed "notes" column)
        FOR i IN 1..v_pending.amount LOOP
          INSERT INTO public.coffee_stamps (user_id)
          VALUES (p_user_id);
        END LOOP;
        v_total_stamps := v_total_stamps + v_pending.amount;
        
      WHEN 'voucher' THEN
        -- Activate voucher if it exists
        IF v_pending.reward_id IS NOT NULL THEN
          UPDATE public.user_rewards
          SET status = 'active'
          WHERE id = v_pending.reward_id;
          v_vouchers := array_append(v_vouchers, v_pending.reward_name);
        END IF;
        
      WHEN 'game_play' THEN
        -- Add game play credits (stored in metadata for now)
        v_total_game_plays := v_total_game_plays + v_pending.amount;
        
      ELSE
        -- Custom rewards handled separately
        NULL;
    END CASE;
    
    -- Mark as claimed
    UPDATE public.pending_rewards
    SET status = 'claimed',
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pending.id;
    
    v_claimed_count := v_claimed_count + 1;
  END LOOP;
  
  -- Update user's pending count
  UPDATE public.users
  SET pending_rewards_count = (
    SELECT COUNT(*) FROM public.pending_rewards
    WHERE user_id = p_user_id AND status = 'pending'
  ),
  updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Send notification if rewards were claimed
  IF v_claimed_count > 0 THEN
    -- Queue celebration email
    PERFORM public.queue_email_from_template(
      'rewards_claimed',
      (SELECT email FROM public.users WHERE id = p_user_id),
      p_user_id,
      jsonb_build_object(
        'name', (SELECT name FROM public.users WHERE id = p_user_id),
        'claimedCount', v_claimed_count,
        'totalPoints', v_total_points,
        'totalStamps', v_total_stamps,
        'totalGamePlays', v_total_game_plays,
        'vouchers', v_vouchers,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'claimed_count', v_claimed_count,
    'total_points', v_total_points,
    'total_stamps', v_total_stamps,
    'total_game_plays', v_total_game_plays,
    'vouchers', v_vouchers,
    'message', CASE 
      WHEN v_claimed_count = 0 THEN 'No pending rewards to claim'
      WHEN v_claimed_count = 1 THEN 'You claimed 1 reward!'
      ELSE 'You claimed ' || v_claimed_count || ' rewards!'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
