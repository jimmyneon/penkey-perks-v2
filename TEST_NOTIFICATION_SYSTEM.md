# 🧪 NOTIFICATION SYSTEM - TEST CHECKLIST

**Date:** October 10, 2025  
**Status:** Ready for Testing

---

## ✅ PRE-DEPLOYMENT VERIFICATION

### 1. SQL Migrations Check

**Files to verify exist:**
- [ ] `20251010_notifications_system.sql` - Base notification system
- [ ] `20251010_notification_analytics.sql` - Analytics tables
- [ ] `20251010_improve_notification_conditions.sql` - Condition matching
- [ ] `20251010_migrate_hardcoded_notifications.sql` - 23+ templates

**Verify migration order:**
```bash
cd supabase
ls -la migrations/ | grep notification
```

Expected output:
```
20251010_notifications_system.sql
20251010_notification_analytics.sql
20251010_improve_notification_conditions.sql
20251010_migrate_hardcoded_notifications.sql
```

---

### 2. API Routes Check

**Notification APIs:**
- [ ] `/app/api/notifications/get-for-user/route.ts`
- [ ] `/app/api/notifications/dismiss/route.ts`
- [ ] `/app/api/notifications/track-view/route.ts`
- [ ] `/app/api/notifications/track-action/route.ts`

**Admin APIs:**
- [ ] `/app/api/admin/notifications/create/route.ts`
- [ ] `/app/api/admin/notifications/update/route.ts`
- [ ] `/app/api/admin/notifications/delete/route.ts`
- [ ] `/app/api/admin/notifications/toggle/route.ts`

**Verify files exist:**
```bash
find app/api -name "route.ts" | grep notification
```

---

### 3. Component Check

**Admin Components:**
- [ ] `/app/admin/notifications/create/page.tsx`
- [ ] `/app/admin/notifications/edit/[id]/page.tsx`
- [ ] `/components/admin/notification-form.tsx`
- [ ] `/components/admin/conditions-builder.tsx`
- [ ] `/components/admin/notification-preview.tsx`

**User Components:**
- [ ] `/components/dashboard/notification-banner.tsx` (modified)

**Verify files exist:**
```bash
find app/admin/notifications -name "*.tsx"
find components/admin -name "*.tsx" | grep notification
```

---

## 🚀 DEPLOYMENT TEST

### Step 1: Run Migrations

```bash
cd supabase
supabase db push
```

**Expected Success Messages:**
```
✓ Applying migration 20251010_notifications_system.sql
✓ Applying migration 20251010_notification_analytics.sql
✓ Applying migration 20251010_improve_notification_conditions.sql
✓ Applying migration 20251010_migrate_hardcoded_notifications.sql
```

**Verify Tables Created:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%';
```

Expected tables:
- `notifications`
- `notification_dismissals`
- `notification_views`
- `notification_actions`

**Verify Notifications Loaded:**
```sql
SELECT COUNT(*) as total_notifications FROM notifications;
```
Expected: ~23-30 notifications

**Verify Functions Created:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';
```

Expected functions:
- `get_user_notifications`
- `match_notification_conditions`

---

### Step 2: Test Database Functions

**Test 1: Condition Matching (Boolean)**
```sql
SELECT match_notification_conditions(
  '{"hasCheckedInToday": false}'::jsonb,
  '{"hasCheckedInToday": false}'::jsonb
);
-- Expected: true
```

**Test 2: Condition Matching (Range - Min)**
```sql
SELECT match_notification_conditions(
  '{"currentStreak": {"min": 7}}'::jsonb,
  '{"currentStreak": 10}'::jsonb
);
-- Expected: true (10 >= 7)
```

**Test 3: Condition Matching (Range - Max)**
```sql
SELECT match_notification_conditions(
  '{"hoursUntilExpiry": {"min": 1, "max": 3}}'::jsonb,
  '{"hoursUntilExpiry": 2}'::jsonb
);
-- Expected: true (2 is between 1 and 3)
```

**Test 4: Condition Matching (Equals)**
```sql
SELECT match_notification_conditions(
  '{"stampsUntilReward": {"equals": 1}}'::jsonb,
  '{"stampsUntilReward": 1}'::jsonb
);
-- Expected: true
```

**Test 5: Get User Notifications**
```sql
-- Replace USER_ID with actual user ID
SELECT * FROM get_user_notifications(
  'USER_ID'::uuid,
  '{"hasUnredeemedRewards": true, "daysUntilExpiry": 2}'::jsonb
);
-- Expected: Should return a reward expiry notification
```

---

### Step 3: Test Admin Interface

**Start Server:**
```bash
npm run dev
```

**Navigate to Admin:**
1. Go to `http://localhost:3000/admin/notifications`
2. Should see list of notifications

**Test Create:**
1. Click "New Notification"
2. Fill form:
   - Type: `custom`
   - Priority: `10`
   - Title: `Test Notification`
   - Message: `This is a test message`
   - Icon: `🧪`
   - Variant: `default`
   - Dismissible: `Yes`
3. Add condition:
   - Field: `Has Checked In Today`
   - Operator: `Equals`
   - Value: `false`
4. Click "Preview" - should show preview modal
5. Click "Create Notification"
6. Should redirect to list with success toast

**Test Edit:**
1. Click "Edit" on test notification
2. Change title to `Updated Test`
3. Click "Update Notification"
4. Should see success toast
5. Verify change in list

