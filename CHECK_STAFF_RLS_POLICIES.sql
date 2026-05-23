-- =============================================
-- CHECK STAFF TABLE RLS POLICIES
-- =============================================

-- 1. Show all RLS policies on staff table
SELECT 
  '1️⃣ STAFF TABLE RLS POLICIES' as check,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'staff'
ORDER BY policyname;

-- 2. Test if Amanda can read her own staff record
-- This simulates what happens when the API queries
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "amanda-user-id-here"}';

-- Get Amanda's user ID first
SELECT 
  '2️⃣ AMANDA USER ID' as check,
  id as amanda_user_id
FROM users
WHERE email = 'amanda@penkey.co.uk';

-- 3. Test the exact query the API uses
-- Replace the UUID below with Amanda's actual user ID from step 2
DO $$
DECLARE
  amanda_id UUID;
  staff_record RECORD;
BEGIN
  -- Get Amanda's ID
  SELECT id INTO amanda_id FROM users WHERE email = 'amanda@penkey.co.uk';
  
  RAISE NOTICE 'Testing API query for Amanda (ID: %)', amanda_id;
  
  -- This is the EXACT query from the API (line 14-18 of redeem/route.ts)
  SELECT role INTO staff_record
  FROM staff
  WHERE user_id = amanda_id;
  
  IF staff_record IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: Query returned NULL (RLS might be blocking it)';
  ELSE
    RAISE NOTICE '✅ Query returned role: %', staff_record;
  END IF;
END $$;

-- 4. Check if RLS is enabled on staff table
SELECT 
  '3️⃣ RLS STATUS' as check,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'staff';
