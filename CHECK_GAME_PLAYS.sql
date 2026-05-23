-- Check game_plays table for unclaimed winnings

-- 1. Check game_plays table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_plays' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Your recent game plays
SELECT 
  '2. Your game plays:' as info,
  id,
  game_id,
  prize_type,
  prize_value,
  claimed_at,
  created_at
FROM game_plays
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 20;

-- 3. Unclaimed game winnings (status = 'pending')
SELECT 
  '3. Unclaimed winnings:' as info,
  COUNT(*) as unclaimed_count,
  SUM(CASE WHEN prize_type IN ('beans', 'points') THEN prize_value ELSE 0 END) as total_beans,
  SUM(CASE WHEN prize_type = 'stamps' THEN prize_value ELSE 0 END) as total_stamps
FROM game_plays
WHERE user_id = auth.uid()
  AND status = 'pending';

-- 4. All game winnings (claimed and unclaimed)
SELECT 
  '4. All winnings:' as info,
  SUM(CASE WHEN prize_type = 'beans' OR prize_type = 'points' THEN prize_value ELSE 0 END) as total_all_beans,
  SUM(CASE WHEN claimed_at IS NOT NULL AND (prize_type = 'beans' OR prize_type = 'points') THEN prize_value ELSE 0 END) as total_claimed,
  SUM(CASE WHEN claimed_at IS NULL AND (prize_type = 'beans' OR prize_type = 'points') THEN prize_value ELSE 0 END) as total_unclaimed
FROM game_plays
WHERE user_id = auth.uid();
