-- =============================================
-- TEST IF RLS IS BLOCKING THE INSERT
-- =============================================
-- Run this to see if RLS is preventing profile creation

-- First, check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('users', 'points_transactions', 'user_rewards')
  AND schemaname = 'public';

-- Try to insert a test profile (this will fail if RLS is blocking)
-- We'll use a fake UUID that doesn't exist
DO $$
BEGIN
  -- This should fail with RLS error if that's the issue
  INSERT INTO public.users (id, email, name)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test@test.com',
    'Test User'
  );
  
  RAISE NOTICE 'SUCCESS: Insert worked (RLS is not blocking)';
  
  -- Clean up test data
  DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'RLS IS BLOCKING: You need to disable RLS temporarily for the migration';
  WHEN unique_violation THEN
    RAISE NOTICE 'SUCCESS: Insert worked (RLS is not blocking), but test ID already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: % - %', SQLERRM, SQLSTATE;
END $$;
