-- =============================================
-- VERIFY EMAIL SYSTEM SETUP
-- =============================================
-- Run this in Supabase SQL Editor to verify everything is set up correctly
-- =============================================

-- Check if all tables exist
SELECT 
  'email_templates' as table_name,
  COUNT(*) as record_count
FROM email_templates
UNION ALL
SELECT 
  'email_triggers' as table_name,
  COUNT(*) as record_count
FROM email_triggers
UNION ALL
SELECT 
  'email_queue' as table_name,
  COUNT(*) as record_count
FROM email_queue
UNION ALL
SELECT 
  'email_logs' as table_name,
  COUNT(*) as record_count
FROM email_logs
UNION ALL
SELECT 
  'email_preferences' as table_name,
  COUNT(*) as record_count
FROM email_preferences;

-- Check email templates
SELECT 
  name,
  display_name,
  category,
  active
FROM email_templates
ORDER BY category, name;

-- Check email triggers
SELECT 
  name,
  event_type,
  table_name,
  active
FROM email_triggers
ORDER BY name;

-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%email%'
ORDER BY routine_name;

-- Check database triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%email%'
ORDER BY trigger_name;

-- Success message
SELECT '✅ Email system verification complete!' as status;
