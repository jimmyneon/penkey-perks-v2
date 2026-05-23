-- =============================================
-- CHECK AMANDA'S CURRENT STATUS
-- =============================================
-- Copy and paste this entire script into Supabase SQL Editor
-- =============================================

-- 1. Check Amanda in users table
SELECT 
  '1️⃣ AMANDA IN USERS TABLE' as step,
  id,
  email,
  name,
  role as user_role,
  created_at
FROM users
WHERE email = 'amanda@penkey.co.uk';

-- 2. Check Amanda in staff table
SELECT 
  '2️⃣ AMANDA IN STAFF TABLE' as step,
  s.id as staff_id,
  s.user_id,
  s.role as staff_role,
  s.created_at as staff_since,
  u.email,
  u.name
FROM staff s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'amanda@penkey.co.uk';

-- 3. Compare with John's access
SELECT 
  '3️⃣ BOTH USERS COMPARISON' as step,
  u.email,
  u.role as user_role,
  s.role as staff_role,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ YES'
    ELSE '❌ NO'
  END as in_staff_table,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ CAN SCAN'
    ELSE '❌ CANNOT SCAN'
  END as scanner_access
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email IN ('amanda@penkey.co.uk', 'nfdrepairs@gmail.com')
ORDER BY u.email;

-- 4. Show ALL staff members
SELECT 
  '4️⃣ ALL STAFF MEMBERS' as step,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  s.created_at as staff_since
FROM staff s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- 5. Final diagnosis
DO $$
DECLARE
  amanda_user_id UUID;
  amanda_in_staff BOOLEAN;
BEGIN
  -- Get Amanda's user ID
  SELECT id INTO amanda_user_id 
  FROM users 
  WHERE email = 'amanda@penkey.co.uk';
  
  IF amanda_user_id IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: Amanda not found in users table!';
  ELSE
    RAISE NOTICE '✅ Amanda found in users table (ID: %)', amanda_user_id;
    
    -- Check if in staff table
    SELECT EXISTS (
      SELECT 1 FROM staff WHERE user_id = amanda_user_id
    ) INTO amanda_in_staff;
    
    IF amanda_in_staff THEN
      RAISE NOTICE '✅ Amanda IS in staff table - Scanner should work!';
      RAISE NOTICE '   If still getting 403, check browser cache or try logout/login';
    ELSE
      RAISE NOTICE '❌ PROBLEM: Amanda NOT in staff table!';
      RAISE NOTICE '   This is why she gets 403 Forbidden';
      RAISE NOTICE '   Run fix_amanda_staff_NOW.sql to fix it';
    END IF;
  END IF;
END $$;
