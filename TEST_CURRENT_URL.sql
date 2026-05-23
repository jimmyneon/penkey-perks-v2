-- =============================================
-- TEST CURRENT APP URL
-- Check if the current app_url is accessible
-- =============================================

-- Show current settings
SELECT 
  'Current app_url: ' || value as info
FROM app_settings 
WHERE key = 'app_url';

-- Test the current URL
SELECT net.http_post(
  url := (SELECT value FROM app_settings WHERE key = 'app_url') || '/api/emails/process-queue',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'cron_secret')
  ),
  body := '{}'::jsonb
) as request_id;

-- Wait a few seconds, then check the response
SELECT 
  status_code,
  content::text as response,
  error_msg,
  created
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;

-- =============================================
-- WHAT TO CHECK:
-- =============================================
-- 
-- status_code = 200: URL is correct and working! ✅
-- status_code = 401: URL works but CRON_SECRET mismatch
-- status_code = 404: URL exists but route not found
-- status_code = null with error_msg: URL is wrong or not accessible
--
-- Common issues:
-- - rewards.penkey.co.uk vs perks.penkey.co.uk
-- - App not deployed to that URL
-- - DNS not configured
