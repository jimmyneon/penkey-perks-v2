-- =============================================
-- FIX OLD GAME LABELS
-- =============================================
-- Updates simple labels like "5 Beans" to correct values
-- =============================================

-- Duck Pond
UPDATE public.game_prizes 
SET label = '200 Beans' 
WHERE label = '20 Beans' AND prize_value = 200;

UPDATE public.game_prizes 
SET label = '100 Beans' 
WHERE label = '10 Beans' AND prize_value = 100;

UPDATE public.game_prizes 
SET label = '50 Beans' 
WHERE label = '5 Beans' AND prize_value = 50;

-- Scratch Card
UPDATE public.game_prizes 
SET label = '150 Beans' 
WHERE label = '15 Beans' AND prize_value = 150;

UPDATE public.game_prizes 
SET label = '100 Beans' 
WHERE label = '10 Beans' AND prize_value = 100;

UPDATE public.game_prizes 
SET label = '50 Beans' 
WHERE label = '5 Beans' AND prize_value = 50;

-- Spin Wheel
UPDATE public.game_prizes 
SET label = '200 Beans' 
WHERE label = '20 Beans' AND prize_value = 200;

UPDATE public.game_prizes 
SET label = '100 Beans' 
WHERE label = '10 Beans' AND prize_value = 100;

UPDATE public.game_prizes 
SET label = '50 Beans' 
WHERE label = '5 Beans' AND prize_value = 50;

-- Verify the fixes
SELECT 
  mg.display_name as game,
  gp.label,
  gp.prize_value as beans,
  CASE 
    WHEN gp.prize_type = 'points' AND gp.label ~ '^\d+ Beans$' THEN
      CASE 
        WHEN gp.label = gp.prize_value::text || ' Beans' THEN '✅ Correct'
        ELSE '❌ Still wrong'
      END
    WHEN gp.prize_type = 'points' THEN '✅ Has emoji/text'
    ELSE '✅ Not points'
  END as status
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE mg.display_name IN ('Duck Pond', 'Scratch Card', 'Spin Wheel')
AND gp.active = TRUE
ORDER BY mg.display_name, gp.prize_value DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ OLD GAME LABELS FIXED!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Updated labels:';
  RAISE NOTICE '  Duck Pond: 5→50, 10→100, 20→200 beans';
  RAISE NOTICE '  Scratch Card: 5→50, 10→100, 15→150 beans';
  RAISE NOTICE '  Spin Wheel: 5→50, 10→100, 20→200 beans';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Modal popups will now show correct bean amounts!';
END $$;
