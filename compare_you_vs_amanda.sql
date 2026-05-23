-- Compare your account vs Amanda's to find the difference
-- Replace YOUR_EMAIL with your actual email

-- Step 1: Compare both accounts side by side
SELECT 
  'Comparison' as check,
  email,
  name,
  role,
  created_at,
  updated_at,
  email_confirmed_at,
  phone,
  date_of_birth,
  avatar_url
FROM users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 2: Check auth.users for both
SELECT 
  'Auth comparison' as check,
  email,
  email_confirmed_at,
  phone_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  created_at,
  updated_at,
  is_super_admin,
  role as auth_role
FROM auth.users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 3: Check if there's any difference in case sensitivity
SELECT 
  email,
  role,
  role = 'staff' as exact_match_staff,
  role = 'Staff' as capital_staff,
  role = 'STAFF' as uppercase_staff,
  LENGTH(role) as role_length,
  role::bytea as role_bytes
FROM users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 4: Check if Amanda has any restrictions or flags
SELECT 
  u.email,
  u.role,
  u.created_at,
  au.banned_until,
  au.deleted_at,
  au.is_sso_user,
  au.is_anonymous
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY u.email;

-- Step 5: Test the exact API check that's failing
-- This simulates what the get-customer-by-qr API does
SELECT 
  'API Role Check Simulation' as test,
  email,
  role,
  CASE 
    WHEN role IN ('staff', 'admin') THEN '✅ Should pass'
    ELSE '❌ Would fail'
  END as api_check_result,
  role = 'staff' as exact_staff_match,
  role = 'admin' as exact_admin_match
FROM users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 6: Check if there are any other columns that might affect access
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;
