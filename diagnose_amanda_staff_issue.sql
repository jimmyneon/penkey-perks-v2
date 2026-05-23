-- =============================================
-- Diagnose Amanda's Staff Access Issue
-- =============================================

-- 1. Check if Amanda exists in users table
SELECT 
  '=== AMANDA IN USERS TABLE ===' as check_type,
  id,
  email,
  name,
  role,
  created_at
FROM users
WHERE email = 'amanda@penkey.co.uk';

-- 2. Check if Amanda exists in staff table
SELECT 
  '=== AMANDA IN STAFF TABLE ===' as check_type,
  s.id,
  s.user_id,
  s.role as staff_role,
  s.created_at,
  u.email,
  u.name,
  u.role as user_role
FROM staff s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'amanda@penkey.co.uk';

-- 3. Check if staff table exists and has any records
SELECT 
  '=== ALL STAFF MEMBERS ===' as check_type,
  s.id,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  s.created_at
FROM staff s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- 4. Check RLS policies on staff table
SELECT 
  '=== STAFF TABLE RLS POLICIES ===' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'staff'
ORDER BY policyname;

-- 5. Test the exact query the API uses for Amanda
DO $$
DECLARE
  amanda_id UUID;
  staff_record RECORD;
BEGIN
  -- Get Amanda's ID
  SELECT id INTO amanda_id FROM users WHERE email = 'amanda@penkey.co.uk';
  
  IF amanda_id IS NULL THEN
    RAISE NOTICE '❌ Amanda not found in users table!';
  ELSE
    RAISE NOTICE '✅ Amanda found in users table: %', amanda_id;
    
    -- Try to get her staff record (this is what the API does)
    SELECT * INTO staff_record FROM staff WHERE user_id = amanda_id;
    
    IF staff_record IS NULL THEN
      RAISE NOTICE '❌ Amanda NOT found in staff table - THIS IS THE PROBLEM!';
      RAISE NOTICE 'API will return 403 Forbidden';
    ELSE
      RAISE NOTICE '✅ Amanda found in staff table with role: %', staff_record.role;
      RAISE NOTICE 'API should allow access';
    END IF;
  END IF;
END $$;
