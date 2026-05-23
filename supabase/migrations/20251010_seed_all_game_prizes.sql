-- =============================================
-- SEED ALL GAME PRIZES
-- =============================================
-- This migration adds prizes for all three games

DO $$
DECLARE
  v_spin_wheel_id UUID;
  v_scratch_card_id UUID;
  v_duck_pond_id UUID;
BEGIN
  -- =============================================
  -- 1. ENSURE GAMES EXIST
  -- =============================================
  
  -- Spin Wheel
  SELECT id INTO v_spin_wheel_id FROM public.mini_games WHERE name = 'spin_wheel';
  IF v_spin_wheel_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('spin_wheel', 'Spin Wheel', 'Spin the wheel of fortune!', '🎡', true)
    RETURNING id INTO v_spin_wheel_id;
  END IF;

  -- Scratch Card
  SELECT id INTO v_scratch_card_id FROM public.mini_games WHERE name = 'scratch_card';
  IF v_scratch_card_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('scratch_card', 'Scratch Card', 'Scratch to reveal your prize!', '🎫', true)
    RETURNING id INTO v_scratch_card_id;
  END IF;

  -- Duck Pond
  SELECT id INTO v_duck_pond_id FROM public.mini_games WHERE name = 'duck_pond';
  IF v_duck_pond_id IS NULL THEN
    INSERT INTO public.mini_games (name, display_name, description, icon, enabled)
    VALUES ('duck_pond', 'Duck Pond', 'Pick a lucky duck!', '🦆', true)
    RETURNING id INTO v_duck_pond_id;
  END IF;

  -- =============================================
  -- 2. DELETE OLD PRIZES
  -- =============================================
  
  DELETE FROM public.game_prizes WHERE game_id IN (v_spin_wheel_id, v_scratch_card_id, v_duck_pond_id);

  -- =============================================
  -- 3. SPIN WHEEL PRIZES
  -- =============================================
  
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

  -- =============================================
  -- 4. SCRATCH CARD PRIZES
  -- =============================================
  
  INSERT INTO public.game_prizes (
    game_id, label, prize_type, prize_value, probability, prize_category, active
  ) VALUES
    (v_scratch_card_id, '5 Points', 'points', 5, 0.35, 'points', true),
    (v_scratch_card_id, 'Better Luck!', 'nothing', 0, 0.30, 'nothing', true),
    (v_scratch_card_id, '10 Points', 'points', 10, 0.20, 'points', true),
    (v_scratch_card_id, '1 Coffee Stamp', 'stamps', 1, 0.10, 'stamps', true),
    (v_scratch_card_id, '15 Points', 'points', 15, 0.04, 'points', true),
    (v_scratch_card_id, 'Free Coffee!', 'reward', NULL, 0.01, 'drink', true);

  -- =============================================
  -- 5. DUCK POND PRIZES
  -- =============================================
  
  INSERT INTO public.game_prizes (
    game_id, label, prize_type, prize_value, probability, prize_category, active
  ) VALUES
    (v_duck_pond_id, '5 Points', 'points', 5, 0.40, 'points', true),
    (v_duck_pond_id, 'No Prize', 'nothing', 0, 0.25, 'nothing', true),
    (v_duck_pond_id, '10 Points', 'points', 10, 0.20, 'points', true),
    (v_duck_pond_id, '1 Coffee Stamp', 'stamps', 1, 0.10, 'stamps', true),
    (v_duck_pond_id, '20 Points', 'points', 20, 0.04, 'points', true),
    (v_duck_pond_id, 'Mystery Prize!', 'reward', NULL, 0.01, 'food', true);

  -- =============================================
  -- 6. VERIFY PROBABILITIES
  -- =============================================
  
  RAISE NOTICE 'Spin Wheel total probability: %', (
    SELECT SUM(probability) FROM public.game_prizes WHERE game_id = v_spin_wheel_id
  );
  
  RAISE NOTICE 'Scratch Card total probability: %', (
    SELECT SUM(probability) FROM public.game_prizes WHERE game_id = v_scratch_card_id
  );
  
  RAISE NOTICE 'Duck Pond total probability: %', (
    SELECT SUM(probability) FROM public.game_prizes WHERE game_id = v_duck_pond_id
  );

END $$;

-- =============================================
-- 7. ADD DAILY LIMITS (OPTIONAL)
-- =============================================

-- Example: Limit rare prizes to 10 per day
UPDATE public.game_prizes
SET daily_limit = 10
WHERE prize_category IN ('food', 'drink') AND prize_type = 'reward';

-- =============================================
-- DONE!
-- =============================================

SELECT 
  mg.display_name as game,
  COUNT(gp.id) as prize_count,
  SUM(gp.probability) as total_probability
FROM public.mini_games mg
LEFT JOIN public.game_prizes gp ON gp.game_id = mg.id
WHERE mg.enabled = true
GROUP BY mg.display_name
ORDER BY mg.display_name;
