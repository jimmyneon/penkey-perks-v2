# Emails Stuck in Queue - Troubleshooting Guide

## Problem
Emails are queued as "pending" but not being sent.

---

## Step-by-Step Fix

### Step 1: Run Diagnostics

Copy and run `DEBUG_EMAIL_QUEUE.sql` in Supabase SQL Editor.

This will show you:
- ✅ Pending emails
- ✅ If pg_net is enabled
- ✅ If cron jobs are scheduled
- ✅ Cron job execution history
- ✅ App settings

---

### Step 2: Enable pg_net Extension

**Most common issue!** The `pg_net` extension is required for cron jobs to make HTTP requests.

```sql
-- Run this in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Verify it's enabled:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Should return a row. If empty, pg_net is not enabled.

---

### Step 3: Set Up Cron Jobs

If cron jobs aren't scheduled, run `SUPABASE_CRON_SIMPLE.sql` in Supabase SQL Editor.

**Verify cron jobs are scheduled:**
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;
```

Should show 4 jobs:
- `process-email-queue` (every 5 minutes)
- `send-daily-reminders` (9 AM daily)
- `send-birthday-emails` (8 AM daily)
- `expire-old-rewards` (midnight daily)

---

### Step 4: Verify App Settings

```sql
SELECT * FROM app_settings;
```

Should show:
```
key         | value
------------|----------------------------------
app_url     | https://perks.penkey.co.uk
cron_secret | 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=
```

**If missing or wrong:**
```sql
-- Update app_url
UPDATE app_settings 
SET value = 'https://perks.penkey.co.uk' 
WHERE key = 'app_url';

-- Update cron_secret (use your actual secret from .env.local)
UPDATE app_settings 
SET value = '3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=' 
WHERE key = 'cron_secret';
```

---

### Step 5: Test Manually

Run `MANUAL_PROCESS_EMAILS.sql` to manually trigger email processing.

This will:
1. Check if pg_net is enabled
2. Get app_url and cron_secret from database
3. Make HTTP POST request to your API
4. Show the response

**Check the response:**
```sql
SELECT 
  status_code,
  content::text as response,
  error_msg
FROM net._http_response 
ORDER BY created DESC 
LIMIT 1;
```

**Response codes:**
- `200` = Success! ✅
- `401` = Unauthorized (CRON_SECRET mismatch)
- `500` = Server error (check app logs)
- `null` with error_msg = Network error (wrong app_url)

---

## Common Issues & Fixes

### Issue 1: pg_net Not Enabled
**Symptom:** Cron jobs scheduled but never run
**Fix:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Issue 2: Cron Jobs Not Scheduled
**Symptom:** No rows in `cron.job` table
**Fix:** Run `SUPABASE_CRON_SIMPLE.sql`

### Issue 3: Wrong app_url
**Symptom:** status_code = null, error_msg shows connection error
**Fix:**
```sql
UPDATE app_settings 
SET value = 'https://your-actual-domain.com' 
WHERE key = 'app_url';
```

### Issue 4: CRON_SECRET Mismatch
**Symptom:** status_code = 401
**Fix:** Make sure the value in `app_settings` matches your `.env.local`:
```sql
-- Check what's in database
SELECT value FROM app_settings WHERE key = 'cron_secret';

-- Check what's in .env.local
-- Should be: CRON_SECRET=3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=

-- Update if they don't match
UPDATE app_settings 
SET value = '3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=' 
WHERE key = 'cron_secret';
```

### Issue 5: Resend API Key Not Set
**Symptom:** status_code = 200 but emails fail with "API key invalid"
**Fix:** Check environment variables:
```env
RESEND_API_KEY=re_your_actual_api_key
RESEND_FROM_EMAIL=perks@penkey.co.uk
```

### Issue 6: App Not Deployed
**Symptom:** Connection errors or 404
**Fix:** Make sure your app is deployed and accessible at the app_url

---

## Quick Checklist

Run through this checklist:

- [ ] pg_net extension enabled
- [ ] Cron jobs scheduled (4 jobs in cron.job)
- [ ] app_url is correct in app_settings
- [ ] cron_secret is set in app_settings
- [ ] CRON_SECRET in environment variables matches database
- [ ] RESEND_API_KEY is set in environment variables
- [ ] App is deployed and accessible
- [ ] Manual test returns status_code = 200

---

## Testing the Full Flow

### 1. Send a Test Message
1. Go to Staff Dashboard → Messages
2. Create a message
3. Check "Email" channel
4. Send

### 2. Check Queue
```sql
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;
```

Should show your test emails.

### 3. Trigger Processing Manually
Run `MANUAL_PROCESS_EMAILS.sql`

### 4. Check Results
```sql
-- Check if emails were sent
SELECT 
  recipient_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;
```

Status should change from `pending` to `sent`.

### 5. Wait for Cron (or trigger manually)
If manual processing works, cron will process automatically every 5 minutes.

---

## Still Not Working?

### Check Cron Job Logs
```sql
SELECT 
  jobname,
  status,
  return_message,
  start_time
FROM cron.job_run_details 
WHERE jobname = 'process-email-queue'
ORDER BY start_time DESC 
LIMIT 5;
```

Look for error messages in `return_message`.

### Check App Logs
If using Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Logs
4. Filter for `/api/emails/process-queue`
5. Look for errors

### Enable Debug Logging
Add to your API route:
```typescript
console.log('Processing email queue...')
console.log('Pending emails:', queuedEmails.length)
```

---

## Success Indicators

You'll know it's working when:
- ✅ Manual test returns status_code = 200
- ✅ Emails change from `pending` to `sent`
- ✅ `sent_at` timestamp is populated
- ✅ Cron job logs show successful runs
- ✅ Recipients receive emails

---

## Summary

**Most likely issue:** pg_net extension not enabled

**Quick fix:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Then wait 5 minutes or run `MANUAL_PROCESS_EMAILS.sql` to test immediately.
