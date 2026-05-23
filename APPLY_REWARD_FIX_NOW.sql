-- =============================================
-- QUICK FIX: Apply this in Supabase SQL Editor
-- =============================================
-- This will create the user_rewards table and fix all orphaned redemptions

-- Step 1: Check current state (optional)
SELECT 
  COUNT(*) as orphaned_count,
  SUM(ABS(amount)) as total_points_lost
FROM points_transactions pt
LEFT JOIN user_rewards ur ON (
  ur.user_id = pt.user_id 
  AND ur.reward_id::text = pt.metadata->>'reward_id'
  AND ur.created_at >= pt.created_at - INTERVAL '5 minutes'
  AND ur.created_at <= pt.created_at + INTERVAL '5 minutes'
)
WHERE pt.source = 'reward_redemption'
  AND pt.amount < 0
  AND ur.id IS NULL;

-- Step 2: Apply the full migration
-- Copy and paste the entire content of:
-- supabase/migrations/20251010_create_user_rewards_and_fix_orphans.sql

-- Or if you have Supabase CLI:
-- Run: supabase db push

-- Step 3: Verify the fix
SELECT 
  COUNT(*) as remaining_orphaned
FROM points_transactions pt
LEFT JOIN user_rewards ur ON (
  ur.user_id = pt.user_id 
  AND ur.reward_id::text = pt.metadata->>'reward_id'
  AND ur.created_at >= pt.created_at - INTERVAL '5 minutes'
  AND ur.created_at <= pt.created_at + INTERVAL '5 minutes'
)
WHERE pt.source = 'reward_redemption'
  AND pt.amount < 0
  AND ur.id IS NULL;
-- Should return 0

-- Step 4: Check created rewards
SELECT 
  ur.id,
  ur.user_id,
  u.name as user_name,
  r.name as reward_name,
  ur.status,
  ur.qr_code,
  ur.expires_at,
  ur.created_at
FROM user_rewards ur
JOIN users u ON ur.user_id = u.id
JOIN rewards r ON ur.reward_id = r.id
ORDER BY ur.created_at DESC
LIMIT 20;
