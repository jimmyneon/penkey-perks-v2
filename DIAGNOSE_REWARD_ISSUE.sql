-- =============================================
-- DIAGNOSTIC: Find orphaned reward redemptions
-- =============================================
-- This script finds points_transactions for reward redemptions
-- that don't have corresponding user_rewards entries

-- 1. Find all reward redemption transactions
SELECT 
  pt.id,
  pt.user_id,
  pt.amount,
  pt.created_at,
  pt.description,
  pt.metadata,
  u.name as user_name,
  u.email as user_email
FROM points_transactions pt
JOIN users u ON pt.user_id = u.id
WHERE pt.source = 'reward_redemption'
  AND pt.amount < 0  -- Negative = points deducted
ORDER BY pt.created_at DESC;

-- 2. Find reward redemptions WITHOUT corresponding user_rewards
SELECT 
  pt.id as transaction_id,
  pt.user_id,
  pt.amount,
  pt.created_at,
  pt.description,
  pt.metadata->>'reward_id' as reward_id,
  u.name as user_name,
  u.email as user_email
FROM points_transactions pt
JOIN users u ON pt.user_id = u.id
LEFT JOIN user_rewards ur ON (
  ur.user_id = pt.user_id 
  AND ur.reward_id::text = pt.metadata->>'reward_id'
  AND ur.created_at >= pt.created_at - INTERVAL '1 minute'
  AND ur.created_at <= pt.created_at + INTERVAL '1 minute'
)
WHERE pt.source = 'reward_redemption'
  AND pt.amount < 0
  AND ur.id IS NULL  -- No matching user_reward found
ORDER BY pt.created_at DESC;

-- 3. Check if user_rewards table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_rewards'
ORDER BY ordinal_position;

-- 4. Check RLS policies on user_rewards
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_rewards';

-- 5. Check rewards table for referenced rewards
SELECT 
  r.id,
  r.name,
  r.points_cost,
  r.active,
  COUNT(pt.id) as redemption_count
FROM rewards r
LEFT JOIN points_transactions pt ON (
  pt.metadata->>'reward_id' = r.id::text
  AND pt.source = 'reward_redemption'
)
GROUP BY r.id, r.name, r.points_cost, r.active
HAVING COUNT(pt.id) > 0
ORDER BY redemption_count DESC;