**Test Toggle:**
1. Click eye icon on test notification
2. Should turn gray (deactivated)
3. Click again - should turn colored (activated)

**Test Delete:**
1. Click "Delete" on test notification
2. Confirm deletion
3. Should see success toast
4. Notification should disappear from list

---

### Step 4: Test User Experience

**Navigate to Dashboard:**
```
http://localhost:3000/dashboard
```

**Test 1: Reward Notification**
1. Ensure user has unredeemed reward
2. Should see reward notification at top
3. Verify correct message and styling

**Test 2: Dismiss Notification**
1. Click X button (if dismissible)
2. Notification should disappear
3. Refresh page - should stay dismissed

**Test 3: Condition Matching**
1. Create notification with condition: `hasCheckedInToday = false`
2. Before check-in: Should see notification
3. After check-in: Should NOT see notification

**Test 4: Priority Order**
1. Create multiple notifications with different priorities
2. Should see highest priority (lowest number) first

---

### Step 5: Test Analytics Tracking

**Test View Tracking:**
```sql
-- After viewing notification on dashboard
SELECT * FROM notification_views 
ORDER BY viewed_at DESC 
LIMIT 5;
```
Expected: Should see recent view record

**Test Action Tracking:**
```sql
-- After dismissing notification
SELECT * FROM notification_actions 
WHERE action_type = 'dismiss'
ORDER BY action_at DESC 
LIMIT 5;
```
Expected: Should see dismiss action

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: Migrations Fail

**Error:** `relation "notifications" already exists`

**Fix:**
```sql
-- Drop existing tables
DROP TABLE IF EXISTS notification_actions CASCADE;
DROP TABLE IF EXISTS notification_views CASCADE;
DROP TABLE IF EXISTS notification_dismissals CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Then re-run migrations
```

---

### Issue 2: No Notifications Showing

**Check 1: Are notifications active?**
```sql
SELECT id, title, active FROM notifications;
```

**Check 2: Do conditions match?**
```sql
-- Test with your user state
SELECT * FROM get_user_notifications(
  'YOUR_USER_ID'::uuid,
  '{"hasCheckedInToday": false, "hasUnredeemedRewards": true}'::jsonb
);
```

**Check 3: Is notification dismissed?**
```sql
SELECT * FROM notification_dismissals 
WHERE user_id = 'YOUR_USER_ID'::uuid;
```

---

### Issue 3: Admin Can't Create Notification

**Check 1: Is user admin?**
```sql
SELECT id, email, role FROM users WHERE id = 'YOUR_USER_ID'::uuid;
```
Role should be 'admin' or 'staff'

**Check 2: Check browser console**
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

---

### Issue 4: Condition Not Matching

**Debug:**
```sql
-- Test condition matching
SELECT 
  match_notification_conditions(
    '{"hasCheckedInToday": false}'::jsonb,
    '{"hasCheckedInToday": false}'::jsonb
  ) as should_be_true,
  match_notification_conditions(
    '{"hasCheckedInToday": false}'::jsonb,
    '{"hasCheckedInToday": true}'::jsonb
  ) as should_be_false;
```

**Common mistakes:**
- Field name typo (case-sensitive)
- Wrong operator (min vs max vs equals)
- Wrong data type (string vs number vs boolean)

---

## ✅ FINAL CHECKLIST

### Database
- [ ] All migrations ran successfully
- [ ] Tables created (4 tables)
- [ ] Functions created (2 functions)
- [ ] Notifications loaded (~23+)
- [ ] RLS policies active
- [ ] Indexes created

### APIs
- [ ] Get notifications works
- [ ] Dismiss works
- [ ] Track view works
- [ ] Track action works
- [ ] Create works (admin only)
- [ ] Update works (admin only)
- [ ] Delete works (admin only)

### Admin UI
- [ ] Can view notification list
- [ ] Can create notification
- [ ] Can edit notification
- [ ] Can delete notification
- [ ] Can toggle active/inactive
- [ ] Preview works
- [ ] Conditions builder works

### User Experience
- [ ] Notifications show on dashboard
- [ ] Correct notification shows (priority)
- [ ] Can dismiss notifications
- [ ] Dismissal persists
- [ ] Conditions match correctly
- [ ] Styling looks good

### Analytics
- [ ] Views tracked
- [ ] Actions tracked
- [ ] Data visible in database

---

## 🎯 PERFORMANCE TESTS

### Test 1: Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM get_user_notifications(
  'USER_ID'::uuid,
  '{"hasUnredeemedRewards": true}'::jsonb
);
```
Expected: < 50ms

### Test 2: Load Test
Create 100 notifications and verify:
- Admin list loads quickly (< 2s)
- User notification fetches quickly (< 100ms)

---

## 📊 SUCCESS CRITERIA

- ✅ All migrations run without errors
- ✅ All API routes return 200 status
- ✅ Admin can create/edit/delete notifications
- ✅ Users see correct notifications
- ✅ Conditions match accurately
- ✅ Analytics track properly
- ✅ No console errors
- ✅ Performance is acceptable

---

## 🚀 READY FOR PRODUCTION

Once all tests pass:
1. ✅ Run migrations on production database
2. ✅ Deploy code to production
3. ✅ Monitor for 24 hours
4. ✅ Train Amanda
5. ✅ Celebrate! 🎉

---

**Test Date:** _____________  
**Tested By:** _____________  
**Status:** ⬜ Pass ⬜ Fail  
**Notes:** _____________
