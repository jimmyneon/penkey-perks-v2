-- =============================================
-- WEATHER CHECK CRON JOB
-- Checks weather forecast at 8 AM daily to predict lunch period weather
-- =============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (required for cron to call API)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Add cron job to check weather forecast at 8 AM daily
SELECT cron.schedule(
  'check-weather-and-activate-offers',
  '0 8 * * *', -- Daily at 8 AM
  $$
  SELECT net.http_post(
    url := get_app_setting('app_url') || '/api/weather/check-and-activate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_app_setting('cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT 'Weather check cron job scheduled successfully!' as message;
