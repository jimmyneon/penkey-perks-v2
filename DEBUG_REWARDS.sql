-- =============================================
-- DIAGNOSTIC SCRIPT - Run this to debug rewards issue
-- =============================================

-- 1. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('rewards', 'user_rewards');

-- 2. List all policies on rewards tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('rewards', 'user_rewards')
ORDER BY tablename, policyname;

-- 3. Check if user_rewards table exists and has data
SELECT 
  COUNT(*) as total_user_rewards,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rewards,
  COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as redeemed_rewards,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_rewards
FROM public.user_rewards;

-- 4. Check rewards catalog
SELECT 
  COUNT(*) as total_rewards,
  COUNT(CASE WHEN active = true THEN 1 END) as active_rewards
FROM public.rewards;

-- 5. Try to select user_rewards as current user
-- This will fail if RLS is blocking you
SELECT 
  ur.id,
  ur.user_id,
  ur.status,
  ur.created_at,
  r.name as reward_name
FROM public.user_rewards ur
LEFT JOIN public.rewards r ON ur.reward_id = r.id
WHERE ur.user_id = auth.uid()
ORDER BY ur.created_at DESC
LIMIT 5;

-- 6. Check if there are any user_rewards at all (admin view)
-- This bypasses RLS if you're admin
SELECT 
  ur.id,
  ur.user_id,
  ur.status,
  ur.qr_code,
  ur.created_at,
  r.name as reward_name
FROM public.user_rewards ur
LEFT JOIN public.rewards r ON ur.reward_id = r.id
ORDER BY ur.created_at DESC
LIMIT 10;
