-- Check ALL sources of pending beans

-- 1. Pending from pending_rewards
SELECT 
  '1. pending_rewards table:' as source,
  COUNT(*) as count,
  SUM(amount) as total
FROM pending_rewards
WHERE user_id = auth.uid()
  AND reward_type = 'points'
  AND status = 'pending';

-- 2. Pending from game_plays
SELECT 
  '2. game_plays table:' as source,
  COUNT(*) as count,
  SUM(prize_value) as total
FROM game_plays
WHERE user_id = auth.uid()
  AND status = 'pending'
  AND prize_type IN ('points', 'beans');

-- 3. List all pending game plays
SELECT 
  '3. All pending game plays:' as info,
  id,
  prize_type,
  prize_value,
  prize_label,
  created_at
FROM game_plays
WHERE user_id = auth.uid()
  AND status = 'pending'
ORDER BY created_at DESC;

-- 4. Total (should match what dashboard shows)
SELECT 
  '4. TOTAL PENDING:' as info,
  (SELECT COALESCE(SUM(amount), 0) FROM pending_rewards WHERE user_id = auth.uid() AND reward_type = 'points' AND status = 'pending') +
  (SELECT COALESCE(SUM(prize_value), 0) FROM game_plays WHERE user_id = auth.uid() AND status = 'pending' AND prize_type IN ('points', 'beans')) as total_pending;
