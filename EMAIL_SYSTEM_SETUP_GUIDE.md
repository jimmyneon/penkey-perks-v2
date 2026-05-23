# Email System Setup Guide

## Issue: Staff Messages Show "Sent to 0"

The email system requires several components to work properly. Here's how to fix it:

---

## Prerequisites

1. **Resend API Key** - Must be configured in environment variables
2. **Supabase Extensions** - `pg_cron` and `pg_net` must be enabled
3. **Database Migration** - Email templates and functions must exist

---

## Step 1: Run the Migration

```bash
# Apply the email messaging fix migration
supabase db push

# Or manually:
psql -f supabase/migrations/20251013_fix_staff_email_messaging.sql
```

This creates:
- `staff_announcement` email template
- `mark_email_sent()` function
- `app_settings` table
- `get_app_setting()` helper function

---

## Step 2: Enable Supabase Extensions

### Enable pg_net (Required for Cron HTTP Calls)

```sql
-- In Supabase SQL Editor or psql:
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Why needed:** The cron jobs use `net.http_post()` to call your API endpoints. Without `pg_net`, the cron jobs cannot make HTTP requests.

### Verify pg_cron is Enabled

```sql
-- Check if pg_cron is enabled (should already be enabled on Supabase)
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

---

## Step 3: Configure App Settings

Update the app settings in your database:

```sql
-- Set your production app URL
UPDATE app_settings 
SET value = 'https://your-actual-domain.com' 
WHERE key = 'app_url';

-- Set a secure cron secret (generate a random string)
UPDATE app_settings 
SET value = 'your-secure-random-string-here' 
WHERE key = 'cron_secret';
```

**Important:** Also add `CRON_SECRET` to your environment variables (`.env.local` and Vercel):

```env
CRON_SECRET=your-secure-random-string-here
```

---

## Step 4: Set Up Cron Jobs

Run the cron setup script:

```sql
-- In Supabase SQL Editor:
-- Copy and run the contents of SUPABASE_CRON_SIMPLE.sql
```

This schedules:
1. **Email Queue Processing** - Every 5 minutes
2. **Daily Reminders** - 9 AM daily
3. **Birthday Emails** - 8 AM daily
4. **Reward Expiry** - Midnight daily

### Verify Cron Jobs

```sql
-- Check scheduled jobs
SELECT jobid, jobname, schedule, command 
FROM cron.job 
ORDER BY jobname;
```

You should see 4 jobs listed.

---

## Step 5: Test the System

### Test Email Queue Manually

```bash
# Call the process-queue endpoint directly
curl -X POST https://your-domain.com/api/emails/process-queue \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### Test Staff Message

1. Go to Staff Dashboard → Messages
2. Create a message
3. Check "Email" channel
4. Send message
5. Check the email queue:

```sql
-- View queued emails
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;
```

6. Wait 5 minutes for cron to process, or manually trigger:

```bash
curl -X POST https://your-domain.com/api/emails/process-queue \
  -H "Authorization: Bearer your-cron-secret"
```

---

## Troubleshooting

### "Sent to 0" Issue

**Cause:** The `staff_announcement` email template didn't exist in the `email_templates` table.

**Fix:** Run the migration (Step 1)

### Emails Queue But Never Send

**Possible Causes:**

1. **pg_net not enabled**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. **Cron jobs not scheduled**
   - Run `SUPABASE_CRON_SIMPLE.sql`
   - Verify with: `SELECT * FROM cron.job;`

3. **Wrong app_url in app_settings**
   ```sql
   SELECT * FROM app_settings WHERE key = 'app_url';
   -- Should match your actual domain
   ```

4. **Missing CRON_SECRET**
   - Add to environment variables
   - Must match value in `app_settings`

5. **Resend API key not configured**
   ```env
   RESEND_API_KEY=re_your_api_key
   RESEND_FROM_EMAIL=perks@penkey.co.uk
   ```

### Check Email Queue Status

```sql
-- See all queued emails
SELECT 
  id,
  recipient_email,
  subject,
  status,
  attempts,
  error_message,
  created_at,
  sent_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 20;
```

### Check Cron Job Logs

```sql
-- View cron job execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## How It Works

### When Staff Sends a Message with Email:

1. **Message Created** → `sendStaffMessage()` is called
2. **Email Template Lookup** → Finds `staff_announcement` template
3. **Queue Emails** → Inserts one email per customer into `email_queue`
4. **Returns Count** → Shows "Emails queued: X"

### Cron Job Processes Queue:

1. **Every 5 Minutes** → Cron calls `/api/emails/process-queue`
2. **Fetch Pending** → Gets up to 10 pending emails
3. **Send via Resend** → Calls Resend API for each email
4. **Update Status** → Marks as `sent` or `failed`
5. **Rate Limiting** → 600ms delay between emails (~1.6/sec)

---

## Quick Checklist

- [ ] Run migration: `20251013_fix_staff_email_messaging.sql`
- [ ] Enable `pg_net` extension
- [ ] Verify `pg_cron` is enabled
- [ ] Update `app_url` in `app_settings`
- [ ] Set `cron_secret` in `app_settings`
- [ ] Add `CRON_SECRET` to environment variables
- [ ] Run `SUPABASE_CRON_SIMPLE.sql` to schedule cron jobs
- [ ] Verify cron jobs are scheduled
- [ ] Test by sending a staff message
- [ ] Check email queue
- [ ] Wait 5 minutes or manually trigger processing

---

## Summary

The "sent to 0" issue occurs because:
1. ❌ The `staff_announcement` email template was missing
2. ✅ **Fixed:** Migration creates the template
3. ✅ **Bonus:** Also ensures all supporting functions exist

For emails to actually send:
- ✅ `pg_net` extension must be enabled
- ✅ Cron jobs must be scheduled
- ✅ App settings must be configured
- ✅ Environment variables must be set

Once set up, the system will:
- Queue emails immediately when staff sends a message
- Process the queue every 5 minutes automatically
- Show accurate counts of queued/sent emails
