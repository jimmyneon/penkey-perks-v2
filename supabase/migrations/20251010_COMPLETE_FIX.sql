-- =============================================
-- COMPLETE FIX - RUN THIS ONE MIGRATION
-- =============================================
-- This combines all fixes needed:
-- 1. Fix add_coffee_stamp function
-- 2. Fix play_game_enhanced function  
-- 3. Seed all game prizes

-- =============================================
-- PART 1: FIX FUNCTIONS
-- =============================================

-- Drop and recreate add_coffee_stamp function (without check_and_issue_rewards)
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

COMMENT ON FUNCTION public.add_coffee_stamp IS 'Add a coffee stamp with GPS validation and auto-reward at 10 stamps';

-- =============================================
-- FIX: can_check_in function (check TODAY not 24 hours)
-- =============================================

DROP FUNCTION IF EXISTS public.can_check_in(UUID);

CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_check_in TIMESTAMP WITH TIME ZONE;
  v_today_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get start of today (midnight)
  v_today_start := date_trunc('day', NOW());
  
  -- Check last check-in from points_transactions (source = 'visit')
  SELECT MAX(created_at) INTO v_last_check_in
  FROM public.points_transactions
  WHERE user_id = p_user_id 
    AND source = 'visit'
    AND created_at >= v_today_start;
  
  -- If no check-in today, allow it
  IF v_last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Already checked in today
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in today (resets at midnight, not 24 hours)';

-- =============================================
-- FIX: can_play_game function (check if user played game today)
-- =============================================

DROP FUNCTION IF EXISTS public.can_play_game(UUID, UUID);

CREATE OR REPLACE FUNCTION public.can_play_game(
  p_user_id UUID,
  p_game_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_today_start TIMESTAMP WITH TIME ZONE;
  v_play_count INTEGER;
BEGIN
  -- Get start of today (midnight)
  v_today_start := date_trunc('day', NOW());
  
  -- Check if user played this game today
  SELECT COUNT(*) INTO v_play_count
  FROM public.game_plays
  WHERE user_id = p_user_id 
    AND game_id = p_game_id
    AND created_at >= v_today_start;
  
  -- If no plays today, allow it
  IF v_play_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Already played today
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_play_game IS 'Check if user can play this game today (one play per game per day)';

-- =============================================
-- PART 2: UPDATE PRIZE_TYPE CONSTRAINT
-- =============================================

-- Drop old constraint on prize_type
ALTER TABLE public.game_prizes DROP CONSTRAINT IF EXISTS game_prizes_prize_type_check;

-- Add new constraint allowing: points, stamps, reward, nothing
ALTER TABLE public.game_prizes 
ADD CONSTRAINT game_prizes_prize_type_check 
CHECK (prize_type IN ('points', 'stamps', 'reward', 'nothing', 'ducks'));

-- Note: 'ducks' is kept for backwards compatibility but will be migrated to 'stamps'

-- =============================================
-- PART 3: SEED GAME PRIZES
-- =============================================

DO $$
DECLARE
  v_spin_wheel_id UUID;
  v_scratch_card_id UUID;
  v_duck_pond_id UUID;
BEGIN
  -- Get or create games
  SELECT id INTO v_spin_wheel_id FROM public.mini_games WHERE name = 'spin_wheel';
  IF v_spin_wheel_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('spin_wheel', 'Spin Wheel', 'Spin the wheel of fortune!', '🎡', true)
    RETURNING id INTO v_spin_wheel_id;
  END IF;

  SELECT id INTO v_scratch_card_id FROM public.mini_games WHERE name = 'scratch_card';
  IF v_scratch_card_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('scratch_card', 'Scratch Card', 'Scratch to reveal your prize!', '🎫', true)
    RETURNING id INTO v_scratch_card_id;
  END IF;

  SELECT id INTO v_duck_pond_id FROM public.mini_games WHERE name = 'duck_pond';
  IF v_duck_pond_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('duck_pond', 'Duck Pond', 'Pick a lucky duck!', '🦆', true)
    RETURNING id INTO v_duck_pond_id;
  END IF;

  -- Delete old prizes
  DELETE FROM public.game_prizes WHERE game_id IN (v_spin_wheel_id, v_scratch_card_id, v_duck_pond_id);

  -- Spin Wheel Prizes
  INSERT INTO public.game_prizes (
    game_id, label, prize_type, prize_value, probability, prize_category, active
  ) VALUES
    (v_spin_wheel_id, '5 Points', 'points', 5, 0.30, 'points', true),
    (v_spin_wheel_id, 'Try Again', 'nothing', 0, 0.25, 'nothing', true),
    (v_spin_wheel_id, '10 Points', 'points', 10, 0.20, 'points', true),
    (v_spin_wheel_id, '1 Coffee Stamp', 'stamps', 1, 0.15, 'stamps', true),
    (v_spin_wheel_id, '20 Points', 'points', 20, 0.07, 'points', true),
    (v_spin_wheel_id, '2 Coffee Stamps', 'stamps', 2, 0.02, 'stamps', true),
    (v_spin_wheel_id, 'Free Pastry!', 'reward', NULL, 0.01, 'food', true);

  -- Scratch Card Prizes
  INSERT INTO public.game_prizes (
    game_id, label, prize_type, prize_value, probability, prize_category, active
  ) VALUES
    (v_scratch_card_id, '5 Points', 'points', 5, 0.35, 'points', true),
    (v_scratch_card_id, 'Better Luck!', 'nothing', 0, 0.30, 'nothing', true),
    (v_scratch_card_id, '10 Points', 'points', 10, 0.20, 'points', true),
    (v_scratch_card_id, '1 Coffee Stamp', 'stamps', 1, 0.10, 'stamps', true),
    (v_scratch_card_id, '15 Points', 'points', 15, 0.04, 'points', true),
    (v_scratch_card_id, 'Free Coffee!', 'reward', NULL, 0.01, 'drink', true);

  -- Duck Pond Prizes
  INSERT INTO public.game_prizes (
    game_id, label, prize_type, prize_value, probability, prize_category, active
  ) VALUES
    (v_duck_pond_id, '5 Points', 'points', 5, 0.40, 'points', true),
    (v_duck_pond_id, 'No Prize', 'nothing', 0, 0.25, 'nothing', true),
    (v_duck_pond_id, '10 Points', 'points', 10, 0.20, 'points', true),
    (v_duck_pond_id, '1 Coffee Stamp', 'stamps', 1, 0.10, 'stamps', true),
    (v_duck_pond_id, '20 Points', 'points', 20, 0.04, 'points', true),
    (v_duck_pond_id, 'Mystery Prize!', 'reward', NULL, 0.01, 'food', true);

  RAISE NOTICE 'All game prizes seeded successfully!';
END $$;

-- =============================================
-- PART 3: VERIFY EVERYTHING
-- =============================================

-- Show summary
SELECT 
  mg.display_name as game,
  COUNT(gp.id) as prize_count,
  ROUND(SUM(gp.probability)::numeric, 2) as total_probability
FROM public.mini_games mg
LEFT JOIN public.game_prizes gp ON gp.game_id = mg.id
WHERE mg.enabled = true
GROUP BY mg.display_name
ORDER BY mg.display_name;
