-- Fix Amanda's staff access
-- Run this in Supabase SQL Editor

-- Step 1: Find Amanda's user record
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users
WHERE email ILIKE '%amanda%' OR name ILIKE '%amanda%';

-- Step 2: Update Amanda's role to 'staff' (if needed)
-- IMPORTANT: Replace 'amanda@example.com' with her actual email
UPDATE users
SET role = 'staff'
WHERE email = 'amanda@example.com'  -- CHANGE THIS TO HER ACTUAL EMAIL
RETURNING id, email, name, role;

-- Step 3: Verify the update worked
SELECT 
  id,
  email,
  name,
  role
FROM users
WHERE email ILIKE '%amanda%' OR name ILIKE '%amanda%';

-- Step 4: Check if there's a separate staff table that needs updating
-- (Some old migrations might have created this)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'staff'
  ) THEN
    RAISE NOTICE 'Staff table exists - checking if Amanda is in it';
    
    -- Show all staff table records
    RAISE NOTICE 'Staff table contents:';
    PERFORM * FROM staff;
  ELSE
    RAISE NOTICE 'No separate staff table - using users.role only';
  END IF;
END $$;

-- Step 5: Test Amanda's access with the RLS policy
-- Replace AMANDA_USER_ID with her actual UUID from Step 1
SELECT 
  'Testing Amanda RLS access' as test,
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = 'AMANDA_USER_ID'::uuid  -- CHANGE THIS
    AND users.role IN ('staff', 'admin')
  ) as should_have_access;
