-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================
-- CRON JOB 1: Process Email Queue (Every 5 minutes)
-- ============================================
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *', -- Every 5 minutes
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
  '0 9 * * *', -- 9 AM daily
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
  '0 8 * * *', -- 8 AM daily
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
  '0 0 * * *', -- Midnight daily
  $$
  UPDATE user_rewards
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW()
    AND expires_at IS NOT NULL;
  $$
);

-- ============================================
-- View all scheduled cron jobs
-- ============================================
COMMENT ON EXTENSION pg_cron IS 'Supabase cron jobs for Penkey Perks';

-- To view all cron jobs, run:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name');
