-- =============================================
-- Add 5 New Mini-Games to Penkey
-- =============================================
-- Games: Dice Roll, Duck Memory, Monkey vs Penguin, Cup Stack, Donut Catcher
-- Created: 2025-10-10

-- Insert new games into mini_games table
INSERT INTO public.mini_games (name, display_name, description, icon, enabled, play_limit_per_day)
VALUES
  -- 1. Lucky Dice Roll
  (
    'dice_roll',
    'Lucky Dice Roll',
    'Roll the dice to match special combinations and win prizes!',
    '🎲',
    true,
    1
  ),
  
  -- 2. Duck Memory Match
  (
    'duck_memory',
    'Duck Memory Match',
    'Match pairs of colored ducks to test your memory and win!',
    '🦆',
    true,
    1
  ),
  
  -- 3. Monkey vs Penguin Race
  (
    'monkey_penguin',
    'Monkey vs Penguin Race',
    'Tap rapidly to make your penguin beat the monkey to the finish!',
    '🐧',
    true,
    1
  ),
  
  -- 4. Coffee Cup Stack
  (
    'cup_stack',
    'Coffee Cup Stack',
    'Stack falling coffee cups without toppling them!',
    '☕',
    true,
    1
  ),
  
  -- 5. Donut Catcher
  (
    'donut_catcher',
    'Donut Catcher',
    'Catch falling treats in your basket before time runs out!',
    '🍩',
    true,
    1
  )
ON CONFLICT (name) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  enabled = EXCLUDED.enabled,
  play_limit_per_day = EXCLUDED.play_limit_per_day,
  updated_at = NOW();

-- =============================================
-- Add Prize Configurations for Each Game
-- =============================================

-- Get game IDs for prize setup
DO $$
DECLARE
  dice_roll_id UUID;
  duck_memory_id UUID;
  monkey_penguin_id UUID;
  cup_stack_id UUID;
  donut_catcher_id UUID;
