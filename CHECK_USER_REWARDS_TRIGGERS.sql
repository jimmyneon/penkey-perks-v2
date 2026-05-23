-- Check for triggers on user_rewards table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_rewards'
ORDER BY trigger_name;

-- Check trigger functions
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%reward%'
  OR p.proname LIKE '%redeem%'
ORDER BY p.proname;
