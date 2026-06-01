-- ============================================================================
-- VOUCHER SYSTEM AUDIT
-- ============================================================================
-- This file checks the entire voucher system to diagnose why vouchers
-- are not displaying on the dashboard
-- ============================================================================

-- 1. CHECK IF VOUCHER TABLES EXIST
-- ============================================================================
SELECT 'Checking if voucher tables exist...' as audit_step;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('user_vouchers', 'voucher_templates')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. CHECK TOTAL VOUCHER COUNTS
-- ============================================================================
SELECT 'Checking total voucher counts...' as audit_step;

SELECT 
  (SELECT COUNT(*) FROM public.user_vouchers) as total_user_vouchers,
  (SELECT COUNT(*) FROM public.voucher_templates) as total_voucher_templates,
  (SELECT COUNT(*) FROM public.user_vouchers WHERE status = 'active') as active_vouchers,
  (SELECT COUNT(*) FROM public.user_vouchers WHERE status = 'redeemed') as redeemed_vouchers,
  (SELECT COUNT(*) FROM public.user_vouchers WHERE status = 'expired') as expired_vouchers;

-- 3. CHECK VOUCHER TEMPLATES
-- ============================================================================
SELECT 'Checking voucher templates...' as audit_step;

SELECT 
  id,
  name,
  description,
  category,
  bean_threshold,
  expiry_days,
  created_at
FROM public.voucher_templates
ORDER BY bean_threshold;

-- 4. CHECK ALL USER VOUCHERS WITH DETAILS
-- ============================================================================
SELECT 'Checking all user vouchers with details...' as audit_step;

SELECT 
  uv.id,
  uv.user_id,
  p.name as user_name,
  p.email as user_email,
  uv.voucher_template_id,
  vt.name as voucher_name,
  vt.description as voucher_description,
  vt.category,
  vt.bean_threshold,
  uv.status,
  uv.qr_code,
  uv.expires_at,
  uv.created_at,
  uv.redeemed_at,
  uv.redeemed_by
FROM public.user_vouchers uv
LEFT JOIN public.profiles p ON uv.user_id = p.id
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
ORDER BY uv.created_at DESC;

-- 5. CHECK RLS STATUS ON VOUCHER TABLES
-- ============================================================================
SELECT 'Checking RLS status on voucher tables...' as audit_step;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('user_vouchers', 'voucher_templates')
  AND schemaname = 'public';

-- 6. CHECK RLS POLICIES ON user_vouchers
-- ============================================================================
SELECT 'Checking RLS policies on user_vouchers...' as audit_step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_vouchers'
  AND schemaname = 'public';

-- 7. CHECK RLS POLICIES ON voucher_templates
-- ============================================================================
SELECT 'Checking RLS policies on voucher_templates...' as audit_step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'voucher_templates'
  AND schemaname = 'public';

-- 8. CHECK FOR EXPIRED VOUCHERS THAT SHOULD BE UPDATED
-- ============================================================================
SELECT 'Checking for expired vouchers...' as audit_step;

SELECT 
  uv.id,
  uv.user_id,
  p.email,
  vt.name as voucher_name,
  uv.status,
  uv.expires_at,
  NOW() as current_time,
  CASE 
    WHEN uv.expires_at < NOW() AND uv.status = 'active' THEN 'SHOULD BE EXPIRED'
    ELSE 'OK'
  END as status_check
FROM public.user_vouchers uv
LEFT JOIN public.profiles p ON uv.user_id = p.id
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.status = 'active'
ORDER BY uv.expires_at;

-- 9. CHECK INDEXES ON VOUCHER TABLES
-- ============================================================================
SELECT 'Checking indexes on voucher tables...' as audit_step;

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('user_vouchers', 'voucher_templates')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 10. TEST QUERY (SIMULATE WHAT THE DASHBOARD DOES)
-- ============================================================================
SELECT 'Testing dashboard query (replace YOUR_USER_ID with actual user_id)...' as audit_step;

-- Uncomment and replace with actual user_id to test:
-- SELECT 
--   uv.*,
--   vt.name as voucher_name,
--   vt.description,
--   vt.category,
--   vt.bean_threshold
-- FROM public.user_vouchers uv
-- LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
-- WHERE uv.user_id = 'YOUR_USER_ID_HERE'
--   AND uv.status = 'active'
-- ORDER BY uv.created_at DESC;

-- 11. CHECK IF ANY USERS HAVE ACTIVE VOUCHERS
-- ============================================================================
SELECT 'Checking which users have active vouchers...' as audit_step;

SELECT 
  uv.user_id,
  p.name,
  p.email,
  COUNT(*) as active_voucher_count,
  ARRAY_AGG(DISTINCT vt.name) as voucher_names
FROM public.user_vouchers uv
LEFT JOIN public.profiles p ON uv.user_id = p.id
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.status = 'active'
GROUP BY uv.user_id, p.name, p.email
ORDER BY active_voucher_count DESC;

-- 12. CHECK BEAN BALANCES VS VOUCHER THRESHOLDS
-- ============================================================================
SELECT 'Checking bean balances vs voucher thresholds...' as audit_step;

SELECT 
  bb.user_id,
  p.email,
  bb.current_beans,
  vt.bean_threshold,
  vt.name as voucher_name,
  CASE 
    WHEN bb.current_beans >= vt.bean_threshold THEN 'ELIGIBLE'
    ELSE 'NOT ELIGIBLE'
  END as eligibility
FROM public.bean_balances bb
LEFT JOIN public.profiles p ON bb.user_id = p.id
CROSS JOIN public.voucher_templates vt
ORDER BY bb.user_id, vt.bean_threshold;
