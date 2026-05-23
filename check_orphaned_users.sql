-- =============================================
-- CHECK FOR ORPHANED AUTH USERS
-- =============================================
-- This script checks for auth.users without corresponding public.users entries
-- and verifies the handle_new_user trigger is working correctly

-- 1. Check for auth users without profiles
SELECT 
  'Orphaned Auth Users' as check_type,
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.raw_user_meta_data->>'name' as metadata_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Check if handle_new_user function exists
SELECT 
  'Function Check' as check_type,
  routine_name,
  routine_schema,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 3. Check if trigger exists
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Count users with and without profiles
SELECT 
  'User Count Summary' as check_type,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_profiles,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users u ON au.id = u.id WHERE u.id IS NULL) as orphaned_count;

-- 5. Check recent signups (last 7 days)
SELECT 
  'Recent Signups (Last 7 Days)' as check_type,
  au.id,
  au.email,
  au.created_at,
  CASE WHEN u.id IS NOT NULL THEN 'Has Profile' ELSE 'MISSING PROFILE' END as profile_status,
  CASE WHEN pt.user_id IS NOT NULL THEN 'Has Signup Points' ELSE 'MISSING POINTS' END as points_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
LEFT JOIN public.points_transactions pt ON au.id = pt.user_id AND pt.source = 'signup'
WHERE au.created_at >= NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;
