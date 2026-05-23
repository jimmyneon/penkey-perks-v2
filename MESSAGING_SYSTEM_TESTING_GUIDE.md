# 🧪 MESSAGING SYSTEM - COMPLETE TESTING GUIDE

**Purpose:** Verify all messaging features work correctly  
**Time Required:** 30-45 minutes  
**Status:** Ready to test

---

## 📋 PRE-TESTING CHECKLIST

### 1. Environment Setup ✅
- [ ] `web-push` package installed (`npm install web-push --legacy-peer-deps`)
- [ ] VAPID keys generated (`node scripts/generate-vapid-keys.js`)
- [ ] VAPID keys added to `.env.local`:
  ```env
  VAPID_PUBLIC_KEY=your_public_key
  VAPID_PRIVATE_KEY=your_private_key
  VAPID_SUBJECT=mailto:nfdrepairs@gmail.com
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
  ```
- [ ] Dev server restarted after adding keys

### 2. Database Migrations ✅
- [ ] Run `20251012_migrate_hardcoded_notifications.sql`
- [ ] Run `20251012_insert_email_templates.sql`
- [ ] Run `20251012_push_notifications.sql`
- [ ] Verify tables exist in Supabase:
  - `notifications` (should have 25+ rows)
  - `email_templates` (should have 7 rows)
  - `push_subscriptions` (empty initially)
  - `push_notifications_log` (empty initially)

### 3. Files Deployed ✅
- [ ] `public/sw.js` exists and accessible at `/sw.js`
- [ ] All new components created
- [ ] All API endpoints created
- [ ] Code changes deployed

---

## 🧪 TEST SUITE

### TEST 1: In-App Notifications (Database-Driven)

#### Test 1.1: Basic Notification Display
**Steps:**
1. Open your app at `/dashboard`
2. Open browser DevTools → Console
3. Look for notification matching logs

**Expected:**
- ✅ See console log: `🎯 Notification matching: { matched: X, userState: {...} }`
- ✅ Notification banner appears at top of dashboard
- ✅ Notification shows title and message
- ✅ No errors in console

**Pass/Fail:** ⬜

---

#### Test 1.2: Variable Substitution
**Steps:**
1. Create a test user with:
   - 7+ day streak
   - No check-in today
2. Open dashboard
3. Check notification message

**Expected:**
- ✅ Message shows "🔥 7 Day Streak at Risk!" (or actual number)
- ✅ `{{currentStreak}}` replaced with actual number
- ✅ No `{{variable}}` text visible

**Pass/Fail:** ⬜

---

#### Test 1.3: Time-Based Notifications
**Steps:**
1. Test at different times of day
2. User has NOT checked in today
3. Check notification message

**Expected:**
- ✅ Morning (5am-10am): "☀️ Good Morning!"
- ✅ Midday (10am-2pm): "☕ Lunchtime Visit?"
- ✅ Afternoon (2pm-5pm): "🌤️ Afternoon Pick-Me-Up?"
- ✅ Evening (5pm-9pm): "🌙 Evening Visit?"

**Pass/Fail:** ⬜

---

#### Test 1.4: Expiry Urgency Notifications
**Steps:**
1. Create test user with reward expiring in 2 hours
2. Open dashboard
3. Check notification

**Expected:**
- ✅ Shows "🚨 LAST CHANCE! Only 2 hour(s) left!"
- ✅ Red/urgent styling
- ✅ Not dismissible
- ✅ Highest priority

**Pass/Fail:** ⬜

---

### TEST 2: Email Templates (Database-Driven)

#### Test 2.1: Email Templates Exist
**Steps:**
1. Go to Supabase Dashboard
2. Table Editor → `email_templates`
3. Check rows

**Expected:**
- ✅ 7 templates exist:
  - welcome_email
  - reward_earned
  - reward_expiring
  - referral_confirmed
  - birthday_email
  - win_back_email
  - milestone_email

**Pass/Fail:** ⬜

---

#### Test 2.2: Email Template Admin UI
**Steps:**
1. Login as admin
2. Navigate to `/admin/email-templates`
3. Check UI

**Expected:**
- ✅ Page loads without errors
- ✅ Shows 7 templates
- ✅ Search works
- ✅ Category filter works
- ✅ Stats show correct counts
- ✅ Can click Edit/Preview/Delete

**Pass/Fail:** ⬜

---

#### Test 2.3: Email Queue (Optional)
**Steps:**
1. Trigger an email (e.g., new user signup)
2. Check `email_queue` table in Supabase
3. Run cron job or wait for processing

