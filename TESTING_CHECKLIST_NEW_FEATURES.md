# 🧪 Testing Checklist - New Features

## ✅ Pre-Testing Setup

### Database Migrations:
- [ ] Run `20251010_add_user_roles.sql` first
- [ ] Run `20251010_notifications_system.sql` second
- [ ] Verify no errors in Supabase logs

### GPS Coordinates:
- [ ] Update `lib/location-utils.ts` with actual Penkey coordinates
- [ ] Verify coordinates on Google Maps

---

## 1️⃣ Amanda-Style Messages

### Dashboard Messages:
- [ ] Refresh dashboard multiple times
- [ ] Check coffee card message changes
- [ ] Check points card message
- [ ] Check game card message
- [ ] Verify emojis display correctly
- [ ] Messages feel bubbly and friendly

### Profile Card Welcome Messages:
- [ ] Check welcome message on first visit
- [ ] Return within 6 hours - should say "Nice to see you again today!"
- [ ] Return after 3+ days - should say "We miss you!"
- [ ] Verify message changes based on time

### Time-Based Messages:
- [ ] Test in morning (< 10am) - should see morning messages
- [ ] Test at lunch (10am-2pm) - should see lunch messages  
- [ ] Test afternoon (2pm-5pm) - should see afternoon messages
- [ ] Test evening (> 5pm) - should see evening messages

---

## 2️⃣ Smart Notification Banner

### Display Logic:
- [ ] Banner shows at top of dashboard
- [ ] Only ONE notification shows at a time
- [ ] Highest priority notification displays first

### Dismissible Notifications:
- [ ] X button appears on dismissible notifications
- [ ] Click X - notification disappears
- [ ] Refresh page - notification stays hidden
- [ ] Wait 24 hours - notification reappears (or test by clearing localStorage)

### Non-Dismissible Notifications:
- [ ] Rewards ready - NO X button
- [ ] Streak at risk - NO X button
- [ ] 1 stamp away - NO X button, bouncing icon

### Priority Order:
- [ ] Rewards ready (Priority 1)
- [ ] Streak at risk (Priority 2)
- [ ] 1 stamp away (Priority 3)
- [ ] Check-in reminder (Priority 4)
- [ ] Coffee stamp (Priority 5)
- [ ] Game reminder (Priority 6)
- [ ] All done (Priority 7)

### Message Variations:
- [ ] Different messages show on different days
- [ ] Time-appropriate messages (morning/afternoon/evening)
- [ ] Urgency increases as day progresses

---

## 3️⃣ Profile & Settings Page

### Access:
- [ ] Click profile icon in dashboard header
- [ ] Page loads at `/profile`
- [ ] All sections visible

### Personal Information:
- [ ] Name field pre-filled
- [ ] Email field shown (read-only)
- [ ] Phone field editable
- [ ] Date of birth field editable
- [ ] Birthday message shows: "💕 Omg we'll send you a special birthday surprise!"
- [ ] Click "Save Changes" - success toast appears
- [ ] Refresh - changes persist

### Privacy & Permissions:
- [ ] GPS consent checkbox works
- [ ] Marketing consent checkbox works
- [ ] Explanations are clear and friendly
- [ ] Click "Update Preferences" - saves successfully

### Security:
- [ ] Click "Change Password"
- [ ] Dialog opens
- [ ] Enter new password (< 6 chars) - shows error
- [ ] Enter mismatched passwords - shows error
- [ ] Enter valid matching passwords - success!
- [ ] Can log in with new password

### Pause Account:
- [ ] Click "Pause Account"
- [ ] Dialog explains what happens
- [ ] Shows: "All your data stays safe"
- [ ] Click "Pause Account" - confirms
- [ ] User signed out
- [ ] Can log back in to reactivate

### Delete Account:
- [ ] Click "Delete Account Permanently"
- [ ] Warning dialog appears
- [ ] Type "DELETE" incorrectly - button disabled
- [ ] Type "DELETE" correctly - button enabled
- [ ] Click "Delete Forever"
- [ ] Account and all data deleted
- [ ] Cannot log back in

