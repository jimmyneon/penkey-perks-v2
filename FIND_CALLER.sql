-- =============================================
-- FIND WHAT'S CALLING check_and_issue_rewards
-- =============================================

-- Check all functions that reference check_and_issue_rewards
SELECT 
  p.proname as function_name,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only regular functions
  AND p.prosrc LIKE '%check_and_issue_rewards%';
