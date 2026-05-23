# Fixes Applied - October 13, 2025

## 1. Fixed: Push Notification Window Error ✅

**Issue**: `ReferenceError: window is not defined` in push-notification-prompt.tsx

**Cause**: Component was trying to access `window` during server-side rendering (SSR)

**Solution**: 
- Added `isClient` state to track when component is mounted on client
- Added `typeof window === 'undefined'` checks before accessing window
- Component now only renders after client-side hydration

**Files Modified**:
- `components/push-notification-prompt.tsx`

**Result**: No more SSR errors, push notification prompt works correctly

---

## 2. Email System Diagnostics Created ✅

Created comprehensive tools to diagnose and fix email issues:

### New Files Created:

1. **`scripts/test-resend-api.js`**
   - Tests Resend API key directly
   - Sends a test email
   - Provides detailed error messages
   - Usage: `node scripts/test-resend-api.js`

2. **`scripts/test-email-system.sh`**
   - Checks environment variables
   - Tests email processing endpoint
   - Provides manual test commands
   - Usage: `./scripts/test-email-system.sh`

3. **`CHECK_EMAIL_SYSTEM.sql`**
   - SQL queries to check email queue status
   - Check pending, sent, and failed emails
   - View email statistics
   - Check cron job configuration

4. **`EMAIL_TROUBLESHOOTING_GUIDE.md`**
   - Complete step-by-step troubleshooting guide
   - Common issues and solutions
   - Manual testing procedures
   - Production checklist

---

## How to Test Email System

### Quick Test (Recommended):
```bash
# 1. Test Resend API directly
node scripts/test-resend-api.js

# 2. Check email queue in Supabase
# Run queries from CHECK_EMAIL_SYSTEM.sql

# 3. Manually trigger email processing
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/emails/process-queue
```

### Full Diagnostic:
```bash
# Run the full test script
./scripts/test-email-system.sh
```

---

## Common Email Issues & Quick Fixes

### Issue: Emails not sending

**Check 1**: Are emails being queued?
```sql
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';
```

**Check 2**: Is cron job running?
```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

**Check 3**: Is Resend API key valid?
```bash
node scripts/test-resend-api.js
```

### Issue: Cron job not set up

**Fix**: Run this in Supabase SQL Editor:
```sql
-- See SUPABASE_CRON_SIMPLE.sql
```

### Issue: app_settings missing

**Fix**: Create app_settings table and populate:
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO app_settings (key, value) VALUES
  ('app_url', 'https://perks.penkey.co.uk'),
  ('cron_secret', 'your-cron-secret')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## Environment Variables Required

Make sure these are set in `.env.local`:

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com

# Cron Jobs
CRON_SECRET=your-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Next Steps

1. **Test Resend API**:
   ```bash
   node scripts/test-resend-api.js
   ```

2. **Check Email Queue**:
   - Open Supabase SQL Editor
   - Run queries from `CHECK_EMAIL_SYSTEM.sql`

3. **Verify Cron Jobs**:
   ```sql
   SELECT * FROM cron.job;
   ```

4. **If cron jobs missing**:
   - Run `SUPABASE_CRON_SIMPLE.sql` in Supabase

5. **Monitor**:
   - Check email queue regularly
   - Monitor Resend dashboard: https://resend.com/emails
   - Check for failed emails

---

## Files Reference

- **Troubleshooting**: `EMAIL_TROUBLESHOOTING_GUIDE.md`
- **Test Scripts**: `scripts/test-resend-api.js`, `scripts/test-email-system.sh`
- **SQL Diagnostics**: `CHECK_EMAIL_SYSTEM.sql`
- **Cron Setup**: `SUPABASE_CRON_SIMPLE.sql`
- **Email Processing**: `app/api/emails/process-queue/route.ts`

---

## Status

✅ Push notification error fixed
✅ Email diagnostic tools created
⏳ Email system needs testing (run test scripts)
⏳ Verify cron jobs are scheduled
⏳ Verify Resend API key is valid

Run `node scripts/test-resend-api.js` to start testing!
