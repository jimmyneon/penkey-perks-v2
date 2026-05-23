-- =============================================
-- CHECK GAME PRIZE LABELS
-- =============================================
-- Shows all game prize labels to verify they're correct
-- =============================================

SELECT 
  mg.display_name as game,
  gp.prize_type,
  gp.prize_value as actual_beans,
  gp.label as displayed_label,
  CASE 
    -- Check if label contains the correct bean amount
    WHEN gp.prize_type = 'points' AND gp.label ~ '\+\d+' THEN
      CASE 
        WHEN gp.label ~ ('\+' || gp.prize_value::text || ' ') THEN '✅ Correct'
        WHEN gp.label ~ ('\+' || gp.prize_value::text || '$') THEN '✅ Correct'
        ELSE '❌ Wrong: ' || substring(gp.label from '\+(\d+)') || ' should be ' || gp.prize_value
      END
    WHEN gp.prize_type = 'stamps' THEN '✅ Stamps (OK)'
    WHEN gp.prize_type = 'nothing' THEN '✅ Nothing (OK)'
    ELSE '⚠️ Check manually'
  END as status
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.active = TRUE
ORDER BY mg.display_name, gp.prize_value DESC;

-- Show just the ones that need fixing
SELECT 
  '❌ LABELS THAT NEED FIXING' as issue,
  mg.display_name as game,
  gp.label as current_label,
  gp.prize_value as should_show,
  'UPDATE game_prizes SET label = ''' || 
    REPLACE(gp.label, '+' || substring(gp.label from '\+(\d+)'), '+' || gp.prize_value::text) || 
    ''' WHERE id = ''' || gp.id || ''';' as fix_sql
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.active = TRUE
AND gp.prize_type = 'points'
AND gp.label ~ '\+\d+'
AND NOT (gp.label ~ ('\+' || gp.prize_value::text || '( |$)'));
