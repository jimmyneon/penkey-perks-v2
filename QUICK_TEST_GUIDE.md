# 🚀 QUICK TEST GUIDE - Messaging System

**5-Minute Complete Test**

---

## ✅ PRE-FLIGHT CHECKLIST

Before testing, ensure:
- [ ] Dev server is running (`npm run dev`)
- [ ] VAPID keys in `.env.local` (check with `grep VAPID .env.local`)
- [ ] Database migrations run (3 SQL files in Supabase)
- [ ] You're logged in as admin

---

## 🧪 METHOD 1: Use Test Suite (RECOMMENDED)

### Step 1: Open Test Page
```
http://localhost:3000/admin/test-messaging
```

### Step 2: Click "Run All Tests"
This will automatically test:
- ✅ Database tables exist
- ✅ In-app notifications work
- ✅ Push subscriptions active

### Step 3: Send Test Push
1. Edit the push notification message (optional)
2. Click "Send Push"
3. Check your browser for notification

### Step 4: Send Test Email
1. Enter your email
2. Select template
3. Click "Send Email"
4. Check your inbox

**Done! All systems tested in 2 minutes! ✅**

---

## 🧪 METHOD 2: Manual Testing

### Test 1: In-App Notifications (30 seconds)
```bash
# 1. Open dashboard
http://localhost:3000/dashboard

# 2. Look for notification banner at top
# Should show a message like "☕ Lunchtime Visit?" or similar

# 3. Check browser console (F12)
# Should see: "🎯 Notification matching: { matched: X }"
```

**Expected:** Notification banner appears with dynamic message
**Pass/Fail:** ⬜

---

### Test 2: Push Notification Toggle (1 minute)
```bash
# 1. Go to profile
http://localhost:3000/profile

# 2. Scroll to "Privacy & Permissions"
# 3. Find "Push Notifications" toggle
# 4. Click to enable
# 5. Allow browser permission when prompted
```

**Expected:** 
- Browser asks for permission
- Toast: "🔔 Notifications Enabled!"
- Toggle stays checked

**Pass/Fail:** ⬜

---

### Test 3: Send Push Notification (1 minute)
```bash
# In terminal or Postman:
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .cookies)" \
  -d '{
    "title": "🎉 Test Push",
    "message": "Your messaging system works!",
    "url": "/dashboard"
  }'
```

**Expected:** 
- Push notification appears on your device
- Even if browser is minimized
- Click opens app to /dashboard

**Pass/Fail:** ⬜

---

### Test 4: Email Templates (1 minute)
```bash
# 1. Go to email templates admin
http://localhost:3000/admin/email-templates

# 2. Check templates exist
# Should see 7 templates

# 3. Click "Preview" on any template
# Should show email HTML
```

**Expected:** 7 templates visible, preview works
**Pass/Fail:** ⬜

---

### Test 5: Database Check (30 seconds)
```sql
-- In Supabase SQL Editor:

-- Check notifications
SELECT COUNT(*) as notification_count FROM notifications;
-- Expected: 25+

-- Check email templates
SELECT COUNT(*) as template_count FROM email_templates;
-- Expected: 7

-- Check push subscriptions
SELECT COUNT(*) as subscription_count FROM push_subscriptions WHERE active = true;
-- Expected: 1+ (if you enabled push)
```

**Pass/Fail:** ⬜

---

## 🔍 QUICK DIAGNOSTICS

### If Push Toggle Doesn't Work:

**Check 1: VAPID Keys**
```bash
grep "NEXT_PUBLIC_VAPID_PUBLIC_KEY" .env.local
# Should show a long key starting with "B"
```

**Check 2: Service Worker**
```bash
# Open in browser:
http://localhost:3000/sw.js
# Should show JavaScript code, not 404
```

**Check 3: Browser Console**
```javascript
// Paste in console:
console.log('VAPID:', !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
// Should show: VAPID: true
```

**Fix:** Restart dev server!
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

### If Push Doesn't Send:

**Check 1: Subscriptions Exist**
```sql
SELECT * FROM push_subscriptions WHERE active = true;
-- Should have at least 1 row
```

**Check 2: VAPID Private Key**
```bash
grep "VAPID_PRIVATE_KEY" .env.local
# Should show a long key
```

**Check 3: User is Admin**
```sql
SELECT role FROM users WHERE email = 'your@email.com';
-- Should return: admin
```

---

### If Emails Don't Queue:

**Check 1: Templates Exist**
```sql
SELECT name FROM email_templates WHERE active = true;
-- Should show 7 templates
```

**Check 2: Email Queue Table**
```sql
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;
-- Should show queued emails
```

---

## 📊 SUCCESS CRITERIA

**System is working if:**
- ✅ All 5 manual tests pass
- ✅ OR test suite shows all green checkmarks
- ✅ No errors in browser console
- ✅ Push notifications received
- ✅ Database has correct counts

---

## 🎯 COMMON ISSUES & INSTANT FIXES

| Issue | Instant Fix |
|-------|-------------|
| Toggle doesn't work | Restart dev server |
| "VAPID not configured" | Check `.env.local` has keys |
| Push doesn't send | Enable push in profile first |
| No notifications show | Check database migrations ran |
| Service worker 404 | Check `public/sw.js` exists |
| Permission denied | Reset browser permissions |

---

## 📱 MOBILE TESTING

### iOS (Safari 16.4+)
```bash
# 1. Open on iPhone
https://your-domain.com/profile

# 2. Enable push notifications
# 3. Add to Home Screen (for best experience)
# 4. Test push from admin panel
```

### Android (Chrome)
```bash
# 1. Open on Android
https://your-domain.com/profile

# 2. Enable push notifications
# 3. Test push from admin panel
# Should work immediately
```

---

## 🚀 PRODUCTION CHECKLIST

Before deploying:
- [ ] All tests pass in development
- [ ] VAPID keys added to production environment
- [ ] Database migrations run on production
- [ ] Service worker accessible at `/sw.js`
- [ ] Email templates in production database
- [ ] Test on real mobile devices
- [ ] Test in multiple browsers
- [ ] Monitor for 24 hours after launch

---

## 📞 SUPPORT

**If stuck:**
1. Check browser console for errors
2. Run test suite at `/admin/test-messaging`
3. Check `PUSH_NOTIFICATIONS_TROUBLESHOOTING.md`
4. Verify all migrations ran
5. Restart dev server

**Most issues fixed by:** Restarting dev server! 🔄

---

**Happy Testing! 🎉**