---

## 4️⃣ Rewards Redemption System

### Rewards Catalog:
- [ ] Go to `/rewards/catalog`
- [ ] See all available rewards
- [ ] Current points shown in header
- [ ] Rewards show points cost

### Affordability:
- [ ] Rewards you can afford are clickable (green)
- [ ] Rewards you can't afford are grayed out
- [ ] Shows "Need X more points"

### Redemption Flow:
- [ ] Click affordable reward
- [ ] Confirmation dialog opens
- [ ] Shows points cost
- [ ] Shows remaining points after
- [ ] Click "Yes, Redeem!"
- [ ] Points deducted
- [ ] Success toast: "🎉 Yaaas! Reward Redeemed!"
- [ ] Reward appears in "My Rewards"

### My Rewards:
- [ ] Click "My Rewards" button
- [ ] Goes to `/rewards`
- [ ] Redeemed reward shows with QR code
- [ ] Click reward - QR code modal opens
- [ ] QR code displays correctly

### Edge Cases:
- [ ] Try to redeem without enough points - error
- [ ] Try to redeem out-of-stock item - error
- [ ] Points refunded if redemption fails

---

## 5️⃣ GPS & Location Features

### GPS Testing Page:
- [ ] Go to `/test-gps`
- [ ] Click "Test GPS Location"
- [ ] Browser asks for location permission
- [ ] Allow permission
- [ ] Shows: "✅ GPS Working!"
- [ ] Shows your coordinates
- [ ] Shows distance to Penkey
- [ ] Shows if within range (100m)

### At Penkey Location:
- [ ] Distance shows < 100m
- [ ] Shows: "✅ Yes (within 100m)"
- [ ] Message: "🎉 You're at Penkey!"

### Away from Penkey:
- [ ] Distance shows actual meters
- [ ] Shows: "❌ No (too far)"
- [ ] Message: "📍 You're Xm away..."

### QR Scanner Button:
- [ ] At Penkey - QR button appears in header (pulsing)
- [ ] Away from Penkey - QR button hidden
- [ ] Click QR button - scanner opens
- [ ] Camera starts
- [ ] Close button works

### Location-Based Messages:
- [ ] Far away - regular messages
- [ ] Nearby (< 100m) - "OMG YOU'RE SO CLOSE!"
- [ ] At Penkey - "YAAAS YOU'RE HERE!"

---

## 6️⃣ Business Hours Enforcement

### Check-In API:
- [ ] During business hours - works
- [ ] Outside business hours - error message
- [ ] Error shows opening times

### Coffee Stamp API:
- [ ] During business hours - works
- [ ] Outside business hours - error message
- [ ] Error shows opening times

### Business Hours Config:
- [ ] Check `lib/business-hours.ts`
- [ ] Verify hours are correct for each day
- [ ] Test on different days of week

---

## 7️⃣ Enhanced Onboarding

### GPS Consent:
- [ ] Checkbox appears
- [ ] Label: "Enable Location Services"
- [ ] Explanation is clear and friendly
- [ ] Can check/uncheck
- [ ] Saves to database

### Marketing Consent:
- [ ] Checkbox appears
- [ ] Label: "Special Offers & Updates"
- [ ] Explanation: "We promise not to spam you! 💕"
- [ ] Can check/uncheck
- [ ] Saves to database

### Birthday Field:
- [ ] Date picker works
- [ ] Shows: "💕 Omg we'll send you a special birthday surprise!"
- [ ] Saves to database

### Welcome Toast:
- [ ] After completing onboarding
- [ ] Shows: "🎉 Yaaas! Welcome to Penkey Perks!"
- [ ] Message: "Your profile is all set up! Let's go! 💕"

---

## 8️⃣ Admin - Notification Management

### Access:
- [ ] Log in as admin
- [ ] See "Notifications" in nav menu
- [ ] Click - goes to `/admin/notifications`

