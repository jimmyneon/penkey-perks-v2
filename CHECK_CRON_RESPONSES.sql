-- =============================================
-- CHECK CRON JOB RESPONSES
-- See what the API is returning
-- =============================================

-- 1. Check the most recent HTTP responses from cron jobs
SELECT 
  id,
  status_code,
  content_type,
  content::text as response_body,
  error_msg,
  created,
  timed_out
FROM net._http_response 
ORDER BY created DESC 
LIMIT 5;

-- 2. Check cron job execution details with job names
SELECT 
  j.jobname,
  d.runid,
  d.status,
  d.return_message,
  d.start_time,
  d.end_time
FROM cron.job_run_details d
LEFT JOIN cron.job j ON j.jobid = d.jobid
ORDER BY d.start_time DESC 
LIMIT 10;

-- 3. Check pending emails
SELECT 
  id,
  recipient_email,
  subject,
  status,
  retry_count,
  error_message,
  created_at,
  scheduled_for
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if any emails have been sent
SELECT 
  COUNT(*) as total_pending,
  MIN(created_at) as oldest_pending,
  MAX(created_at) as newest_pending
FROM email_queue
WHERE status = 'pending';

SELECT 
  COUNT(*) as total_sent
FROM email_queue
WHERE status = 'sent';

-- 5. Check app_settings
SELECT * FROM app_settings;

-- =============================================
-- INTERPRETATION:
-- =============================================
-- status_code = 200: API is working
-- status_code = 401: CRON_SECRET mismatch
-- status_code = 404: Wrong URL or route not found
-- status_code = 500: Server error (check app logs)
-- error_msg not null: Network/connection error
-- 
-- If status_code = 200 but emails still pending:
-- - Check response_body for error messages
-- - Check if RESEND_API_KEY is set in environment variables
-- - Check app logs for Resend API errors
