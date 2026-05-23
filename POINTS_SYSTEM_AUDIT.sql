-- =============================================
-- COMPREHENSIVE POINTS SYSTEM AUDIT
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. CHECK IF TABLES EXIST
-- =============================================
SELECT 
  'TABLES CHECK' as audit_section,
  table_name,
  CASE 
    WHEN table_name IN ('points_transactions', 'users', 'coffee_stamps', 'rewards', 'user_rewards') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('points_transactions', 'users', 'coffee_stamps', 'rewards', 'user_rewards')
ORDER BY table_name;

-- 2. CHECK IF FUNCTIONS EXIST
-- =============================================
SELECT 
  'FUNCTIONS CHECK' as audit_section,
  routine_name,
  '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'add_points', 
    'get_user_points', 
    'get_lifetime_points',
    'can_check_in',
    'handle_new_user'
  )
ORDER BY routine_name;

-- 3. CHECK TRIGGERS
-- =============================================
SELECT 
  'TRIGGERS CHECK' as audit_section,
  trigger_name,
  event_object_table,
  action_timing || ' ' || event_manipulation as trigger_event,
  '✅ EXISTS' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  OR trigger_schema = 'auth'
ORDER BY trigger_name;

-- 4. CHECK POINTS TRANSACTIONS STRUCTURE
-- =============================================
SELECT 
  'POINTS_TRANSACTIONS STRUCTURE' as audit_section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'points_transactions'
ORDER BY ordinal_position;

-- 5. CHECK ALL USERS AND THEIR POINTS
-- =============================================
SELECT 
  'USER POINTS SUMMARY' as audit_section,
  u.id,
  u.email,
  u.name,
  u.created_at as user_created,
  COALESCE(SUM(pt.amount), 0) as total_points,
  COUNT(pt.id) as transaction_count,
  MAX(pt.created_at) as last_transaction
FROM public.users u
LEFT JOIN public.points_transactions pt ON u.id = pt.user_id
GROUP BY u.id, u.email, u.name, u.created_at
ORDER BY u.created_at DESC;

-- 6. CHECK ALL POINTS TRANSACTIONS
-- =============================================
SELECT 
  'ALL POINTS TRANSACTIONS' as audit_section,
  pt.id,
  u.email,
  pt.amount,
  pt.balance_after,
  pt.source,
  pt.description,
  pt.created_at
FROM public.points_transactions pt
JOIN public.users u ON pt.user_id = u.id
ORDER BY pt.created_at DESC
LIMIT 50;

-- 7. CHECK POINTS SOURCES BREAKDOWN
-- =============================================
SELECT 
  'POINTS BY SOURCE' as audit_section,
  source,
  COUNT(*) as transaction_count,
  SUM(amount) as total_points,
  AVG(amount) as avg_points,
  MIN(created_at) as first_transaction,
  MAX(created_at) as last_transaction
FROM public.points_transactions
GROUP BY source
ORDER BY transaction_count DESC;

-- 8. CHECK CHECK-IN HISTORY (VISIT SOURCE)
-- =============================================
SELECT 
  'CHECK-IN HISTORY' as audit_section,
  u.email,
  pt.created_at as check_in_time,
  pt.amount as points_earned,
  pt.balance_after,
  DATE(pt.created_at) as check_in_date
FROM public.points_transactions pt
JOIN public.users u ON pt.user_id = u.id
WHERE pt.source = 'visit'
ORDER BY pt.created_at DESC
LIMIT 20;

-- 9. TEST can_check_in FUNCTION FOR ALL USERS
-- =============================================
SELECT 
  'CAN CHECK IN TEST' as audit_section,
  u.id,
  u.email,
  public.can_check_in(u.id) as can_check_in_now,
  (
    SELECT MAX(created_at) 
    FROM public.points_transactions 
    WHERE user_id = u.id AND source = 'visit'
  ) as last_check_in,
  (
    SELECT COUNT(*) 
    FROM public.points_transactions 
    WHERE user_id = u.id 
      AND source = 'visit' 
      AND created_at >= date_trunc('day', NOW())
  ) as check_ins_today
FROM public.users u
ORDER BY u.created_at DESC;

-- 10. CHECK RLS POLICIES ON POINTS_TRANSACTIONS
-- =============================================
SELECT 
  'RLS POLICIES' as audit_section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'points_transactions'
ORDER BY policyname;

-- 11. CHECK IF RLS IS ENABLED
-- =============================================
SELECT 
  'RLS STATUS' as audit_section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('points_transactions', 'users', 'coffee_stamps', 'rewards', 'user_rewards')
ORDER BY tablename;

-- 12. VIEW handle_new_user FUNCTION CODE
-- =============================================
SELECT 
  'HANDLE_NEW_USER FUNCTION' as audit_section,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 13. VIEW add_points FUNCTION CODE
-- =============================================
SELECT 
  'ADD_POINTS FUNCTION' as audit_section,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'add_points';

-- 14. VIEW can_check_in FUNCTION CODE
-- =============================================
SELECT 
  'CAN_CHECK_IN FUNCTION' as audit_section,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'can_check_in';

-- =============================================
-- SUMMARY & RECOMMENDATIONS
-- =============================================
SELECT 
  '🔍 AUDIT COMPLETE' as message,
  'Review the results above to identify issues' as next_step;
