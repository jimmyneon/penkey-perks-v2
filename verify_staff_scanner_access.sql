-- =============================================
-- Quick Verification: Staff Scanner Access
-- =============================================
-- Run this to check if both users can scan vouchers
-- =============================================

-- Check both users' complete access status
SELECT 
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  -- Page access check
  CASE 
    WHEN u.role IN ('admin', 'staff') THEN '✅'
    ELSE '❌'
  END as can_open_page,
  -- API access check
  CASE 
    WHEN s.id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as can_scan_vouchers,
  -- Overall status
  CASE 
    WHEN u.role IN ('admin', 'staff') AND s.id IS NOT NULL THEN '✅ FULL ACCESS'
    WHEN u.role IN ('admin', 'staff') AND s.id IS NULL THEN '⚠️  CAN OPEN PAGE BUT CANNOT SCAN'
    WHEN u.role NOT IN ('admin', 'staff') AND s.id IS NOT NULL THEN '⚠️  IN STAFF TABLE BUT NO USER ROLE'
    ELSE '❌ NO ACCESS'
  END as status
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email IN ('nfdrepairs@gmail.com', 'amanda@penkey.co.uk')
ORDER BY u.email;

-- Show all staff members for reference
SELECT 
  '=== ALL STAFF MEMBERS ===' as info,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  s.created_at as added_on
FROM staff s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;
