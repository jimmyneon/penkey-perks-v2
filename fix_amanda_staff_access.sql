-- =============================================
-- Fix Amanda's Staff Access for QR Scanner
-- =============================================
-- Issue: Amanda cannot scan vouchers but John can
-- Root Cause: Missing entry in staff table
-- =============================================

-- Step 1: Check current status
SELECT 
  '=== CURRENT STATUS ===' as step,
  u.id,
  u.email,
  u.name,
  u.role as user_role,
  s.id as staff_id,
  s.role as staff_role,
  s.created_at as staff_since
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email IN ('nfdrepairs@gmail.com', 'amanda@penkey.co.uk')
ORDER BY u.email;

-- Step 2: Add Amanda to staff table if missing
-- This is what allows the API to verify staff access
DO $$
DECLARE
  amanda_user_id UUID;
  amanda_staff_exists BOOLEAN;
BEGIN
  -- Get Amanda's user ID
  SELECT id INTO amanda_user_id
  FROM users
  WHERE email = 'amanda@penkey.co.uk';
  
  IF amanda_user_id IS NULL THEN
    RAISE EXCEPTION 'Amanda''s user account not found! Email: amanda@penkey.co.uk';
  END IF;
  
  -- Check if she's already in staff table
  SELECT EXISTS (
    SELECT 1 FROM staff WHERE user_id = amanda_user_id
  ) INTO amanda_staff_exists;
  
  IF NOT amanda_staff_exists THEN
    -- Add Amanda to staff table
    INSERT INTO staff (user_id, role)
    VALUES (amanda_user_id, 'employee')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Amanda added to staff table as employee';
  ELSE
    RAISE NOTICE 'Amanda is already in staff table';
  END IF;
  
  -- Also ensure her users.role is set correctly (belt and suspenders)
  UPDATE users
  SET role = 'staff'
  WHERE id = amanda_user_id
  AND role != 'staff';
  
END $$;

-- Step 3: Verify John's access (should already work)
DO $$
DECLARE
  john_user_id UUID;
  john_staff_exists BOOLEAN;
BEGIN
  -- Get John's user ID
  SELECT id INTO john_user_id
  FROM users
  WHERE email = 'nfdrepairs@gmail.com';
  
  IF john_user_id IS NULL THEN
    RAISE EXCEPTION 'John''s user account not found! Email: nfdrepairs@gmail.com';
  END IF;
  
  -- Check if he's in staff table
  SELECT EXISTS (
    SELECT 1 FROM staff WHERE user_id = john_user_id
  ) INTO john_staff_exists;
  
  IF NOT john_staff_exists THEN
    -- Add John to staff table as owner
    INSERT INTO staff (user_id, role)
    VALUES (john_user_id, 'owner')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'John added to staff table as owner';
  ELSE
    RAISE NOTICE 'John is already in staff table';
  END IF;
  
  -- Ensure his role is admin
  UPDATE users
  SET role = 'admin'
  WHERE id = john_user_id
  AND role != 'admin';
  
END $$;

-- Step 4: Verify the fix
SELECT 
  '=== AFTER FIX ===' as step,
  u.id,
  u.email,
  u.name,
  u.role as user_role,
  s.id as staff_id,
  s.role as staff_role,
  s.created_at as staff_since,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ Can scan vouchers'
    ELSE '❌ Cannot scan vouchers'
  END as scanner_access
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email IN ('nfdrepairs@gmail.com', 'amanda@penkey.co.uk')
ORDER BY u.email;

-- Step 5: Test the exact query the API uses
SELECT 
  '=== API QUERY TEST ===' as step,
  'nfdrepairs@gmail.com' as testing_email,
  s.role as staff_role_found,
  CASE 
    WHEN s.role IS NOT NULL THEN '✅ API will allow access'
    ELSE '❌ API will deny access'
  END as api_result
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email = 'nfdrepairs@gmail.com';

SELECT 
  '=== API QUERY TEST ===' as step,
  'amanda@penkey.co.uk' as testing_email,
  s.role as staff_role_found,
  CASE 
    WHEN s.role IS NOT NULL THEN '✅ API will allow access'
    ELSE '❌ API will deny access'
  END as api_result
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email = 'amanda@penkey.co.uk';

-- Success message
SELECT '✅ Staff access fix complete! Both users should now be able to scan vouchers.' as result;
