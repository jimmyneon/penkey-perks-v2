-- =============================================
-- FIX GAME PRIZE LABELS
-- =============================================
-- Updates all hardcoded values in labels to match actual bean amounts
-- =============================================

-- First, let's see what needs fixing
SELECT 
  mg.display_name as game,
  gp.label as current_label,
  gp.prize_value as actual_beans,
  CASE 
    WHEN gp.label LIKE '%20%' AND gp.prize_value = 200 THEN '❌ Label shows 20, should be 200'
    WHEN gp.label LIKE '%25%' AND gp.prize_value = 250 THEN '❌ Label shows 25, should be 250'
    WHEN gp.label LIKE '%15%' AND gp.prize_value = 150 THEN '❌ Label shows 15, should be 150'
    WHEN gp.label LIKE '%10%' AND gp.prize_value = 100 THEN '❌ Label shows 10, should be 100'
    WHEN gp.label LIKE '%5%' AND gp.prize_value = 50 THEN '❌ Label shows 5, should be 50'
    ELSE '✅ OK'
  END as status
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.prize_type = 'points' AND gp.active = TRUE
ORDER BY mg.display_name, gp.prize_value DESC;

-- =============================================
-- FIX LABELS - Replace old numbers with new
-- =============================================

-- Fix labels that say "+5 " to "+50 "
UPDATE public.game_prizes
SET label = REPLACE(label, '+5 ', '+50 ')
WHERE prize_type = 'points' 
AND label LIKE '%+5 %'
AND prize_value = 50;

-- Fix labels that say "+10 " to "+100 "
UPDATE public.game_prizes
SET label = REPLACE(label, '+10 ', '+100 ')
WHERE prize_type = 'points' 
AND label LIKE '%+10 %'
AND prize_value = 100;

-- Fix labels that say "+15 " to "+150 "
UPDATE public.game_prizes
SET label = REPLACE(label, '+15 ', '+150 ')
WHERE prize_type = 'points' 
AND label LIKE '%+15 %'
AND prize_value = 150;

-- Fix labels that say "+20 " to "+200 "
UPDATE public.game_prizes
SET label = REPLACE(label, '+20 ', '+200 ')
WHERE prize_type = 'points' 
AND label LIKE '%+20 %'
AND prize_value = 200;

-- Fix labels that say "+25 " to "+250 "
UPDATE public.game_prizes
SET label = REPLACE(label, '+25 ', '+250 ')
WHERE prize_type = 'points' 
AND label LIKE '%+25 %'
AND prize_value = 250;

-- Fix labels that say "+30 " to "+300 "
UPDATE public.game_prizes
SET label = REPLACE(label, '+30 ', '+300 ')
WHERE prize_type = 'points' 
AND label LIKE '%+30 %'
AND prize_value = 300;

-- Fix labels that say "+50 " to "+500 " (for any high prizes)
UPDATE public.game_prizes
SET label = REPLACE(label, '+50 ', '+500 ')
WHERE prize_type = 'points' 
AND label LIKE '%+50 %'
AND prize_value = 500;

-- =============================================
-- VERIFY FIXES
-- =============================================

SELECT 
  '🎮 UPDATED LABELS' as status,
  mg.display_name as game,
  gp.label,
  gp.prize_value as beans,
  CASE 
    WHEN gp.label ~ '\+\d+ ' THEN 
      CASE 
        WHEN CAST(substring(gp.label from '\+(\d+)') AS INTEGER) = gp.prize_value THEN '✅ Match'
        ELSE '❌ Mismatch'
      END
    ELSE '✅ No number in label'
  END as label_check
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.prize_type = 'points' AND gp.active = TRUE
ORDER BY mg.display_name, gp.prize_value DESC;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
DECLARE
  v_total_prizes INTEGER;
  v_fixed_prizes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_prizes
  FROM public.game_prizes
  WHERE prize_type = 'points' AND active = TRUE;
  
  SELECT COUNT(*) INTO v_fixed_prizes
  FROM public.game_prizes
  WHERE prize_type = 'points' 
  AND active = TRUE
  AND label LIKE '%Beans%';
  
  RAISE NOTICE '✅ GAME PRIZE LABELS UPDATED!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total point prizes: %', v_total_prizes;
  RAISE NOTICE 'Labels with "Beans": %', v_fixed_prizes;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Examples:';
  RAISE NOTICE '  "🐍 Snake Eyes! +20 Points" → "🐍 Snake Eyes! +200 Beans"';
  RAISE NOTICE '  "🏆 Perfect! +25 Points" → "🏆 Perfect! +250 Beans"';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
