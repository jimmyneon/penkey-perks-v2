-- Check the last game play to see what was won

SELECT 
  mg.display_name as game_name,
  gp.prize_type,
  gp.prize_value,
  gp.created_at,
  gp.*
FROM game_plays gp
INNER JOIN mini_games mg ON mg.id = gp.game_id
WHERE gp.user_id = auth.uid()
ORDER BY gp.created_at DESC
LIMIT 1;
