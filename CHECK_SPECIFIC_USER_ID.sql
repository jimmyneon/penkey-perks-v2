-- =============================================
-- CHECK SPECIFIC USER ID FROM LOGS
-- =============================================
-- The logs show user ID: da34be25-6692-4976-b095-6a200df3bb34
-- Let's check if THIS specific ID is in the staff table
-- =============================================

-- 1. Check who this user ID belongs to
SELECT 
  '1️⃣ WHO IS THIS USER?' as check,
  id,
  email,
  name,
  role as user_role,
  created_at
FROM users
WHERE id = 'da34be25-6692-4976-b095-6a200df3bb34';

-- 2. Check if THIS user ID is in staff table
SELECT 
  '2️⃣ IS THIS USER IN STAFF TABLE?' as check,
  s.id as staff_id,
  s.user_id,
  s.role as staff_role,
  s.created_at as staff_since,
  u.email,
  u.name
FROM staff s
JOIN users u ON s.user_id = u.id
WHERE s.user_id = 'da34be25-6692-4976-b095-6a200df3bb34';

-- 3. Show what the API query returns for this user
DO $$
DECLARE
  staff_record RECORD;
BEGIN
  -- This is the EXACT query from line 14-18 of redeem/route.ts
  SELECT role INTO staff_record
  FROM staff
  WHERE user_id = 'da34be25-6692-4976-b095-6a200df3bb34';
  
  IF staff_record IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: staff table query returned NULL for this user';
    RAISE NOTICE '   This is why the API returns 403 Forbidden';
    RAISE NOTICE '   User ID da34be25-6692-4976-b095-6a200df3bb34 is NOT in staff table';
  ELSE
    RAISE NOTICE '✅ User IS in staff table with role: %', staff_record;
    RAISE NOTICE '   API should work - check RLS policies or session';
  END IF;
END $$;

-- 4. Compare all users to find the mismatch
SELECT 
  '3️⃣ ALL USERS VS STAFF TABLE' as check,
  u.id,
  u.email,
  u.name,
  u.role as user_role,
  s.role as staff_role,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ IN STAFF TABLE'
    ELSE '❌ NOT IN STAFF TABLE'
  END as staff_status
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.role IN ('staff', 'admin')
ORDER BY u.email;
