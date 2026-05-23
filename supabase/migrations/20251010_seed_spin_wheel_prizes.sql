-- =============================================
-- SEED SPIN WHEEL PRIZES
-- =============================================
-- This migration adds proper prizes for the spin wheel game

-- First, get the spin_wheel game ID
DO $$
DECLARE
  v_game_id UUID;
BEGIN
  -- Get spin_wheel game ID
  SELECT id INTO v_game_id
  FROM public.mini_games
  WHERE name = 'spin_wheel';

  -- If game doesn't exist, create it
  IF v_game_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('spin_wheel', 'Spin Wheel', 'Spin the wheel of fortune!', '🎡', true)
    RETURNING id INTO v_game_id;
  END IF;

  -- Delete old prizes for spin_wheel (if any)
  DELETE FROM public.game_prizes WHERE game_id = v_game_id;

  -- Insert new prizes with proper probabilities
  INSERT INTO public.game_prizes (
    game_id, 
    label, 
    prize_type, 
    prize_value, 
    probability,
    prize_category,
    active
  ) VALUES
    -- 5 Points (30% chance) - Most common
    (v_game_id, '5 Points', 'points', 5, 0.30, 'points', true),
    
    -- Try Again (25% chance)
    (v_game_id, 'Try Again', 'nothing', 0, 0.25, 'nothing', true),
    
    -- 10 Points (20% chance)
    (v_game_id, '10 Points', 'points', 10, 0.20, 'points', true),
    
    -- 1 Coffee Stamp (15% chance)
    (v_game_id, '1 Coffee Stamp', 'stamps', 1, 0.15, 'stamps', true),
    
    -- 20 Points (7% chance) - Rare
    (v_game_id, '20 Points', 'points', 20, 0.07, 'points', true),
    
    -- 2 Coffee Stamps (2% chance) - Very rare
    (v_game_id, '2 Coffee Stamps', 'stamps', 2, 0.02, 'stamps', true),
    
    -- Instant Reward (1% chance) - Super rare
    (v_game_id, 'Free Pastry!', 'reward', NULL, 0.01, 'food', true);

  -- Verify probabilities sum to 100% (1.0)
  RAISE NOTICE 'Total probability: %', (
    SELECT SUM(probability) FROM public.game_prizes WHERE game_id = v_game_id
  );

END $$;

-- Add comments
COMMENT ON TABLE public.game_prizes IS 'Prize definitions for mini-games with probabilities';

-- Done!
SELECT 'Spin wheel prizes seeded successfully!' as message;
