# Final Setup Checklist - What Still Needs to Be Done

## ✅ Already Completed

### Code & Components
- ✅ Service worker with auto-update logic
- ✅ Realtime provider created and integrated
- ✅ Push notification prompt (modal with 2-week intervals)
- ✅ Clickable dashboard elements (profile tiles, bean jar, points)
- ✅ PWA manifest configured
- ✅ Icons in correct locations
- ✅ Logo files placed correctly

### Migrations Created
- ✅ `20251013_add_free_coffee_on_signup.sql` - 250 beans + free coffee
- ✅ `20251013_fix_staff_email_messaging.sql` - Email template for staff messages

---

## ⚠️ NEEDS TO BE DONE - Database Setup

### 1. Run Migrations

```bash
# Apply both new migrations
supabase db push
```

Or manually:
```bash
psql -f supabase/migrations/20251013_add_free_coffee_on_signup.sql
psql -f supabase/migrations/20251013_fix_staff_email_messaging.sql
```

---

### 2. Enable Supabase Realtime (IMPORTANT!)

**Realtime is NOT enabled by default on tables!**

You need to enable it in Supabase Dashboard:

#### Option A: Via Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/publications
2. Click on the `supabase_realtime` publication
3. Enable realtime for these tables:
   - ✅ `points_transactions`
   - ✅ `user_rewards`
   - ✅ `pending_rewards`
   - ✅ `coffee_stamps`
   - ✅ `game_plays`

#### Option B: Via SQL
```sql
-- Enable realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE coffee_stamps;
ALTER PUBLICATION supabase_realtime ADD TABLE game_plays;
```

**Verify it's enabled:**
```sql
-- Check which tables have realtime enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

---

### 3. Enable pg_net Extension (For Email Cron Jobs)

```sql
-- In Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Why needed:** The cron jobs use `net.http_post()` to call your API endpoints for processing emails.

---

### 4. Configure App Settings

```sql
-- Update with your actual production URL
UPDATE app_settings 
SET value = 'https://perks.penkey.co.uk' 
WHERE key = 'app_url';

-- Generate a secure random string and set it
UPDATE app_settings 
SET value = 'your-secure-random-string-here' 
WHERE key = 'cron_secret';
```

**Also add to environment variables:**
```env
CRON_SECRET=your-secure-random-string-here
```

---

### 5. Set Up Cron Jobs

Run the contents of `SUPABASE_CRON_SIMPLE.sql` in Supabase SQL Editor.

This schedules:
- Email queue processing (every 5 minutes)
- Daily reminders (9 AM)
- Birthday emails (8 AM)
- Reward expiry (midnight)

**Verify cron jobs:**
```sql
SELECT jobid, jobname, schedule, command 
FROM cron.job 
ORDER BY jobname;
```

---

## 🔧 Environment Variables Checklist

Make sure these are set in both `.env.local` (local) and Vercel/production:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=perks@penkey.co.uk

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Cron Jobs
CRON_SECRET=your-secure-random-string

# Admin
ADMIN_EMAILS=john@penkey.co.uk,amanda@penkey.co.uk

# App URL
NEXT_PUBLIC_APP_URL=https://perks.penkey.co.uk
```

---

## 📋 Quick Setup Commands

### All-in-One Setup Script

```bash
# 1. Run migrations
supabase db push

# 2. Enable realtime (copy/paste into Supabase SQL Editor)
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE coffee_stamps;
ALTER PUBLICATION supabase_realtime ADD TABLE game_plays;

# 3. Enable pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

# 4. Configure app settings (update with your values)
UPDATE app_settings SET value = 'https://perks.penkey.co.uk' WHERE key = 'app_url';
UPDATE app_settings SET value = 'your-cron-secret' WHERE key = 'cron_secret';

# 5. Set up cron jobs (run SUPABASE_CRON_SIMPLE.sql)

# 6. Verify everything
SELECT * FROM cron.job;
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

