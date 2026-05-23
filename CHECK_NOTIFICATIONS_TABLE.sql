-- Check notifications table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check recent notifications
SELECT 
  id,
  title,
  message,
  type,
  priority,
  active,
  created_at
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Check if any staff messages exist
SELECT 
  id,
  title,
  type,
  priority,
  created_at
FROM notifications
WHERE type = 'staff_message'
  OR created_by IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
