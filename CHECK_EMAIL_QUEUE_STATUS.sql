-- Check email queue status
SELECT 
  id,
  recipient_email,
  subject,
  status,
  created_at,
  sent_at,
  error_message,
  retry_count
FROM email_queue
ORDER BY created_at DESC
LIMIT 20;

-- Count by status
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Check email logs
SELECT 
  id,
  recipient_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check if Resend API key is configured
SELECT 
  CASE 
    WHEN current_setting('app.settings.resend_api_key', true) IS NOT NULL 
    THEN 'Resend API key is configured'
    ELSE 'Resend API key is NOT configured'
  END as resend_status;
