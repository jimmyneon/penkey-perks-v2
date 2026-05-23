-- =============================================
-- CHECK CURRENT FUNCTION DEFINITION
-- =============================================
-- Run this to see what's actually in your database

SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'add_coffee_stamp'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