**Expected:**
- ✅ Email appears in queue
- ✅ Status = 'pending'
- ✅ Template variables substituted
- ✅ Email sends successfully

**Pass/Fail:** ⬜

---

### TEST 3: Push Notifications

#### Test 3.1: Service Worker Registration
**Steps:**
1. Open app in browser
2. Open DevTools → Application → Service Workers
3. Check registration

**Expected:**
- ✅ Service worker registered at `/sw.js`
- ✅ Status: Activated and running
- ✅ No errors in console

**Pass/Fail:** ⬜

---

#### Test 3.2: Push Notification Toggle (Onboarding)
**Steps:**
1. Create new account
2. Go through onboarding at `/onboarding`
3. Look for push notification toggle

**Expected:**
- ✅ Push notification toggle visible
- ✅ Shows bell icon and description
- ✅ Toggle works (can click)
- ✅ Browser asks for permission when enabled

**Pass/Fail:** ⬜

---

#### Test 3.3: Push Notification Toggle (Profile)
**Steps:**
1. Login as existing user
2. Go to `/profile`
3. Scroll to Privacy & Permissions section

**Expected:**
- ✅ Push notification toggle visible
- ✅ Shows current subscription status
- ✅ Can toggle on/off
- ✅ Shows toast notification on change

**Pass/Fail:** ⬜

---

#### Test 3.4: Push Subscription Flow
**Steps:**
1. Click push notification toggle ON
2. Allow notifications in browser popup
3. Wait for confirmation
4. Check database

**Expected:**
- ✅ Browser permission granted
- ✅ Toast: "🔔 Notifications Enabled!"
- ✅ Row appears in `push_subscriptions` table
- ✅ `active = true`
- ✅ `endpoint`, `p256dh`, `auth` populated

**Pass/Fail:** ⬜

---

#### Test 3.5: Send Test Push Notification
**Steps:**
1. As admin, call push send API:
```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test push notification!",
    "url": "/dashboard"
  }'
```
2. Check for notification

**Expected:**
- ✅ Push notification appears (even if app closed)
- ✅ Shows title and message
- ✅ Click opens app to `/dashboard`
- ✅ Row appears in `push_notifications_log` table
- ✅ Status = 'sent'

**Pass/Fail:** ⬜

---

#### Test 3.6: Push Unsubscribe
**Steps:**
1. Toggle push notifications OFF in profile
2. Confirm action
3. Check database

**Expected:**
- ✅ Toast: "Notifications Disabled"
- ✅ `push_subscriptions` row: `active = false`
- ✅ No more push notifications received

**Pass/Fail:** ⬜

---

### TEST 4: Staff Messaging

#### Test 4.1: Staff Message UI
**Steps:**
1. Login as staff/admin
2. Go to `/staff/messages`
3. Check UI

**Expected:**
- ✅ Page loads
- ✅ 6 message templates visible
- ✅ Can select template
- ✅ Can edit message
- ✅ Preview shows

**Pass/Fail:** ⬜

---

#### Test 4.2: Send Staff Message
**Steps:**
1. Select a template
2. Edit message (optional)
3. Click "Send to All Customers"
4. Check database

**Expected:**
- ✅ Toast: "Message Sent!"
- ✅ Row appears in `notifications` table
- ✅ Row appears in `staff_activity_log` table
- ✅ Message visible to customers on dashboard

**Pass/Fail:** ⬜

---

### TEST 5: Integration Tests

#### Test 5.1: Multi-Device Push
**Steps:**
1. Subscribe to push on Desktop
2. Subscribe to push on Mobile (same user)
3. Send push notification
4. Check both devices

**Expected:**
- ✅ 2 rows in `push_subscriptions` (same user)
- ✅ Push received on BOTH devices
- ✅ 2 rows in `push_notifications_log`

**Pass/Fail:** ⬜

---

#### Test 5.2: Notification Priority
**Steps:**
1. Create user with:
   - Reward expiring in 2 hours
   - High streak
   - No check-in
2. Open dashboard
3. Check which notification shows

**Expected:**
- ✅ Shows reward expiry (highest priority)
- ✅ Not streak or check-in reminder
- ✅ Priority system working

**Pass/Fail:** ⬜

---

#### Test 5.3: Notification Rotation
**Steps:**
1. Stay on dashboard for 30 seconds
2. Watch notification banner
3. Check if it changes

**Expected:**
- ✅ Notification rotates every 10 seconds
- ✅ Shows different notifications
- ✅ Smooth transition

**Pass/Fail:** ⬜

---

### TEST 6: Performance & Error Handling

