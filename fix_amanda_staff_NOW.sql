-- =============================================
-- IMMEDIATE FIX: Add Amanda to Staff Table
-- =============================================
-- This will fix the 403 Forbidden error immediately
-- =============================================

-- Add Amanda to staff table as employee
INSERT INTO public.staff (user_id, role)
SELECT 
  id,
  'employee'
FROM public.users
WHERE email = 'amanda@penkey.co.uk'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'employee',
  updated_at = NOW();

-- Verify it worked
SELECT 
  '✅ AMANDA STAFF ACCESS FIXED' as result,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  s.created_at as staff_since,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ CAN SCAN VOUCHERS'
    ELSE '❌ STILL CANNOT SCAN'
  END as scanner_access
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email = 'amanda@penkey.co.uk';

-- Also verify John's access
SELECT 
  '=== JOHN FOR COMPARISON ===' as result,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  s.created_at as staff_since,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ CAN SCAN VOUCHERS'
    ELSE '❌ CANNOT SCAN'
  END as scanner_access
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email = 'nfdrepairs@gmail.com';
