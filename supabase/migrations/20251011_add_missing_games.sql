-- =============================================
-- Add Missing Games: Coffee Snake & Hungry Hippo
-- =============================================
-- Created: 2025-10-11

-- Insert missing games into mini_games table
INSERT INTO public.mini_games (name, display_name, description, icon, enabled, play_limit_per_day)
VALUES
  -- Coffee Snake
  (
    'coffee_snake',
    'Coffee Snake',
    'Guide the snake to collect coffee beans and grow longer!',
    '☕',
    true,
    1
  ),
  
  -- Hungry Hippo
  (
    'hungry_hippo',
    'Hungry Hippo',
    'Feed the hungry hippo by catching falling treats!',
    '🦛',
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
-- Add Prize Configurations
-- =============================================

DO $$
DECLARE
  coffee_snake_id UUID;
  hungry_hippo_id UUID;
BEGIN
  -- Get game IDs
  SELECT id INTO coffee_snake_id FROM public.mini_games WHERE name = 'coffee_snake';
  SELECT id INTO hungry_hippo_id FROM public.mini_games WHERE name = 'hungry_hippo';

  -- ============================================
  -- COFFEE SNAKE PRIZES
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = coffee_snake_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- High scores (15+ beans)
      (coffee_snake_id, 'points', 25, 0.10, '🏆 Snake Master! +25 Points', 3),
      (coffee_snake_id, 'stamps', 2, 0.10, '☕ Coffee Champion! +2 Stamps', 4),
      
      -- Good scores (10-14 beans)
      (coffee_snake_id, 'points', 15, 0.20, '🐍 Great Snake! +15 Points', 8),
      (coffee_snake_id, 'stamps', 1, 0.20, '✨ Nice Slithering! +1 Stamp', 10),
      
      -- Minimum score (5-9 beans)
      (coffee_snake_id, 'points', 10, 0.30, '☕ Good Try! +10 Points', NULL),
      
      -- Nothing (< 5 beans)
      (coffee_snake_id, 'nothing', 0, 0.10, '😢 Try Again Tomorrow!', NULL);
  END IF;

  -- ============================================
  -- HUNGRY HIPPO PRIZES
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM public.game_prizes WHERE game_id = hungry_hippo_id) THEN
    INSERT INTO public.game_prizes (game_id, prize_type, prize_value, probability, label, daily_limit)
    VALUES
      -- High scores (20+ treats)
      (hungry_hippo_id, 'points', 25, 0.10, '🏆 Feeding Frenzy! +25 Points', 3),
      (hungry_hippo_id, 'stamps', 2, 0.10, '🦛 Hippo Hero! +2 Stamps', 4),
      
      -- Good scores (15-19 treats)
      (hungry_hippo_id, 'points', 15, 0.20, '🎯 Well Fed! +15 Points', 8),
      (hungry_hippo_id, 'stamps', 1, 0.20, '✨ Great Catching! +1 Stamp', 10),
      
      -- Minimum score (10-14 treats)
      (hungry_hippo_id, 'points', 10, 0.30, '🦛 Good Job! +10 Points', NULL),
      
      -- Nothing (< 10 treats)
      (hungry_hippo_id, 'nothing', 0, 0.10, '😢 Hippo Still Hungry! Try Tomorrow!', NULL);
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
WHERE name IN ('coffee_snake', 'hungry_hippo')
ORDER BY name;

-- Success message
SELECT '✅ Coffee Snake & Hungry Hippo added successfully!' as message;
SELECT '🎮 Total games: ' || COUNT(*) as status FROM public.mini_games;
