-- =============================================
-- CHECK POINTS TRACKING SCHEMA
-- =============================================

-- 1. Check users table columns
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
  AND column_name LIKE '%point%' OR column_name LIKE '%stamp%' OR column_name LIKE '%pending%'
ORDER BY ordinal_position;

-- 2. Check all tables related to points
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%point%' 
    OR table_name LIKE '%transaction%'
    OR table_name LIKE '%reward%'
    OR table_name LIKE '%pending%'
  )
ORDER BY table_name;

-- 3. Check pending_rewards table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pending_rewards'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check transactions table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if points_transactions table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'points_transactions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Show current user points breakdown
SELECT 
  id,
  name,
  points as available_points,
  stamps as available_stamps,
  pending_rewards_count,
  (SELECT COALESCE(SUM(amount), 0) FROM pending_rewards WHERE user_id = users.id AND status = 'pending' AND reward_type = 'points') as pending_points,
  (SELECT COALESCE(SUM(amount), 0) FROM pending_rewards WHERE user_id = users.id AND status = 'pending' AND reward_type = 'stamps') as pending_stamps
FROM users
WHERE id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903';
