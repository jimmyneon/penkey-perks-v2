-- Check if staff messages were created
SELECT 
  id,
  title,
  message,
  type,
  priority,
  active,
  expires_at,
  created_at,
  created_by
FROM notifications
WHERE type = 'staff_message'
  OR created_by IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check all recent notifications
SELECT 
  id,
  title,
  type,
  priority,
  active,
  created_at
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