### Dashboard Stats:
- [ ] Shows total notifications
- [ ] Shows active count
- [ ] Shows inactive count
- [ ] Shows critical count

### Notification List:
- [ ] All notifications display
- [ ] Shows type badge (reward, streak, etc.)
- [ ] Shows priority badge (1-10)
- [ ] Shows variant badge (default, success, etc.)
- [ ] Shows critical badge if not dismissible
- [ ] Shows inactive badge if not active

### Toggle Active/Inactive:
- [ ] Click eye icon on active notification
- [ ] Notification becomes inactive
- [ ] Grays out
- [ ] Click eye-off icon
- [ ] Notification becomes active again
- [ ] Success toast appears

### Notification Display:
- [ ] Deactivate a notification in admin
- [ ] Go to customer dashboard
- [ ] That notification doesn't show
- [ ] Reactivate in admin
- [ ] Refresh dashboard
- [ ] Notification now shows

---

## 9️⃣ Coffee Stamps & Check-ins

### Separation:
- [ ] Check-in and coffee stamps are separate
- [ ] Can check in without coffee stamp
- [ ] Can get coffee stamp without check-in (if already checked in)

### Rate Limiting:
- [ ] Check-in: 1 per day
- [ ] Try to check in twice - error
- [ ] Coffee stamp: 1 per hour
- [ ] Try to stamp twice in hour - error

### Unique Messages:
- [ ] 0 stamps: "Start your coffee stamp journey!"
- [ ] 1 stamp: "Omg you got your first stamp!"
- [ ] 5 stamps: "Halfway there!!"
- [ ] 8 stamps: "Yaaas! Only 3 more!"
- [ ] 9 stamps: "OMG only 2 more stamps!!"
- [ ] 10 stamps (1 away): "Eeeek! Just ONE more!" (bouncing icon)
- [ ] 10+ stamps: "Omg you have a FREE COFFEE waiting!!"

---

## 🔟 Integration Tests

### Full User Journey:
- [ ] Sign up new account
- [ ] Complete onboarding with consents
- [ ] See welcome message on dashboard
- [ ] See notification banner
- [ ] Dismiss notification
- [ ] Check in (during business hours)
- [ ] Get coffee stamp
- [ ] Play a game
- [ ] Earn points
- [ ] Browse rewards catalog
- [ ] Redeem a reward
- [ ] View reward in "My Rewards"
- [ ] Update profile
- [ ] Change password
- [ ] Test GPS features

### Admin Journey:
- [ ] Log in as admin
- [ ] View notification management
- [ ] Toggle notifications
- [ ] View customer list
- [ ] Manage rewards
- [ ] View logs
- [ ] Everything works

---

## 🐛 Known Issues to Check

### Potential Issues:
- [ ] Notification banner doesn't show - check migrations ran
- [ ] QR button always shows - check GPS coordinates set
- [ ] Profile page errors - check role column exists
- [ ] Rewards redemption fails - check points_transactions table
- [ ] Messages don't rotate - check date/time logic
- [ ] GPS always says "too far" - check coordinates are correct

---

## ✅ Success Criteria

### All Features Work:
- [ ] Amanda messages display correctly
- [ ] Notifications show and dismiss properly
- [ ] Profile page fully functional
- [ ] Rewards redemption works end-to-end
- [ ] GPS features work at location
- [ ] Business hours enforced
- [ ] Admin panel accessible
- [ ] No console errors
- [ ] No database errors
- [ ] Mobile responsive

### User Experience:
- [ ] Messages feel friendly and engaging
- [ ] UI is intuitive
- [ ] Loading states work
- [ ] Error messages are helpful
- [ ] Success feedback is clear
- [ ] Everything feels polished

---

## 📊 Test Results

**Date Tested:** _______________  
**Tested By:** _______________  
**Pass Rate:** _____/100  
**Critical Issues:** _______________  
**Minor Issues:** _______________  
**Status:** ⬜ Pass ⬜ Fail ⬜ Needs Work

---

**Complete this checklist before launching to production!** ✅
