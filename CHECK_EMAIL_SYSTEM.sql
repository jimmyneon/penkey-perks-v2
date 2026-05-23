-- Check Email System Status
-- Run these queries in Supabase SQL Editor

-- 1. Check pending emails in queue
SELECT 
  id,
  recipient_email,
  subject,
  status,
  created_at,
  scheduled_for,
  sent_at,
  error_message
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check recent sent emails
SELECT 
  id,
  recipient_email,
  subject,
  status,
  sent_at,
  resend_id
FROM email_queue
WHERE status = 'sent'
ORDER BY sent_at DESC
LIMIT 20;

-- 3. Check failed emails
SELECT 
  id,
  recipient_email,
  subject,
  status,
  error_message,
  created_at
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Email queue statistics
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;

-- 5. Check if mark_email_sent function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'mark_email_sent';

-- 6. Check recent email activity (last 24 hours)
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  status,
  COUNT(*) as count
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), status
ORDER BY hour DESC;

-- 7. Check if there are any stuck emails (pending for more than 1 hour)
SELECT 
  id,
  recipient_email,
  subject,
  created_at,
  scheduled_for,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_pending
FROM email_queue
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;

-- 8. Check cron jobs (if using pg_cron)
SELECT * FROM cron.job WHERE jobname LIKE '%email%';
