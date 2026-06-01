-- ============================================================================
-- TEST RLS POLICY WITH ACTUAL USER CONTEXT
-- ============================================================================
-- Since auth.uid() matches user_id, we need to test if RLS is actually working
-- when the user is authenticated. This requires setting the JWT context.
-- ============================================================================

-- 1. TEST BY IMITATING THE DASHBOARD QUERY WITH JWT CONTEXT
-- ============================================================================
-- This simulates what happens when the user is logged in
-- You need to run this with the service role key or by setting the JWT

-- OPTION A: If you have the user's JWT token, you can test with:
-- SET LOCAL request.jwt.claim.sub = '50d08b52-a9e4-4c79-b739-1f0e3db1b3d5';
-- SELECT auth.uid() as current_auth_uid;
-- 
-- SELECT 
--   uv.*,
--   vt.name as voucher_name,
--   vt.description,
--   vt.category,
--   vt.bean_threshold
-- FROM public.user_vouchers uv
-- LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
-- WHERE uv.user_id = auth.uid()
--   AND uv.status = 'active'
-- ORDER BY uv.created_at DESC;

-- OPTION B: Test with service role (bypasses RLS)
-- ============================================================================
-- This should return data if RLS is the issue
SELECT 'Testing with service role (bypass RLS)...' as step;

SELECT 
  uv.*,
  vt.name as voucher_name,
  vt.description,
  vt.category,
  vt.bean_threshold
FROM public.user_vouchers uv
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.user_id = '50d08b52-a9e4-4c79-b739-1f0e3db1b3d5'
  AND uv.status = 'active'
ORDER BY uv.created_at DESC;

-- 2. CHECK IF THERE'S A profiles.id vs auth.users.id ISSUE
-- ============================================================================
-- Even though they match now, let's verify the relationship is correct

SELECT 'Checking profiles table structure...' as step;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name = 'id';

-- 3. CHECK IF THERE'S A FOREIGN KEY CONSTRAINT ISSUE
-- ============================================================================
SELECT 'Checking foreign key constraints on user_vouchers...' as step;

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_vouchers';

-- 4. CHECK THE ACTUAL QUERY THE DASHBOARD RUNS
-- ============================================================================
-- The dashboard uses the Supabase client which should automatically
-- include the auth context. Let's verify the query would work

SELECT 'Simulating dashboard query without auth context (should fail if RLS works)...' as step;

-- This should return 0 rows if RLS is working (no auth context)
SELECT 
  COUNT(*) as row_count
FROM public.user_vouchers
WHERE user_id = '50d08b52-a9e4-4c79-b739-1f0e3db1b3d5'
  AND status = 'active';

-- 5. CHECK IF THE ISSUE IS IN THE FRONTEND QUERY
-- ============================================================================
-- The frontend queries user_vouchers and then separately queries voucher_templates
-- Let's check if voucher_templates RLS is blocking the template data

SELECT 'Testing voucher_templates query...' as step;

SELECT 
  id,
  name,
  description,
  category,
  bean_threshold
FROM public.voucher_templates
WHERE id IN (
  SELECT voucher_template_id 
  FROM public.user_vouchers 
  WHERE user_id = '50d08b52-a9e4-4c79-b739-1f0e3db1b3d5'
    AND status = 'active'
);

-- 6. FINAL DIAGNOSIS
-- ============================================================================
SELECT 'FINAL DIAGNOSIS:' as step;

SELECT 
  'If service role query returns data but client query does not, RLS is blocking it' as diagnosis_1,
  'If both return data, the issue is in the frontend code' as diagnosis_2,
  'Check browser console for the [getActiveVouchers] log messages' as diagnosis_3,
  'The logs will show what userId is being passed and what results are returned' as diagnosis_4;
