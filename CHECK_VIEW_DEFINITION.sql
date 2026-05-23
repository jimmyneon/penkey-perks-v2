-- Check how user_points_balance view is defined

SELECT pg_get_viewdef('public.user_points_balance'::regclass, true) as view_definition;

-- Also check if you can query it directly
SELECT * FROM public.user_points_balance WHERE user_id = auth.uid();

-- Check underlying points_transactions table
SELECT 
  COUNT(*) as transaction_count,
  SUM(amount) as calculated_balance
FROM public.points_transactions
WHERE user_id = auth.uid();
