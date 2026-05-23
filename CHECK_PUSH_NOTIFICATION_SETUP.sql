-- =============================================
-- CHECK PUSH NOTIFICATION SETUP
-- See what templates exist and if they're configured to auto-send
-- =============================================

-- 1. Check what push notification templates exist
SELECT 
  name,
  title,
  message,
  category,
  trigger_event,
  active,
  priority
FROM push_notification_templates
ORDER BY category, name;

-- 2. Check if there are any email triggers that should also send push
SELECT 
  name,
  event_type,
  conditions,
  active,
  send_push,
  send_email,
  send_in_app
FROM email_triggers
WHERE active = true
ORDER BY event_type;

-- 3. Check recent push subscriptions
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(DISTINCT user_id) as unique_users
FROM push_subscriptions
WHERE active = true;

-- 4. Check if any push notifications have been sent
SELECT 
  COUNT(*) as total_sent,
  MAX(created_at) as last_sent
FROM push_logs;

-- 5. Check recent push logs
SELECT 
  user_id,
  notification_id,
  status,
  error_message,
  created_at
FROM push_logs
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- INTERPRETATION:
-- =============================================
-- 
-- Push notification templates exist but need to be MANUALLY triggered
-- They don't fire automatically unless:
-- 1. You have database triggers set up (currently: NONE)
-- 2. You call sendNotification() in your code
-- 3. You have email_triggers with send_push = true
--
-- To make them automatic, you need to:
-- 1. Add triggers to game plays, rewards, etc.
-- 2. Call sendNotification() when events happen
-- 3. Set up email_triggers with send_push enabled
