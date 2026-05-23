# 🕐 Supabase Cron Jobs Setup

We're using Supabase's `pg_cron` extension instead of Vercel cron jobs (which require Pro plan).

## ✅ Benefits
- **Free** - No Pro plan needed
- **More reliable** - Runs on database server
- **More frequent** - Can run every 5 minutes
- **Direct database access** - Some jobs don't need API calls

---

## 📋 Setup Steps

### Step 1: Enable pg_cron in Supabase

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/extensions
2. Search for `pg_cron`
3. Click **Enable**

### Step 2: Configure App Settings

Run this in Supabase SQL Editor:

```sql
-- Set your app URL (replace with your Vercel URL after deployment)
ALTER DATABASE postgres SET app.settings.app_url = 'https://your-app.vercel.app';

-- Set your cron secret (use the same one from .env)
ALTER DATABASE postgres SET app.settings.cron_secret = 'your-cron-secret-here';
```

### Step 3: Run the Migration

The migration file `20251012_setup_supabase_cron_jobs.sql` will:
- Enable pg_cron extension
- Set up 4 cron jobs:
  1. **Process Email Queue** - Every 5 minutes
  2. **Send Daily Reminders** - 9 AM daily
  3. **Send Birthday Emails** - 8 AM daily
  4. **Expire Old Rewards** - Midnight daily

Run it in Supabase SQL Editor or it will auto-run on next deployment.

---

## 🔍 Verify Cron Jobs

Check if cron jobs are running:

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🛠️ Manage Cron Jobs

### Unschedule a job
```sql
SELECT cron.unschedule('process-email-queue');
```

### Reschedule a job
```sql
-- First unschedule
SELECT cron.unschedule('process-email-queue');

-- Then schedule again with new timing
SELECT cron.schedule(
  'process-email-queue',
  '*/10 * * * *', -- Every 10 minutes instead
  $$ ... $$
);
```

### Manually trigger a job
Just call the API endpoint directly:
```bash
curl -X POST https://your-app.vercel.app/api/emails/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 What Each Job Does

### 1. Process Email Queue (Every 5 min)
- Sends queued emails from `email_queue` table
- Processes up to 50 emails per run
- Updates status to 'sent' or 'failed'

### 2. Send Daily Reminders (9 AM)
- Sends "come back" emails to inactive users
- Sends "pending rewards" reminders
- Sends milestone achievement emails

### 3. Send Birthday Emails (8 AM)
- Checks for users with birthdays today
- Sends birthday reward emails
- Awards birthday bonus points

### 4. Expire Old Rewards (Midnight)
- Marks expired rewards as 'expired'
- Runs directly in database (no API call)
- Keeps reward data clean

---

## 🚨 Troubleshooting

### Cron jobs not running?
1. Check pg_cron is enabled
2. Verify app settings are configured
3. Check job_run_details for errors
4. Ensure API endpoints have proper auth

### Jobs failing?
```sql
-- Check error logs
SELECT 
  jobid,
  runid,
  job_name,
  status,
  return_message,
  start_time
FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

---

## 🔐 Security

The cron jobs use:
- `CRON_SECRET` environment variable for authentication
- Supabase's secure HTTP client (`net.http_post`)
- Database-level permissions

Make sure your API routes check for the cron secret:
```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## ✅ Deployment Checklist

- [ ] Enable pg_cron extension in Supabase
- [ ] Set app.settings.app_url in database
- [ ] Set app.settings.cron_secret in database
- [ ] Run migration: `20251012_setup_supabase_cron_jobs.sql`
- [ ] Verify jobs are scheduled: `SELECT * FROM cron.job;`
- [ ] Test one job manually
- [ ] Monitor job_run_details for first 24 hours

---

**Ready to set up? Start with Step 1! 🚀**
