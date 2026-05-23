# 🚀 DEPLOYMENT CHECKLIST - MESSAGING SYSTEM

**Complete checklist for deploying the messaging system to production**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. **Environment Variables (Vercel)**

Add these to Vercel → Settings → Environment Variables:

```env
# Push Notifications (CRITICAL)
VAPID_PUBLIC_KEY=BIkIB27DZwAs... (your public key)
VAPID_PRIVATE_KEY=J2TOFNbVtKafhlu0... (your private key)
VAPID_SUBJECT=mailto:nfdrepairs@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIkIB27DZwAs... (same as VAPID_PUBLIC_KEY)

# Email (Already configured)
RESEND_API_KEY=re_gCRZG5u7_LFyC36xo8YiMPR21FKH1Anu6
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com

# Cron Job Security (Already configured)
CRON_SECRET=3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

### 2. **Database Migrations (Supabase)**

Run these migrations in order:

```sql
-- 1. Notifications (In-app messages)
supabase/migrations/20251012_migrate_hardcoded_notifications.sql

-- 2. Email Templates
supabase/migrations/20251012_insert_email_templates.sql

-- 3. Push Notifications
supabase/migrations/20251012_push_notifications.sql
```

**Verify:**
```sql
-- Should return 25+ rows
SELECT COUNT(*) FROM notifications;

-- Should return 7 rows
SELECT COUNT(*) FROM email_templates;

-- Should return 0 rows initially
SELECT COUNT(*) FROM push_subscriptions;
```

---

### 3. **Files to Deploy**

Ensure these files are committed:

**Service Worker:**
- ✅ `public/sw.js`

**Push Notification Components:**
- ✅ `components/push-notification-toggle.tsx`
- ✅ `components/push-notification-prompt.tsx`

**Libraries:**
- ✅ `lib/push/send.ts`
- ✅ `lib/email/send.ts`
- ✅ `lib/notification-matcher.ts`

**API Endpoints:**
- ✅ `app/api/push/subscribe/route.ts`
- ✅ `app/api/push/unsubscribe/route.ts`
- ✅ `app/api/push/send/route.ts`
- ✅ `app/api/emails/process-queue/route.ts`
- ✅ `app/api/notifications/get-for-user/route.ts`

**Admin Pages:**
- ✅ `app/admin/email-templates/page.tsx`
- ✅ `app/admin/test-messaging/page.tsx`

---

### 4. **Vercel Configuration**

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/emails/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

✅ Already configured correctly!

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Push to Git
```bash
git add .
git commit -m "Add messaging system: push notifications, emails, in-app notifications"
git push origin main
```

### Step 2: Vercel Auto-Deploy
- Vercel will automatically deploy from main branch
- Wait for build to complete (~2-3 minutes)

### Step 3: Add Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all VAPID keys (copy from `.env.local`)
5. Redeploy to apply new env vars

### Step 4: Run Database Migrations
1. Go to Supabase Dashboard
2. SQL Editor
3. Run the 3 migration files in order
4. Verify data exists

### Step 5: Verify Deployment
1. Visit `https://perks.penkey.co.uk/admin/test-messaging`
2. Run all tests
3. Send test push notification
4. Send test email
5. Check in-app notifications on dashboard

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Push Notifications
```bash
# Enable push on production site
1. Go to https://perks.penkey.co.uk/profile
2. Enable push notifications
3. Allow browser permission

# Send test push
curl -X POST https://perks.penkey.co.uk/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "🎉 Production Test",
    "message": "Push notifications working!",
    "url": "/dashboard"
  }'
```

