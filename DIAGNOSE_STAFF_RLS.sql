-- Comprehensive RLS Diagnostic for Staff Access

-- 1. Check all RLS policies on user_rewards
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'user_rewards'
ORDER BY policyname;

-- 2. Check if you're in the staff table
SELECT 'You in staff table:' as check, * 
FROM staff 
WHERE user_id = '5480d475-de07-4285-955a-a358309daec9';

-- 3. Test the RLS policy condition manually
-- This simulates what the policy checks
SELECT 
  'Policy check result:' as test,
  EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.user_id = '5480d475-de07-4285-955a-a358309daec9'
  ) as staff_exists;

-- 4. Try to select user_rewards as your staff user
-- This will show if RLS is blocking
SELECT 
  'Can see rewards:' as test,
  COUNT(*) as count
FROM user_rewards;

-- 5. Check a specific reward
SELECT 
  'Specific reward:' as test,
  id, qr_code, status, user_id
FROM user_rewards
WHERE qr_code ILIKE 'COFFEE-133ed21bb086';

-- 6. TEMPORARY FIX: Disable RLS to test (BE CAREFUL!)
-- Uncomment ONLY for testing, then re-enable immediately
-- ALTER TABLE user_rewards DISABLE ROW LEVEL SECURITY;
-- SELECT 'RLS DISABLED - rewards visible:' as test, COUNT(*) FROM user_rewards;
-- ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
