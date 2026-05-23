-- =============================================
-- TEST EMAIL API MANUALLY
-- This will trigger email processing RIGHT NOW
-- and show you exactly what's happening
-- =============================================

-- First, show what we're about to do
DO $$
DECLARE
  v_app_url TEXT;
  v_cron_secret TEXT;
BEGIN
  SELECT value INTO v_app_url FROM app_settings WHERE key = 'app_url';
  SELECT value INTO v_cron_secret FROM app_settings WHERE key = 'cron_secret';
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Testing Email Processing API';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'App URL: %', v_app_url;
  RAISE NOTICE 'Endpoint: %/api/emails/process-queue', v_app_url;
  RAISE NOTICE 'Cron Secret: %...', LEFT(v_cron_secret, 10);
  RAISE NOTICE '===========================================';
END $$;

-- Trigger the email processing
SELECT net.http_post(
  url := (SELECT value FROM app_settings WHERE key = 'app_url') || '/api/emails/process-queue',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'cron_secret')
  ),
  body := '{}'::jsonb
) as request_id;

-- Wait a moment for the response (run this after a few seconds)
-- Check the response
SELECT 
  '=== HTTP RESPONSE ===' as section,
  id,
  status_code,
  content::text as response_body,
  error_msg,
  created
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;

-- Check if emails changed status
SELECT 
  '=== EMAIL QUEUE STATUS ===' as section,
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status
ORDER BY status;

-- Show recent email attempts
SELECT 
  '=== RECENT EMAILS ===' as section,
  id,
  recipient_email,
  subject,
  status,
  attempts,
  error_message,
  sent_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- WHAT TO LOOK FOR:
-- =============================================
-- 
-- status_code = 200 AND response_body contains "success":
--   ✅ API is working correctly
--   ✅ Check if emails changed from 'pending' to 'sent'
--   ❌ If still pending, check error_message column
--
-- status_code = 401:
--   ❌ CRON_SECRET mismatch
--   Fix: Make sure CRON_SECRET in .env.local matches app_settings
--
-- status_code = 500:
--   ❌ Server error
--   Fix: Check Vercel logs for error details
--
-- error_msg not null:
--   ❌ Network error
--   Fix: Check app_url is correct and app is deployed
--
-- status_code = 200 but emails still pending:
--   ❌ Resend API issue
--   Fix: Check RESEND_API_KEY is set in environment variables
--   Fix: Check Vercel logs for Resend API errors
