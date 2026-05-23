-- Simple cron job setup (pg_cron already enabled)
-- Just run this to schedule the jobs

-- First, unschedule any existing jobs to avoid duplicates
SELECT cron.unschedule('process-email-queue');
SELECT cron.unschedule('send-daily-reminders');
SELECT cron.unschedule('send-birthday-emails');
SELECT cron.unschedule('expire-old-rewards');

-- ============================================
-- CRON JOB 1: Process Email Queue (Every 5 minutes)
-- ============================================
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := get_app_setting('app_url') || '/api/emails/process-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_app_setting('cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- CRON JOB 2: Send Daily Reminders (9 AM daily)
-- ============================================
SELECT cron.schedule(
  'send-daily-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := get_app_setting('app_url') || '/api/emails/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_app_setting('cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- CRON JOB 3: Send Birthday Emails (8 AM daily)
-- ============================================
SELECT cron.schedule(
  'send-birthday-emails',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := get_app_setting('app_url') || '/api/emails/send-birthday',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_app_setting('cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- CRON JOB 4: Expire Old Rewards (Midnight daily)
-- ============================================
SELECT cron.schedule(
  'expire-old-rewards',
  '0 0 * * *',
  $$
  UPDATE user_rewards
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW()
    AND expires_at IS NOT NULL;
  $$
);

-- ============================================
-- Verify jobs are scheduled
-- ============================================
SELECT jobid, jobname, schedule, command 
FROM cron.job 
ORDER BY jobname;
