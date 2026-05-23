# Email System Troubleshooting Guide

## Quick Diagnosis

### Step 1: Check if emails are being queued
Run this SQL in Supabase:
```sql
SELECT COUNT(*) as pending_count FROM email_queue WHERE status = 'pending';
```

- **If 0**: Emails aren't being created. Check triggers/functions that create emails.
- **If > 0**: Emails are queued but not being sent. Continue to Step 2.

### Step 2: Check if cron job is running
Run this SQL in Supabase:
```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

- **If empty**: Cron job not set up. Run `SUPABASE_CRON_SIMPLE.sql`
- **If exists**: Cron job exists. Check if it's actually running.

### Step 3: Check cron job execution history
Run this SQL in Supabase:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
ORDER BY start_time DESC 
LIMIT 10;
```

- **If empty**: Job never ran. Check app_settings table.
- **If has errors**: Check the error messages.

### Step 4: Check app_settings
Run this SQL in Supabase:
```sql
SELECT * FROM app_settings WHERE key IN ('app_url', 'cron_secret');
```

- **If missing**: Create them (see below)
- **If wrong values**: Update them

### Step 5: Test Resend API directly
Run from your project directory:
```bash
node scripts/test-resend-api.js
```

This will test if your Resend API key is working.

---

## Common Issues & Solutions

### Issue 1: Cron job not set up

**Solution**: Run the cron setup SQL
```bash
# In Supabase SQL Editor, run:
cat SUPABASE_CRON_SIMPLE.sql
```

### Issue 2: app_settings missing

**Solution**: Create app_settings
```sql
-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert settings
INSERT INTO app_settings (key, value) VALUES
  ('app_url', 'https://perks.penkey.co.uk'),
  ('cron_secret', 'your-cron-secret-from-env')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create helper function
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
  SELECT value FROM app_settings WHERE key = setting_key;
$$ LANGUAGE SQL STABLE;
```

### Issue 3: Resend API key invalid

**Symptoms**: 
- Emails stuck in pending
- Error messages about authentication

**Solution**:
1. Go to https://resend.com/api-keys
2. Create a new API key
3. Update `.env.local`:
   ```
   RESEND_API_KEY=re_your_new_key
   ```
4. Restart your dev server

### Issue 4: Domain not verified

**Symptoms**:
- Error: "Domain not verified"
- Emails fail to send

**Solution**:
1. Go to https://resend.com/domains
2. Add your domain: `rewards.penkey.co.uk`
3. Add DNS records as instructed
4. Wait for verification (can take up to 48 hours)

### Issue 5: Emails in queue but not processing

**Symptoms**:
- Pending emails in database
- Cron job exists but not running

**Solution**:
1. Check if cron job is enabled:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
   ```

2. Manually trigger the endpoint:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/emails/process-queue
   ```

3. Check the response for errors

### Issue 6: mark_email_sent function missing

**Symptoms**:
- Error: "function mark_email_sent does not exist"

**Solution**: Create the function
```sql
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_queue_id UUID,
  p_resend_id TEXT,
  p_success BOOLEAN,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_success THEN
    UPDATE email_queue
    SET 
      status = 'sent',
      sent_at = NOW(),
      resend_id = p_resend_id
    WHERE id = p_queue_id;
  ELSE
    UPDATE email_queue
    SET 
      status = 'failed',
      error_message = p_error_message
    WHERE id = p_queue_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Manual Testing

### Test 1: Check email queue
```sql
-- See all pending emails
SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC;

-- See recent sent emails
SELECT * FROM email_queue WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 10;

-- See failed emails
SELECT * FROM email_queue WHERE status = 'failed' ORDER BY created_at DESC;
```

### Test 2: Manually process queue
```bash
# Make sure your dev server is running
npm run dev

# In another terminal:
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 5}' \
  http://localhost:3000/api/emails/process-queue
```

### Test 3: Test Resend API directly
```bash
node scripts/test-resend-api.js
```

### Test 4: Create a test email
```sql
-- Insert a test email into the queue
INSERT INTO email_queue (recipient_email, subject, html_body, status, scheduled_for)
VALUES (
  'your-email@example.com',
  'Test Email',
  '<h1>Test</h1><p>This is a test email.</p>',
  'pending',
  NOW()
);

-- Then manually trigger processing
```

---

## Environment Variables Checklist

Make sure these are set in `.env.local`:

```bash
# Required for emails
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com

# Required for cron jobs
CRON_SECRET=your-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

---

## Monitoring

### Check email statistics
```sql
-- Email queue statistics
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;

-- Emails sent today
SELECT COUNT(*) 
FROM email_queue 
WHERE status = 'sent' 
  AND sent_at::date = CURRENT_DATE;

-- Failed emails today
SELECT 
  recipient_email,
  subject,
  error_message,
  created_at
FROM email_queue 
WHERE status = 'failed' 
  AND created_at::date = CURRENT_DATE;
```

### Check cron job history
```sql
-- Recent cron job runs
SELECT 
  jr.jobid,
  j.jobname,
  jr.status,
  jr.start_time,
  jr.end_time,
  jr.return_message
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'process-email-queue'
ORDER BY jr.start_time DESC
LIMIT 20;
```

---

## Production Checklist

Before deploying to production:

- [ ] Resend API key is set in production environment
- [ ] Domain is verified in Resend
- [ ] CRON_SECRET is set in production
- [ ] app_settings table has correct production URL
- [ ] Cron jobs are scheduled in production database
- [ ] Test email sending in production
- [ ] Monitor email queue for first 24 hours

---

## Getting Help

If emails still aren't working:

1. Run the diagnostic SQL: `CHECK_EMAIL_SYSTEM.sql`
2. Run the test script: `node scripts/test-resend-api.js`
3. Check Resend dashboard: https://resend.com/emails
4. Check Supabase logs for errors
5. Check your application logs for errors

## Quick Fix Commands

```bash
# Test Resend API
node scripts/test-resend-api.js

# Check email queue
# (Run in Supabase SQL Editor)
SELECT * FROM email_queue WHERE status = 'pending' LIMIT 10;

# Manually process emails
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/emails/process-queue

# Reset failed emails to retry
# (Run in Supabase SQL Editor)
UPDATE email_queue 
SET status = 'pending', error_message = NULL 
WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '1 hour';
```
