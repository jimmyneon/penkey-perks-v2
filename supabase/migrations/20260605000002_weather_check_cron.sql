-- =============================================
-- WEATHER CHECK CRON JOB
-- Checks weather every 30 minutes and activates rainy day offers
-- =============================================

-- Add cron job to check weather every 30 minutes
SELECT cron.schedule(
  'check-weather-and-activate-offers',
  '*/30 * * * *', -- Every 30 minutes
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

-- Comment
COMMENT ON cron.job 'check-weather-and-activate-offers' IS 'Checks weather every 30 minutes and activates rainy day promotional offers';

SELECT 'Weather check cron job scheduled successfully!' as message;