### Test 2: Email Queue
```bash
# Process email queue manually
curl -X POST https://perks.penkey.co.uk/api/emails/process-queue \
  -H "Authorization: Bearer 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

### Test 3: In-App Notifications
```bash
# Just visit dashboard
https://perks.penkey.co.uk/dashboard
# Should see notification banner
```

### Test 4: Cron Jobs
```bash
# Check Vercel Logs
1. Vercel Dashboard → Deployments → Latest
2. Functions → Logs
3. Look for /api/emails/process-queue
4. Should run every 5 minutes
```

---

## 📊 MONITORING

### Vercel Logs
- Monitor cron job execution
- Check for errors in push/email sending
- View API response times

### Supabase Logs
- Check `email_queue` table for pending emails
- Monitor `push_notifications_log` for delivery status
- Check `email_logs` for sent emails

### Database Queries
```sql
-- Check email queue status
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;

-- Check push subscriptions
SELECT COUNT(*) 
FROM push_subscriptions 
WHERE active = true;

-- Check recent notifications
SELECT * 
FROM push_notifications_log 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚠️ CRITICAL SETTINGS

### 1. **VAPID Keys**
- ⚠️ MUST be added to Vercel environment variables
- ⚠️ MUST redeploy after adding
- ⚠️ Without these, push notifications won't work

### 2. **Service Worker**
- ✅ Must be accessible at `/sw.js`
- ✅ Already in `public/sw.js`
- ✅ Will be served automatically

### 3. **Cron Job Endpoint**
- ✅ Correct path: `/api/emails/process-queue`
- ✅ Already configured in `vercel.json`
- ✅ Runs every 5 minutes

### 4. **Email Rate Limits**
- Resend free tier: 100 emails/day
- Cron processes 10 emails per run
- Runs every 5 minutes = 12 runs/hour
- Max: 120 emails/hour (within limits)

---

## 🔒 SECURITY CHECKLIST

- ✅ CRON_SECRET protects email queue endpoint
- ✅ Admin/staff role checks on all admin endpoints
- ✅ RLS policies on database tables
- ✅ Service role key only on server
- ✅ VAPID private key only on server
- ✅ Resend API key only on server

---

## 📱 BROWSER COMPATIBILITY

### Push Notifications Support:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari 16.4+ (macOS & iOS)
- ❌ Safari < 16.4 (graceful fallback)

### Fallback Behavior:
- If push not supported, toggle doesn't show
- Users still get in-app notifications
- Emails still work

---

## 🎯 SUCCESS CRITERIA

After deployment, verify:

- [ ] Push notification toggle appears in profile
- [ ] Can enable push notifications
- [ ] Push notifications are received
- [ ] In-app notifications show on dashboard
- [ ] Email templates visible in admin
- [ ] Can send test emails
- [ ] Emails appear in inbox
- [ ] Cron job runs every 5 minutes
- [ ] No errors in Vercel logs
- [ ] Database has correct data

---

## 🆘 TROUBLESHOOTING

### Push Notifications Don't Work
1. Check VAPID keys in Vercel env vars
2. Verify `/sw.js` is accessible
3. Check browser console for errors
4. Try in incognito mode

### Emails Don't Send
1. Check Resend API key in Vercel
2. Verify email queue has pending emails
3. Check Vercel function logs
4. Verify cron job is running

### In-App Notifications Don't Show
1. Check notifications table has data
2. Verify migration ran successfully
3. Check browser console for API errors
4. Test notification matching logic

---

## 📞 SUPPORT CONTACTS

**Resend Support:** support@resend.com  
**Vercel Support:** vercel.com/support  
**Supabase Support:** supabase.com/support

---

## 📝 DEPLOYMENT NOTES

**Date:** _____________  
**Deployed By:** _____________  
**Version:** _____________

**Checklist:**
- [ ] All env vars added to Vercel
- [ ] Redeployed after adding env vars
- [ ] Database migrations run
- [ ] Push notifications tested
- [ ] Email sending tested
- [ ] In-app notifications tested
- [ ] Cron jobs verified
- [ ] No errors in logs
- [ ] Mobile tested
- [ ] Multiple browsers tested

**Issues Found:**
- 
- 

**Notes:**
- 
- 

---

**🎉 Ready for Production!**
