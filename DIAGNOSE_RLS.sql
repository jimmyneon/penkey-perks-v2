-- Diagnose RLS issue

-- 1. Is RLS enabled on points_transactions?
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'points_transactions';

-- 2. What policies exist?
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'points_transactions';

-- 3. Try querying WITHOUT filtering by user_id
SELECT COUNT(*) as total_rows
FROM public.points_transactions;

-- 4. What is auth.uid()?
SELECT auth.uid() as my_user_id;

-- 5. Try with explicit user_id
SELECT COUNT(*), SUM(amount)
FROM public.points_transactions
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903';

-- 6. Disable RLS temporarily to test
ALTER TABLE public.points_transactions DISABLE ROW LEVEL SECURITY;

-- 7. Try again
SELECT COUNT(*), SUM(amount) as balance
FROM public.points_transactions
WHERE user_id = auth.uid();

-- 8. Re-enable RLS
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
