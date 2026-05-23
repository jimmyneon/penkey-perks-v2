-- Simple fix for Amanda's access issue
-- First, let's find the correct table name

-- Step 1: Find what schema the users table is in
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name = 'users'
  AND table_schema NOT IN ('pg_catalog', 'information_schema');

-- Step 2: Check Amanda in auth.users
SELECT 
  'Amanda in auth.users' as check,
  id as auth_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'amanda@penkey.co.uk';

-- Step 3: Check Amanda in the users table (trying different schemas)
-- Try without schema prefix first
SELECT 
  'Amanda in users table' as check,
  id as users_id,
  email,
  name,
  role
FROM users
WHERE email = 'amanda@penkey.co.uk';

-- Step 4: Compare the IDs
SELECT 
  'UUID Comparison' as check,
  au.id as auth_uuid,
  u.id as users_uuid,
  au.email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs Match - Not the problem'
    ELSE '❌ IDs MISMATCH - This is the problem!'
  END as diagnosis
FROM auth.users au
LEFT JOIN users u ON au.email = u.email
WHERE au.email = 'amanda@penkey.co.uk';

-- Step 5: If there's a mismatch, fix it
-- ONLY RUN THIS IF STEP 4 SHOWS A MISMATCH
UPDATE users
SET id = (SELECT id FROM auth.users WHERE email = 'amanda@penkey.co.uk')
WHERE email = 'amanda@penkey.co.uk'
  AND id != (SELECT id FROM auth.users WHERE email = 'amanda@penkey.co.uk');

-- Step 6: Verify the fix
SELECT 
  'After Fix' as check,
  au.id as auth_uuid,
  u.id as users_uuid,
  au.email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '✅ Fixed!'
    ELSE '❌ Still mismatched'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.email = u.email
WHERE au.email = 'amanda@penkey.co.uk';
