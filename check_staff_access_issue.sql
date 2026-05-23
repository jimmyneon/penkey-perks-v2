-- Check staff access for both users
-- Run this in Supabase SQL Editor

-- 1. Check if staff table exists
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'staff';

-- 2. Check both users' roles in users table
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM users
WHERE email IN ('nfdrepairs@gmail.com', 'amanda@penkey.co.uk')
ORDER BY email;

-- 3. If staff table exists, check entries
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'staff'
  ) THEN
    RAISE NOTICE 'Staff table exists - checking entries:';
    
    -- Show staff table entries for both users
    PERFORM 
      s.id,
      s.user_id,
      s.role as staff_role,
      u.email,
      u.name,
      u.role as user_role
    FROM staff s
    JOIN users u ON s.user_id = u.id
    WHERE u.email IN ('nfdrepairs@gmail.com', 'amanda@penkey.co.uk');
  ELSE
    RAISE NOTICE 'No staff table found - system uses users.role only';
  END IF;
END $$;

-- 4. Check RLS policies on staff table (if it exists)
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
WHERE tablename = 'staff'
ORDER BY policyname;

-- 5. Test query that the API uses
SELECT 
  'Testing API query for nfdrepairs@gmail.com' as test_case,
  u.id as user_id,
  u.email,
  u.role as user_role,
  (
    SELECT role 
    FROM staff 
    WHERE user_id = u.id
  ) as staff_table_role
FROM users u
WHERE email = 'nfdrepairs@gmail.com';

SELECT 
  'Testing API query for amanda@penkey.co.uk' as test_case,
  u.id as user_id,
  u.email,
  u.role as user_role,
  (
    SELECT role 
    FROM staff 
    WHERE user_id = u.id
  ) as staff_table_role
FROM users u
WHERE email = 'amanda@penkey.co.uk';
