-- =============================================
-- UPDATE GAME PRIZES TO BEANS SYSTEM
-- =============================================
-- Multiplies all game prize values by 10x
-- Updates labels to say "beans" instead of "points"
-- =============================================

-- =============================================
-- STEP 1: UPDATE PRIZE VALUES (MULTIPLY BY 10)
-- =============================================

-- Update all point prizes to bean values
UPDATE public.game_prizes
SET prize_value = prize_value * 10
WHERE prize_type = 'points'
AND prize_value > 0;

-- =============================================
-- STEP 2: UPDATE PRIZE LABELS
-- =============================================

-- Replace "Points" with "Beans" in all labels
UPDATE public.game_prizes
SET label = REPLACE(label, 'Points', 'Beans')
WHERE prize_type = 'points';

-- Also update lowercase "points"
UPDATE public.game_prizes
SET label = REPLACE(label, 'points', 'beans')
WHERE prize_type = 'points';

-- =============================================
-- STEP 3: VERIFY UPDATES
-- =============================================

-- Show updated prizes grouped by game
SELECT 
  mg.display_name as game,
  gp.label,
  gp.prize_type,
  gp.prize_value as beans,
  gp.probability,
  gp.daily_limit
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.prize_type = 'points'
ORDER BY mg.display_name, gp.prize_value DESC;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
DECLARE
  v_total_prizes INTEGER;
  v_point_prizes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_prizes FROM public.game_prizes;
  SELECT COUNT(*) INTO v_point_prizes FROM public.game_prizes WHERE prize_type = 'points';
  
  RAISE NOTICE '✅ GAME PRIZES UPDATED TO BEANS!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎮 Total Game Prizes: %', v_total_prizes;
  RAISE NOTICE '🫘 Bean Prizes Updated: %', v_point_prizes;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Old values → New values:';
  RAISE NOTICE '  5 points → 50 beans';
  RAISE NOTICE '  10 points → 100 beans';
  RAISE NOTICE '  15 points → 150 beans';
  RAISE NOTICE '  20 points → 200 beans';
  RAISE NOTICE '  25 points → 250 beans';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
