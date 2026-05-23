-- =============================================
-- TEST: Check if points_config data exists
-- =============================================

-- 1. Check if table exists
SELECT 'Table Check' as test, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'points_config'
       ) THEN '✅ Table exists' ELSE '❌ Table missing' END as result;

-- 2. Count total configs
SELECT 'Total Configs' as test, 
       COUNT(*) as result 
FROM points_config;

-- 3. Count active configs
SELECT 'Active Configs' as test, 
       COUNT(*) as result 
FROM points_config 
WHERE active = TRUE;

-- 4. Show all configs
SELECT 
  action_type,
  points_amount,
  description,
  active,
  min_interval_hours,
  max_per_day
FROM points_config
ORDER BY points_amount DESC;

-- 5. Test the exact query from the page
SELECT 
  action_type, 
  points_amount, 
  description, 
  active
FROM points_config
WHERE active = true
ORDER BY points_amount DESC;

-- 6. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'points_config';
