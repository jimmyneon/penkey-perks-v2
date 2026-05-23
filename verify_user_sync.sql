-- =============================================
-- VERIFY USER SYNC BETWEEN AUTH AND PUBLIC
-- =============================================

-- 1. Show all auth users and their profile status
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  au.confirmed_at,
  CASE WHEN u.id IS NOT NULL THEN '✅ Has Profile' ELSE '❌ MISSING' END as profile_status,
  u.name as profile_name,
  u.created_at as profile_created
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- 2. Count summary
SELECT 
  'SUMMARY' as type,
  COUNT(*) as total_auth_users,
  COUNT(u.id) as users_with_profiles,
  COUNT(*) - COUNT(u.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;

-- 3. Show orphaned users details
SELECT 
  'ORPHANED USERS' as type,
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;
