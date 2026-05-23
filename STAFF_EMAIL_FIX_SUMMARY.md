# Staff Email Fix - Summary

## Problem
Staff messages showed "Sent to 0" when trying to send emails to customers.

## Root Cause
The `staff_announcement` email template was missing from the `email_templates` table. The system was looking for this template to queue emails, but couldn't find it, so it queued 0 emails.

## Solution Applied

### 1. Created Migration: `20251013_fix_staff_email_messaging.sql`
This migration:
- ✅ Creates the `staff_announcement` email template
- ✅ Creates/updates the `mark_email_sent()` function
- ✅ Creates the `app_settings` table (if not exists)
- ✅ Creates the `get_app_setting()` helper function
- ✅ Inserts default app settings (app_url, cron_secret)

### 2. Email Template Created
```
Template Name: staff_announcement
Subject: {{title}}
Variables: {{title}}, {{message}}, {{app_url}}
```

Beautiful HTML email with Penkey branding.

## How to Deploy

### Step 1: Run Migration
```bash
supabase db push
```

### Step 2: Enable pg_net Extension
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Why?** The cron jobs use `net.http_post()` to call your API. Without `pg_net`, cron jobs cannot make HTTP requests to process the email queue.

### Step 3: Configure App Settings
```sql
-- Update with your actual domain
UPDATE app_settings 
SET value = 'https://perks.penkey.co.uk' 
WHERE key = 'app_url';

-- Set a secure random string
UPDATE app_settings 
SET value = 'your-secure-random-string' 
WHERE key = 'cron_secret';
```

Also add to environment variables:
```env
CRON_SECRET=your-secure-random-string
```

### Step 4: Set Up Cron Jobs
Run `SUPABASE_CRON_SIMPLE.sql` in Supabase SQL Editor to schedule:
- Email queue processing (every 5 minutes)
- Daily reminders (9 AM)
- Birthday emails (8 AM)
- Reward expiry (midnight)

## How It Works Now

### When Staff Sends Message with Email:
1. Staff creates message and checks "Email" channel
2. System looks up `staff_announcement` template ✅ (now exists!)
3. Gets all customers from database
4. Queues one email per customer in `email_queue` table
5. Returns: "Emails queued: X" (where X = number of customers)

### Cron Job Processes Queue:
1. Every 5 minutes, cron calls `/api/emails/process-queue`
2. Fetches up to 10 pending emails
3. Sends each via Resend API
4. Marks as `sent` or `failed`
5. Respects rate limits (600ms between emails)

## Testing

### 1. Send a Test Message
- Go to Staff Dashboard → Messages
- Create a message
- Check "Email" channel
- Send

### 2. Verify Queue
```sql
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

You should see emails queued for each customer.

### 3. Trigger Processing (Manual)
```bash
curl -X POST https://your-domain.com/api/emails/process-queue \
  -H "Authorization: Bearer your-cron-secret"
```

### 4. Check Results
```sql
SELECT 
  recipient_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

Status should change from `pending` to `sent`.

## Troubleshooting

### Still Shows "Sent to 0"
- ❌ Migration not run → Run `20251013_fix_staff_email_messaging.sql`
- ❌ No customers in database → Check `SELECT * FROM users WHERE role = 'customer'`

### Emails Queue But Never Send
- ❌ `pg_net` not enabled → `CREATE EXTENSION IF NOT EXISTS pg_net;`
- ❌ Cron jobs not scheduled → Run `SUPABASE_CRON_SIMPLE.sql`
- ❌ Wrong `app_url` → Update in `app_settings`
- ❌ Missing `CRON_SECRET` → Add to environment variables
- ❌ Resend API not configured → Check `RESEND_API_KEY` in env

### Check Cron Status
```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

## Complete Setup Checklist

- [ ] Run migration: `20251013_fix_staff_email_messaging.sql`
- [ ] Enable `pg_net` extension
- [ ] Update `app_url` in `app_settings`
- [ ] Set `cron_secret` in `app_settings`
- [ ] Add `CRON_SECRET` to environment variables
- [ ] Run `SUPABASE_CRON_SIMPLE.sql`
- [ ] Verify cron jobs scheduled
- [ ] Test staff message
- [ ] Verify emails queue
- [ ] Wait 5 min or manually trigger processing
- [ ] Verify emails sent

## Files Created
- `supabase/migrations/20251013_fix_staff_email_messaging.sql` - Migration
- `EMAIL_SYSTEM_SETUP_GUIDE.md` - Detailed setup guide
- `STAFF_EMAIL_FIX_SUMMARY.md` - This file

## Related Documentation
- See `EMAIL_SYSTEM_SETUP_GUIDE.md` for detailed instructions
- See `DEPLOYMENT_CHECKLIST.md` for deployment steps
