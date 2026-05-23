# ✅ WEEK 1 DAY 5: TESTING & VALIDATION CHECKLIST

**Date:** October 11, 2025  
**Status:** Ready for Testing

---

## 🎯 WHAT WE'VE BUILT

### ✅ Completed:
- **25 database-driven notifications** (no hardcoded messages)
- **7 email templates** in database (ready to use)
- **Advanced condition matcher** with operators
- **Variable substitution** ({{currentStreak}}, etc.)
- **Enhanced API endpoint** with client-side filtering

### 📁 Files Created:
1. `supabase/migrations/20251012_migrate_hardcoded_notifications.sql`
2. `supabase/migrations/20251012_insert_email_templates.sql`
3. `lib/notification-matcher.ts`

### 📝 Files Modified:
1. `app/api/notifications/get-for-user/route.ts`
2. `components/dashboard/notification-banner.tsx`
3. `app/staff/dashboard/staff-dashboard-client.tsx`

---

## 📋 TESTING CHECKLIST

### 1. Database Migrations ✅

- [ ] Run notification migration
  ```bash
  # Copy and run in Supabase SQL Editor
  supabase/migrations/20251012_migrate_hardcoded_notifications.sql
  ```
  **Expected:** "✅ Created 25 notifications successfully!"

- [ ] Run email template migration
  ```bash
  # Copy and run in Supabase SQL Editor
  supabase/migrations/20251012_insert_email_templates.sql
  ```
  **Expected:** "✅ Created 7 email templates successfully!"

- [ ] Verify in Supabase Dashboard
  - Go to Table Editor → `notifications` → Should see 25+ rows
  - Go to Table Editor → `email_templates` → Should see 7 rows

---

### 2. Notification System Testing 🔔

#### Test Scenario 1: User with Expiring Reward (< 3 hours)
- [ ] Create test user with reward expiring in 2 hours
- [ ] Open dashboard
- [ ] **Expected:** See "🚨 LAST CHANCE! Only 2 hour(s) left!"
- [ ] **Verify:** Variable {{hoursUntilExpiry}} replaced with "2"

#### Test Scenario 2: User with High Streak (No Check-in)
- [ ] Create test user with 7+ day streak
- [ ] User has NOT checked in today
- [ ] Open dashboard
- [ ] **Expected:** See "🔥 7 Day Streak at Risk!"
- [ ] **Verify:** Variable {{currentStreak}} replaced with actual number

#### Test Scenario 3: User Needs One More Stamp
- [ ] Create test user with 9 stamps (1 away from reward)
- [ ] User has checked in today
- [ ] User has NOT added coffee stamp today
- [ ] Open dashboard
- [ ] **Expected:** See "🎊 ONE MORE STAMP!!!"

#### Test Scenario 4: Morning vs Afternoon Messages
- [ ] User has NOT checked in today
- [ ] Test at 9am: **Expected:** "☀️ Good Morning!"
- [ ] Test at 2pm: **Expected:** "🌤️ Afternoon Pick-Me-Up?"
- [ ] **Verify:** timeOfDay condition working

#### Test Scenario 5: All Complete
- [ ] User has checked in today
- [ ] User has coffee stamp today
- [ ] User has played game today
- [ ] Open dashboard
- [ ] **Expected:** See "🌟 You're Amazing! All done for today!"

---

### 3. Variable Substitution Testing 🔤

Check browser console for these logs:
```
🎯 Notification matching: {
  matched: X,
  userState: {
    currentStreak: 7,
    hoursUntilExpiry: 2,
    timeOfDay: "morning",
    ...
  }
}
```

- [ ] {{currentStreak}} shows actual number
- [ ] {{hoursUntilExpiry}} shows actual hours
- [ ] {{daysUntilExpiry}} shows actual days
- [ ] {{stampsUntilReward}} shows stamps needed
- [ ] No "{{variable}}" text visible (all replaced)

---

### 4. API Endpoint Testing 🔌