---

## 🧪 Testing After Setup

### Test Realtime
1. Open dashboard in browser
2. Open browser console
3. Look for: `[Realtime] Setting up subscriptions for user: ...`
4. Make a change (e.g., play a game)
5. Should see: `[Realtime] Points transaction: ...`
6. Dashboard should update automatically

### Test Email System
1. Go to Staff Dashboard → Messages
2. Create a message with Email channel checked
3. Send message
4. Check: `SELECT * FROM email_queue WHERE status = 'pending'`
5. Wait 5 minutes or manually trigger: `curl -X POST https://your-domain.com/api/emails/process-queue -H "Authorization: Bearer your-cron-secret"`
6. Check: `SELECT * FROM email_queue WHERE status = 'sent'`

### Test Push Notifications
1. Open dashboard
2. Modal should appear asking for notification permission
3. Click "Enable Notifications"
4. Grant permission
5. Test sending a notification from Staff Dashboard

### Test Free Coffee Signup
1. Create a new test account
2. Check user receives:
   - 250 beans in points
   - 1 Free Coffee reward in user_rewards
3. Verify: `SELECT * FROM user_rewards WHERE user_id = 'new-user-id'`

---

## 🚨 Common Issues & Solutions

### Realtime Not Working
**Symptom:** Dashboard doesn't update automatically
**Fix:** Enable realtime on tables (see step 2 above)
**Verify:** `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`

### Emails Not Sending
**Symptom:** Emails queue but never send
**Possible causes:**
1. ❌ `pg_net` not enabled → `CREATE EXTENSION IF NOT EXISTS pg_net;`
2. ❌ Cron jobs not scheduled → Run `SUPABASE_CRON_SIMPLE.sql`
3. ❌ Wrong `app_url` → Update in `app_settings`
4. ❌ Missing `CRON_SECRET` → Add to environment variables

### Push Notifications Not Working
**Symptom:** Can't subscribe or notifications don't arrive
**Possible causes:**
1. ❌ VAPID keys not set → Check environment variables
2. ❌ Service worker not registered → Check browser console
3. ❌ HTTPS required → Must be on HTTPS (or localhost)

### Free Coffee Not Awarded
**Symptom:** New users don't get free coffee
**Fix:** Run migration: `20251013_add_free_coffee_on_signup.sql`
**Verify:** Check `handle_new_user()` function includes free coffee logic

---

## 📝 Summary

### Must Do Now:
1. ✅ Run migrations (`supabase db push`)
2. ✅ Enable realtime on tables (Supabase Dashboard or SQL)
3. ✅ Enable `pg_net` extension
4. ✅ Configure `app_settings` (app_url, cron_secret)
5. ✅ Set up cron jobs (`SUPABASE_CRON_SIMPLE.sql`)
6. ✅ Add `CRON_SECRET` to environment variables

### Optional But Recommended:
- Test realtime updates
- Test email system
- Test push notifications
- Test new user signup flow
- Clean up old icon folders

### Already Done:
- ✅ All code changes
- ✅ Migrations created
- ✅ Icons in place
- ✅ Components ready

---

## 🎯 Priority Order

**High Priority (Do First):**
1. Run migrations
2. Enable realtime on tables
3. Test basic functionality

**Medium Priority (Do Soon):**
4. Enable pg_net
5. Set up cron jobs
6. Configure app settings

**Low Priority (Can Wait):**
7. Test email system
8. Test push notifications
9. Clean up old files

---

## Need Help?

See these guides for detailed instructions:
- `EMAIL_SYSTEM_SETUP_GUIDE.md` - Email setup
- `STAFF_EMAIL_FIX_SUMMARY.md` - Staff messaging
- `ICON_SETUP_GUIDE.md` - Icon configuration
- `PWA_FIXES_COMPLETE.md` - All PWA changes
- `NOTIFICATION_PROMPT_UPDATE.md` - Push notification modal
