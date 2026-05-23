-- Check how many notifications are in the database
SELECT COUNT(*) as total_notifications FROM notifications;

-- Check active notifications
SELECT COUNT(*) as active_notifications FROM notifications WHERE active = true;

-- Show all notification titles
SELECT priority, title, active, conditions 
FROM notifications 
ORDER BY priority 
LIMIT 20;
