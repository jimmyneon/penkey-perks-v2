-- =============================================
-- DEBUG: Why is "Good Morning" matching at night?
-- =============================================

-- 1. Check what notifications exist with timeOfDay conditions
SELECT 
  id,
  priority,
  title,
  conditions,
  active
FROM notifications
WHERE conditions ? 'timeOfDay'
ORDER BY priority;

-- Expected: Should see "Good Morning" with timeOfDay: "morning"

-- 2. Test the condition matching function manually
-- This should return FALSE (morning != evening)
SELECT match_notification_conditions(
  '{"hasCheckedInToday": false, "timeOfDay": "morning"}'::jsonb,
  '{"hasCheckedInToday": false, "timeOfDay": "evening"}'::jsonb
) as should_be_false;

-- 3. Test what it returns for evening
SELECT match_notification_conditions(
  '{"hasCheckedInToday": false, "timeOfDay": "evening"}'::jsonb,
  '{"hasCheckedInToday": false, "timeOfDay": "evening"}'::jsonb
) as should_be_true;

-- 4. Check if the function even exists
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc 
WHERE proname = 'match_notification_conditions';

-- 5. Test get_user_notifications with evening state
-- Replace USER_ID with your actual user ID
SELECT * FROM get_user_notifications(
  'YOUR_USER_ID'::uuid,
  '{"hasCheckedInToday": false, "timeOfDay": "evening"}'::jsonb
);

-- Expected: Should NOT return "Good Morning"

-- 6. Check all active notifications and their priorities
SELECT 
  priority,
  title,
  conditions,
  active
FROM notifications
WHERE active = true
ORDER BY priority;
