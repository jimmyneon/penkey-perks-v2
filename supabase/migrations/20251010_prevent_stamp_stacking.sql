-- =============================================
-- Prevent Stamp Stacking from Games
-- =============================================
-- This ensures game prizes cannot add stamps when user already has 10
-- and prevents stacking of free coffee rewards

-- Function to safely add game prize stamps (respects 10 stamp cap)
CREATE OR REPLACE FUNCTION public.add_game_prize_stamps(
  p_user_id UUID,
  p_stamp_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_stamps INTEGER;
  v_stamps_to_add INTEGER;
  v_new_total INTEGER;
  v_milestone_reached BOOLEAN := FALSE;
BEGIN
  -- Get current stamp count
  SELECT COUNT(*) INTO v_current_stamps
  FROM public.coffee_stamps
  WHERE user_id = p_user_id;
  
  -- Check if already at 10 stamps
  IF v_current_stamps >= 10 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You already have 10 stamps! Redeem your free coffee first.',
      'stamps_added', 0,
      'current_stamps', v_current_stamps
    );
  END IF;
  
  -- Calculate how many stamps we can actually add (cap at 10 total)
  v_stamps_to_add := LEAST(p_stamp_count, 10 - v_current_stamps);
  
  -- Add the stamps
  INSERT INTO public.coffee_stamps (user_id, location_verified)
  SELECT p_user_id, FALSE
  FROM generate_series(1, v_stamps_to_add);
  
  -- Get new total
  v_new_total := v_current_stamps + v_stamps_to_add;
  
  -- Check if reached 10 stamps milestone
  IF v_new_total = 10 THEN
    v_milestone_reached := TRUE;
    
    -- Auto-issue free coffee reward (only if they don't already have one)
    INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
    SELECT 
      p_user_id,
      r.id,
      'COFFEE-' || substr(md5(random()::text), 1, 12),
      NOW() + INTERVAL '30 days'
    FROM public.rewards r
    WHERE r.name = 'Free Coffee' 
      AND r.active = TRUE
      AND NOT EXISTS (
        -- Don't issue if user already has an active free coffee
        SELECT 1 FROM public.user_rewards ur
        INNER JOIN public.rewards r2 ON ur.reward_id = r2.id
        WHERE ur.user_id = p_user_id
          AND r2.name = 'Free Coffee'
          AND ur.status = 'active'
      )
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'stamps_added', v_stamps_to_add,
    'current_stamps', v_new_total,
    'milestone_reached', v_milestone_reached,
    'message', CASE 
      WHEN v_milestone_reached THEN 'You earned a free coffee!'
      ELSE 'Added ' || v_stamps_to_add || ' stamp(s)! ' || (10 - v_new_total) || ' more for free coffee.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_game_prize_stamps IS 'Safely add game prize stamps with 10 stamp cap and no reward stacking';

-- =============================================
-- Function to check if user can receive a reward prize
-- =============================================
CREATE OR REPLACE FUNCTION public.can_receive_reward_prize(
  p_user_id UUID,
  p_reward_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_reward BOOLEAN;
BEGIN
  -- Check if user already has an active reward of this type
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_rewards ur
    INNER JOIN public.rewards r ON ur.reward_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.status = 'active'
      AND (p_reward_name IS NULL OR r.name = p_reward_name)
  ) INTO v_has_active_reward;
  
  RETURN NOT v_has_active_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_receive_reward_prize IS 'Check if user can receive a reward prize (prevents stacking)';

SELECT '✅ Stamp stacking prevention functions created!' as message;
