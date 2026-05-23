-- Simple comparison between your account and Amanda's
-- Replace YOUR_EMAIL with your actual email

-- Step 1: Compare both accounts in users table
SELECT 
  email,
  name,
  role,
  created_at,
  phone,
  date_of_birth
FROM users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 2: Check auth.users for both
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 3: Check role exactly (case sensitivity and whitespace)
SELECT 
  email,
  role,
  role = 'staff' as exact_match_staff,
  role = 'admin' as exact_match_admin,
  LENGTH(role) as role_length,
  LENGTH(TRIM(role)) as trimmed_length,
  TRIM(role) as trimmed_role
FROM users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;

-- Step 4: Test the exact check the API uses
SELECT 
  email,
  role,
  CASE 
    WHEN role IN ('staff', 'admin') THEN '✅ API would allow'
    ELSE '❌ API would block'
  END as api_result,
  CASE
    WHEN NOT (role IN ('staff', 'admin')) THEN 'Role check failed'
    ELSE 'Role check passed'
  END as reason
FROM users
WHERE email IN ('YOUR_EMAIL_HERE', 'amanda@penkey.co.uk')
ORDER BY email;
