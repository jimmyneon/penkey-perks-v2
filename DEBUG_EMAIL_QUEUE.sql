-- =============================================
-- DEBUG EMAIL QUEUE - Check Why Emails Aren't Sending
-- =============================================

-- 1. Check pending emails
SELECT 
  id,
  recipient_email,
  subject,
  status,
  attempts,
  error_message,
  created_at,
  scheduled_for
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if pg_net extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 3. Check if cron jobs are scheduled
SELECT jobid, jobname, schedule, active, command 
FROM cron.job 
ORDER BY jobname;

-- 4. Check cron job execution history
SELECT 
  jobid,
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- 5. Check app_settings
SELECT * FROM app_settings;

-- 6. Test if mark_email_sent function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'mark_email_sent';

-- =============================================
-- RESULTS INTERPRETATION:
-- =============================================
-- If pg_net is NULL: Need to run "CREATE EXTENSION IF NOT EXISTS pg_net;"
-- If no cron jobs: Need to run SUPABASE_CRON_SIMPLE.sql
-- If cron jobs exist but status = 'failed': Check return_message for errors
-- If app_url is wrong: Update it in app_settings
-- If cron_secret is missing: Add it to app_settings
