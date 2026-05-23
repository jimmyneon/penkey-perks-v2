-- =============================================
-- CHECK SIGNUP BEANS IN HISTORY
-- =============================================
-- This query verifies that signup beans appear in transaction history
-- =============================================

-- 1. Check if handle_new_user function exists and its definition
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 2. Check points_transactions table for signup transactions
SELECT 
  user_id,
  amount,
  source,
  description,
  created_at,
  balance_after
FROM public.points_transactions
WHERE source = 'signup'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if 'signup' is in the allowed sources constraint
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'points_transactions'
  AND con.conname LIKE '%source%';

-- 4. Check recent users and their signup transactions
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  pt.amount as signup_beans,
  pt.description,
  pt.created_at as transaction_created
FROM public.users u
LEFT JOIN public.points_transactions pt ON u.id = pt.user_id AND pt.source = 'signup'
WHERE u.created_at >= NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. Check if any users are missing signup transactions
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN pt.id IS NULL THEN '❌ Missing signup transaction'
    ELSE '✅ Has signup transaction'
  END as status
FROM public.users u
LEFT JOIN public.points_transactions pt ON u.id = pt.user_id AND pt.source = 'signup'
WHERE u.created_at >= NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;

-- 6. Verify points_config for signup
SELECT 
  action_type,
  points_amount,
  description,
  active
FROM public.points_config
WHERE action_type = 'signup';
