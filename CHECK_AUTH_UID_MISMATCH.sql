-- ============================================================================
-- CHECK AUTH.UID() VS USER_ID MISMATCH
-- ============================================================================
-- The audit shows vouchers exist but aren't displaying. This is likely
-- because auth.uid() (from Supabase auth) doesn't match user_id in profiles.
-- ============================================================================

-- 1. CHECK IF profiles.id MATCHES auth.users.id
-- ============================================================================
SELECT 'Checking if profiles.id matches auth.users.id...' as step;

SELECT 
  p.id as profile_id,
  p.email,
  au.id as auth_user_id,
  CASE 
    WHEN p.id = au.id THEN 'MATCH'
    ELSE 'MISMATCH'
  END as id_match
FROM public.profiles p
LEFT JOIN auth.users au ON p.email = au.email
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. CHECK WHICH USER_ID IS IN user_vouchers
-- ============================================================================
SELECT 'Checking user_id in user_vouchers table...' as step;

SELECT DISTINCT 
  user_id,
  COUNT(*) as voucher_count
FROM public.user_vouchers
GROUP BY user_id;

-- 3. CHECK IF THAT user_id EXISTS IN profiles
-- ============================================================================
SELECT 'Checking if voucher user_ids exist in profiles...' as step;

SELECT 
  uv.user_id,
  p.id as profile_id,
  p.email,
  p.name,
  COUNT(*) as voucher_count
FROM public.user_vouchers uv
LEFT JOIN public.profiles p ON uv.user_id = p.id
GROUP BY uv.user_id, p.id, p.email, p.name;

-- 4. CHECK IF THAT user_id EXISTS IN auth.users
-- ============================================================================
SELECT 'Checking if voucher user_ids exist in auth.users...' as step;

SELECT 
  uv.user_id,
  au.id as auth_user_id,
  au.email,
  COUNT(*) as voucher_count
FROM public.user_vouchers uv
LEFT JOIN auth.users au ON uv.user_id = au.id
GROUP BY uv.user_id, au.id, au.email;

-- 5. TEST WITH ACTUAL USER (REPLACE WITH YOUR AUTH.UID())
-- ============================================================================
-- When logged in as the user, run this to see what auth.uid() returns:
-- SELECT auth.uid() as current_auth_uid;

-- Then check if that matches the user_id in vouchers:
-- SELECT * FROM public.user_vouchers WHERE user_id = 'YOUR_AUTH_UID_HERE';

-- 6. CHECK THE SPECIFIC USER FROM AUDIT (john richardson)
-- ============================================================================
SELECT 'Checking john richardson user...' as step;

SELECT 
  p.id as profile_id,
  p.email,
  p.name,
  au.id as auth_user_id,
  au.email as auth_email,
  CASE 
    WHEN p.id = au.id THEN 'IDs MATCH'
    ELSE 'IDs DO NOT MATCH'
  END as id_check,
  CASE 
    WHEN p.email = au.email THEN 'EMAILS MATCH'
    ELSE 'EMAILS DO NOT MATCH'
  END as email_check
FROM public.profiles p
LEFT JOIN auth.users au ON p.email = au.email
WHERE p.email = 'nfdrepairs@gmail.com';

-- 7. CHECK VOUCHERS FOR THIS USER
-- ============================================================================
SELECT 'Checking vouchers for john richardson...' as step;

SELECT 
  uv.id,
  uv.user_id,
  uv.status,
  vt.name as voucher_name,
  uv.expires_at
FROM public.user_vouchers uv
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.user_id = '50d08b52-a9e4-4c79-b739-1f0e3db1b3d5';

-- 8. DIAGNOSIS SUMMARY
-- ============================================================================
SELECT 'DIAGNOSIS:' as step;

SELECT 
  'If profile_id != auth_user_id, then RLS policy auth.uid() = user_id will fail' as issue_1,
  'The vouchers use profile.id, but auth.uid() returns auth.users.id' as issue_2,
  'Solution: Either fix the user_id in vouchers to match auth.users.id, or change RLS to use profiles table' as solution;