#### Check Network Tab:
- [ ] Open browser DevTools → Network
- [ ] Load dashboard
- [ ] Find request to `/api/notifications/get-for-user`
- [ ] **Expected Response:**
  ```json
  [
    {
      "id": "...",
      "title": "🚨 LAST CHANCE!",
      "message": "Only {{hoursUntilExpiry}} hour(s) left!",
      "conditions": {...},
      "variant": "streak",
      ...
    }
  ]
  ```

#### Check Console Logs:
- [ ] See "🎯 Notification matching:" log
- [ ] See matched notification count
- [ ] See user state details
- [ ] No errors in console

---

### 5. Email Template Testing 📧

#### Verify Templates Exist:
- [ ] Go to Supabase Dashboard
- [ ] Table Editor → `email_templates`
- [ ] **Expected:** 7 rows
  - welcome_email
  - reward_earned
  - reward_expiring
  - referral_confirmed
  - birthday_email
  - win_back_email
  - milestone_email

#### Test Email Queue (if applicable):
- [ ] Check `email_queue` table
- [ ] Verify templates can be queued
- [ ] Test variable substitution in emails

---

### 6. Performance Testing ⚡

- [ ] Dashboard loads in < 2 seconds
- [ ] API response time < 200ms
- [ ] No lag when switching notifications
- [ ] Smooth rotation between notifications (10 seconds)

---

### 7. Error Handling Testing 🐛

#### Test Error Scenarios:
- [ ] Database connection fails → No crash, graceful fallback
- [ ] Invalid user state → API handles gracefully
- [ ] Missing variables → Shows empty string (not {{variable}})
- [ ] No matching notifications → Shows nothing (not error)

---

### 8. Mobile Testing 📱

- [ ] Open on mobile device
- [ ] Notifications display correctly
- [ ] Variable substitution works
- [ ] Dismiss button works
- [ ] Rotation works smoothly

---

### 9. Browser Compatibility Testing 🌐

- [ ] Chrome/Edge - Works ✅
- [ ] Firefox - Works ✅
- [ ] Safari - Works ✅
- [ ] Mobile Safari - Works ✅
- [ ] Mobile Chrome - Works ✅

---

### 10. Regression Testing 🔄

Ensure nothing broke:
- [ ] Check-in still works
- [ ] Coffee stamps still work
- [ ] Games still work
- [ ] Rewards still work
- [ ] Staff messaging still works
- [ ] Admin UI still works

---

## 🐛 BUG TRACKING

### Issues Found:

**Issue #1:**
- Description: 
- Severity: High/Medium/Low
- Status: Open/Fixed
- Fix: 

**Issue #2:**
- Description: 
- Severity: High/Medium/Low
- Status: Open/Fixed
- Fix: 

---

## ✅ ACCEPTANCE CRITERIA

### Must Pass (Required):
- [ ] All 25 notifications accessible from database
- [ ] Variable substitution works for all variables
- [ ] No hardcoded messages showing
- [ ] API response time < 200ms
- [ ] No console errors
- [ ] Mobile works correctly
- [ ] All 7 email templates in database

### Should Pass (Important):
- [ ] Notification rotation works smoothly
- [ ] Time-based messages show correctly
- [ ] Expiry urgency levels work
- [ ] Streak badges display
- [ ] Analytics tracking works

### Nice to Have:
- [ ] Performance optimizations applied
- [ ] Caching working correctly
- [ ] Error monitoring in place

---

## 📊 TEST RESULTS SUMMARY

**Date Tested:** _______________  
**Tested By:** _______________

**Results:**
- Total Tests: 50+
- Passed: ___ / ___
- Failed: ___ / ___
- Blocked: ___ / ___

**Overall Status:** ⬜ PASS / ⬜ FAIL / ⬜ NEEDS WORK

---

## 🚀 NEXT STEPS

### If All Tests Pass ✅:
1. Mark Week 1 as COMPLETE
2. Deploy to production
3. Monitor for 24 hours
4. Move to Week 2: Admin UI & Push Notifications

### If Tests Fail ❌:
1. Document all issues
2. Fix critical bugs
3. Re-test
4. Repeat until all pass

---

## 📝 NOTES

**Additional Observations:**
- 
- 
- 

**Performance Notes:**
- 
- 
- 

**User Feedback:**
- 
- 
- 

---

**Testing Complete! Ready for Week 2! 🎉**
