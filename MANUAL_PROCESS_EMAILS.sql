-- =============================================
-- MANUAL EMAIL PROCESSING - Test Without Cron
-- =============================================
-- This tests if the email API endpoint works
-- Run this to manually trigger email processing
-- =============================================

-- First, check if pg_net is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'pg_net extension is not enabled! Run: CREATE EXTENSION IF NOT EXISTS pg_net;';
  END IF;
END $$;

-- Get app settings
DO $$
DECLARE
  v_app_url TEXT;
  v_cron_secret TEXT;
  v_response_id BIGINT;
BEGIN
  -- Get settings
  SELECT value INTO v_app_url FROM app_settings WHERE key = 'app_url';
  SELECT value INTO v_cron_secret FROM app_settings WHERE key = 'cron_secret';
  
  -- Check they exist
  IF v_app_url IS NULL THEN
    RAISE EXCEPTION 'app_url not set in app_settings!';
  END IF;
  
  IF v_cron_secret IS NULL THEN
    RAISE EXCEPTION 'cron_secret not set in app_settings!';
  END IF;
  
  -- Show what we're using
  RAISE NOTICE 'App URL: %', v_app_url;
  RAISE NOTICE 'Calling: %/api/emails/process-queue', v_app_url;
  
  -- Make the HTTP request
  SELECT net.http_post(
    url := v_app_url || '/api/emails/process-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_cron_secret
    ),
    body := '{}'::jsonb
  ) INTO v_response_id;
  
  RAISE NOTICE 'HTTP request sent! Response ID: %', v_response_id;
  RAISE NOTICE 'Check net._http_response table for results';
END $$;

-- Check the response
SELECT 
  id,
  status_code,
  content_type,
  content::text as response_body,
  error_msg,
  created
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;

-- =============================================
-- EXPECTED RESULTS:
-- =============================================
-- status_code = 200: Success! Emails are being processed
-- status_code = 401: Authorization failed (check CRON_SECRET matches)
-- status_code = 500: Server error (check app logs)
-- error_msg not null: Network error (check app_url is correct)