BEGIN
  -- Get game IDs
  SELECT id INTO dice_roll_id FROM public.mini_games WHERE name = 'dice_roll';
  SELECT id INTO duck_memory_id FROM public.mini_games WHERE name = 'duck_memory';
  SELECT id INTO monkey_penguin_id FROM public.mini_games WHERE name = 'monkey_penguin';
  SELECT id INTO cup_stack_id FROM public.mini_games WHERE name = 'cup_stack';
  SELECT id INTO donut_catcher_id FROM public.mini_games WHERE name = 'donut_catcher';

  -- ============================================
  -- DICE ROLL PRIZES
  -- ============================================
  -- Only insert if prizes don't exist for this game
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = dice_roll_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- Big wins (Snake Eyes, High Doubles)
      (dice_roll_id, 'points', 20, 0.05, '🐍 Snake Eyes! +20 Points', 3),
      (dice_roll_id, 'stamps', 2, 0.05, '🎯 Doubles! +2 Stamps', 5),
      
      -- Medium wins (Lucky 7, Regular Doubles)
      (dice_roll_id, 'points', 10, 0.15, '🍀 Lucky 7! +10 Points', 10),
      (dice_roll_id, 'stamps', 1, 0.15, '🎲 Match! +1 Stamp', 15),
      
      -- Small wins
      (dice_roll_id, 'points', 5, 0.25, '⭐ Nice Roll! +5 Points', NULL),
      
      -- Nothing
      (dice_roll_id, 'nothing', 0, 0.35, '😢 Better Luck Tomorrow!', NULL);
  END IF;

  -- ============================================
  -- DUCK MEMORY PRIZES
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = duck_memory_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- Perfect memory (< 10 moves)
      (duck_memory_id, 'points', 25, 0.10, '🧠 Perfect Memory! +25 Points', 2),
      (duck_memory_id, 'stamps', 2, 0.10, '🦆 Amazing! +2 Stamps', 3),
      
      -- Good memory (10-15 moves)
      (duck_memory_id, 'points', 15, 0.20, '✨ Great Memory! +15 Points', 8),
      (duck_memory_id, 'stamps', 1, 0.20, '🎯 Well Done! +1 Stamp', 10),
      
      -- Completed (15+ moves)
      (duck_memory_id, 'points', 10, 0.30, '🦆 Matched All! +10 Points', NULL),
      
      -- Nothing
      (duck_memory_id, 'nothing', 0, 0.10, '😢 Try Again Tomorrow!', NULL);
  END IF;

  -- ============================================
  -- MONKEY VS PENGUIN PRIZES
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = monkey_penguin_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- Big wins (Beat monkey easily)
      (monkey_penguin_id, 'points', 20, 0.15, '🏆 Landslide Victory! +20 Points', 5),
      (monkey_penguin_id, 'stamps', 2, 0.10, '⚡ Lightning Fast! +2 Stamps', 5),
      
      -- Medium wins (Close race)
      (monkey_penguin_id, 'points', 15, 0.25, '🐧 You Won! +15 Points', 10),
      (monkey_penguin_id, 'stamps', 1, 0.20, '🎯 Victory! +1 Stamp', 12),
      
      -- Small wins
      (monkey_penguin_id, 'points', 10, 0.20, '💪 Nice Tapping! +10 Points', NULL),
      
      -- Nothing (Monkey won)
      (monkey_penguin_id, 'nothing', 0, 0.10, '🐵 Monkey Won! Try Tomorrow!', NULL);
  END IF;

  -- ============================================
  -- CUP STACK PRIZES
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = cup_stack_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- Perfect stacks
      (cup_stack_id, 'points', 25, 0.10, '🏆 Perfect Stack! +25 Points', 3),
      (cup_stack_id, 'stamps', 2, 0.10, '☕ Master Stacker! +2 Stamps', 4),
      
      -- Good stacks
      (cup_stack_id, 'points', 15, 0.20, '🎯 Great Balance! +15 Points', 8),
      (cup_stack_id, 'stamps', 1, 0.20, '✨ Nice Stack! +1 Stamp', 10),
      
      -- Completed
      (cup_stack_id, 'points', 10, 0.30, '☕ Stacked 5! +10 Points', NULL),
      
      -- Nothing (Stack fell)
      (cup_stack_id, 'nothing', 0, 0.10, '💥 Stack Collapsed! Try Tomorrow!', NULL);
  END IF;

  -- ============================================
  -- DONUT CATCHER PRIZES
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = donut_catcher_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- High scores (10+ catches)
      (donut_catcher_id, 'points', 25, 0.10, '🏆 Catching Champion! +25 Points', 3),
      (donut_catcher_id, 'stamps', 2, 0.10, '🍩 Perfect Catch! +2 Stamps', 4),
      
      -- Good scores (7-9 catches)
      (donut_catcher_id, 'points', 15, 0.20, '🎯 Great Reflexes! +15 Points', 8),
      (donut_catcher_id, 'stamps', 1, 0.20, '✨ Nice Catching! +1 Stamp', 10),
      
      -- Minimum catches (5-6)
      (donut_catcher_id, 'points', 10, 0.30, '🍩 Good Job! +10 Points', NULL),
      
      -- Nothing (< 5 catches)
      (donut_catcher_id, 'nothing', 0, 0.10, '⏰ Not Enough Catches! Try Tomorrow!', NULL);
  END IF;

END $$;

-- =============================================
-- Verification
-- =============================================

-- Show all games
SELECT 
  name,
  display_name,
  icon,
  enabled,
  play_limit_per_day,
  (SELECT COUNT(*) FROM game_prizes WHERE game_id = mini_games.id) as prize_count
FROM public.mini_games
ORDER BY created_at DESC;

-- Success message
SELECT '✅ 5 new games added successfully!' as message;
SELECT '🎮 Total games: ' || COUNT(*) as status FROM public.mini_games;
SELECT '🎁 Total prizes configured: ' || COUNT(*) as status FROM public.game_prizes;
