-- Check if there's a link between game_plays and pending_rewards

-- 1. Check game_plays columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_plays' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check pending_rewards columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pending_rewards' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there's a pending_reward_id in game_plays
SELECT 
  '3. Game plays with pending_reward_id:' as info,
  id,
  prize_type,
  prize_value,
  status,
  pending_reward_id
FROM game_plays
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