#### Test 6.1: API Response Time
**Steps:**
1. Open DevTools → Network
2. Reload dashboard
3. Find `/api/notifications/get-for-user` request
4. Check timing

**Expected:**
- ✅ Response time < 200ms
- ✅ Status: 200 OK
- ✅ Returns JSON array

**Pass/Fail:** ⬜

---

#### Test 6.2: Error Handling (No Notifications)
**Steps:**
1. Create user with no matching notifications
2. Open dashboard
3. Check behavior

**Expected:**
- ✅ No notification banner shows (or default message)
- ✅ No errors in console
- ✅ App still works normally

**Pass/Fail:** ⬜

---

#### Test 6.3: Error Handling (Database Down)
**Steps:**
1. Temporarily break database connection
2. Open dashboard
3. Check behavior

**Expected:**
- ✅ Graceful error handling
- ✅ Error message shown (optional)
- ✅ App doesn't crash
- ✅ Console shows error (for debugging)

**Pass/Fail:** ⬜

---

### TEST 7: Browser Compatibility

#### Test 7.1: Chrome/Edge
**Steps:**
1. Test all features in Chrome
2. Test push notifications

**Expected:**
- ✅ All features work
- ✅ Push notifications work
- ✅ Service worker works

**Pass/Fail:** ⬜

---

#### Test 7.2: Firefox
**Steps:**
1. Test all features in Firefox
2. Test push notifications

**Expected:**
- ✅ All features work
- ✅ Push notifications work
- ✅ Service worker works

**Pass/Fail:** ⬜

---

#### Test 7.3: Safari (Desktop)
**Steps:**
1. Test all features in Safari
2. Test push notifications (macOS 16.4+)

**Expected:**
- ✅ All features work
- ✅ Push notifications work (if supported)
- ✅ Graceful fallback if not supported

**Pass/Fail:** ⬜

---

#### Test 7.4: Mobile (iOS/Android)
**Steps:**
1. Test on mobile device
2. Test push notifications

**Expected:**
- ✅ Responsive design works
- ✅ Push notifications work
- ✅ Toggles work on touch

**Pass/Fail:** ⬜

---

## 📊 TEST RESULTS SUMMARY

### Overall Results:
- **Total Tests:** 25
- **Passed:** ___ / 25
- **Failed:** ___ / 25
- **Skipped:** ___ / 25

### Critical Tests (Must Pass):
- [ ] In-app notifications display
- [ ] Variable substitution works
- [ ] Email templates in database
- [ ] Push subscription works
- [ ] Push sending works
- [ ] API response time < 200ms

### Pass Criteria:
- ✅ All critical tests pass
- ✅ At least 90% of total tests pass
- ✅ No critical errors in console
- ✅ Performance acceptable

---

## 🐛 ISSUES FOUND

### Issue #1:
- **Description:** 
- **Severity:** High/Medium/Low
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Fix:**

### Issue #2:
- **Description:** 
- **Severity:** High/Medium/Low
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Fix:**

---

## ✅ FINAL CHECKLIST

### Before Production:
- [ ] All critical tests pass
- [ ] All migrations run successfully
- [ ] VAPID keys in production environment
- [ ] Service worker accessible
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile tested
- [ ] Multiple browsers tested
- [ ] Documentation reviewed
- [ ] Team trained

### Production Deployment:
- [ ] Deploy code changes
- [ ] Run migrations
- [ ] Verify VAPID keys
- [ ] Test on production
- [ ] Monitor for 24 hours
- [ ] Gather user feedback

---

## 🚀 QUICK TEST SCRIPT

Run this to test basic functionality:

```bash
# 1. Check migrations
echo "Checking database tables..."
# Run in Supabase SQL Editor:
# SELECT COUNT(*) FROM notifications;
# SELECT COUNT(*) FROM email_templates;
# SELECT COUNT(*) FROM push_subscriptions;

# 2. Test API endpoints
echo "Testing notification API..."
curl http://localhost:3000/api/notifications/get-for-user \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id","userState":{}}'

# 3. Check service worker
echo "Check service worker at http://localhost:3000/sw.js"

# 4. Test push send (as admin)
echo "Testing push notification..."
curl http://localhost:3000/api/push/send \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test",
    "message":"Testing push notifications!",
    "url":"/dashboard"
  }'
```

---

## 📝 TESTING NOTES

**Date Tested:** _______________  
**Tested By:** _______________  
**Environment:** Development / Staging / Production  
**Browser:** _______________  
**Device:** _______________

**Additional Notes:**
- 
- 
- 

---

**Testing Complete! ✅**

**Overall Status:** ⬜ PASS / ⬜ FAIL / ⬜ NEEDS WORK
