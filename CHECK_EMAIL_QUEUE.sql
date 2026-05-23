-- =============================================
-- CHECK EMAIL QUEUE STATUS
-- =============================================

-- Check if emails are in the queue
SELECT 
  id,
  recipient_email,
  subject,
  status,
  scheduled_for,
  created_at,
  retry_count
FROM email_queue
WHERE recipient_email = 'jimmyneon@hotmail.com'
ORDER BY created_at DESC;

-- Check total queue count
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Check if there are any pending emails
SELECT COUNT(*) as pending_count
FROM email_queue
WHERE status = 'pending'
  AND scheduled_for <= NOW();
