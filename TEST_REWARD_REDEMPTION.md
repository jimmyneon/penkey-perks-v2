# 🧪 Test Plan: Staff Scanner Reward Redemption

## Quick Test Guide

### Prerequisites
1. Staff account logged in
2. Customer with active reward in database
3. Access to `/staff/scan` page

---

## Test 1: Verify Reward by QR Code

### Setup:
```sql
-- Find an active reward QR code
SELECT 
  ur.qr_code,
  ur.status,
  ur.expires_at,
  r.name as reward_name,
  u.name as customer_name,
  u.email
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE ur.status = 'active'
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
LIMIT 5;
```

### Test Steps:
1. Copy a `qr_code` value (e.g., `REWARD-abc123`)
2. Navigate to `/staff/scan`
3. Paste QR code in input field
4. Click "Scan"

### Expected Result:
- ✅ Confirmation dialog appears
- ✅ Shows customer name and email
- ✅ Shows reward name
- ✅ "Click OK to confirm redemption" message

---

## Test 2: Successful Redemption

### Test Steps:
1. Follow Test 1 steps
2. Click "OK" in confirmation dialog

### Expected Result:
- ✅ Success toast: "🎉 Reward Redeemed!"
- ✅ Message includes reward name and customer name
- ✅ QR code input clears
- ✅ Database updated (see verification below)

### Verify in Database:
```sql
-- Check reward was redeemed
SELECT 
  qr_code,
  status,
  redeemed_at,
  created_at
FROM user_rewards
WHERE qr_code = 'REWARD-abc123'; -- Use your QR code

-- Should show:
-- status = 'redeemed'
-- redeemed_at = recent timestamp
```

### Verify Transaction Log:
```sql
-- Check transaction was logged
SELECT 
  action,
  details,
  staff_id,
  created_at
FROM transactions
WHERE action = 'reward_redeemed'
ORDER BY created_at DESC
LIMIT 5;

-- Should show recent redemption with:
-- action = 'reward_redeemed'
-- details contains reward_id, user_reward_id, reward_name
-- staff_id = your staff user ID
```

---

## Test 3: Already Redeemed Reward

### Setup:
Use the same QR code from Test 2 (now redeemed)

### Test Steps:
1. Paste same QR code again
2. Click "Scan"

### Expected Result:
- ❌ Error toast: "Invalid Reward"
- ❌ Message: "This reward has already been redeemed"
- ❌ No confirmation dialog
- ❌ No database changes

---

## Test 4: Expired Reward

### Setup:
```sql
-- Create an expired reward for testing
UPDATE user_rewards
SET expires_at = NOW() - INTERVAL '1 day'
WHERE id = 'some-reward-id'
  AND status = 'active';
```

### Test Steps:
1. Scan the expired reward QR code

### Expected Result:
- ❌ Error toast: "Invalid Reward"
- ❌ Message: "This reward has expired"
- ❌ Status updated to 'expired' in database

---

## Test 5: Invalid QR Code

### Test Steps:
1. Enter invalid QR code: `REWARD-invalid123`
2. Click "Scan"

### Expected Result:
- ❌ Error toast: "Invalid Reward"
- ❌ Message: "Reward not found or invalid"

---

## Test 6: Cancel Redemption

### Test Steps:
1. Scan valid active reward
2. Confirmation dialog appears
3. Click "Cancel"

### Expected Result:
- ✅ Toast: "Cancelled - Reward redemption cancelled"
- ✅ No database changes
- ✅ Reward remains active

---

## Test 7: Customer Profile Still Works

### Test Steps:
1. Enter customer profile QR: `PROFILE-{userId}`
2. Click "Scan"

### Expected Result:
- ✅ Customer info loads
- ✅ Shows beans, stamps, lifetime points
- ✅ Quick action buttons appear
- ✅ Can perform check-in, add stamp, etc.

---

## Test 8: Camera Scanner

### Test Steps:
1. Click "Open Camera Scanner"
2. Point at reward QR code (printed or on screen)

### Expected Result:
- ✅ Camera opens
- ✅ Auto-detects QR code
- ✅ Processes reward redemption
- ✅ Shows confirmation dialog

---

## Test 9: Notification Sent

### Setup:
Ensure customer has push subscription or email

### Test Steps:
1. Redeem a reward successfully
2. Check customer's notifications

### Expected Result:
- ✅ Push notification sent (if subscribed)
- ✅ Email sent (if email exists)
- ✅ Title: "Reward Redeemed! 🎉"
- ✅ Message: "Your [Reward Name] has been redeemed. Enjoy!"

### Verify:
```sql
-- Check email queue
SELECT *
FROM email_queue
WHERE user_id = 'customer-id'
ORDER BY created_at DESC
LIMIT 5;

-- Check push notifications (if tracked)
```

---

## Test 10: Mixed QR Code Scanning

### Test Steps:
1. Scan customer profile: `PROFILE-xxx`
2. Verify customer loads
3. Click "Reset"
4. Scan reward: `REWARD-xxx`
5. Verify redemption flow
6. Scan another profile
7. Perform check-in

### Expected Result:
- ✅ All QR types work correctly
- ✅ System detects type automatically
- ✅ Appropriate flow for each type
- ✅ No conflicts or errors

---

## 🐛 Common Issues & Solutions

### Issue: "Reward not found"
**Cause:** QR code doesn't exist in database
**Solution:** Verify QR code is correct and reward exists

### Issue: "Forbidden - Staff access required"
**Cause:** Not logged in as staff/admin
**Solution:** Log in with staff account

### Issue: Camera won't open
**Cause:** Browser permissions denied
**Solution:** Allow camera access in browser settings

### Issue: Notification not sent
**Cause:** Customer has no email or push subscription
**Solution:** This is expected - notification fails silently

---

## 📊 Performance Checks

### Response Times:
- Verify reward: < 500ms
- Redeem reward: < 1000ms
- Send notification: Async (doesn't block)

### Database Queries:
- Verify: 1 SELECT query
- Redeem: 1 UPDATE + 1 INSERT
- Total: 3 queries per redemption

---

## ✅ Success Criteria

All tests should pass with:
- ✅ Correct error messages
- ✅ Proper database updates
- ✅ Transaction logging
- ✅ Customer notifications
- ✅ Staff feedback (toasts)
- ✅ No console errors
- ✅ Smooth UX flow

---

## 🎯 Quick Verification Commands

### Check Active Rewards:
```sql
SELECT COUNT(*) as active_rewards
FROM user_rewards
WHERE status = 'active';
```

### Check Recent Redemptions:
```sql
SELECT 
  ur.qr_code,
  ur.redeemed_at,
  r.name as reward,
  u.name as customer
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE ur.status = 'redeemed'
  AND ur.redeemed_at > NOW() - INTERVAL '1 hour'
ORDER BY ur.redeemed_at DESC;
```

### Check Transaction Log:
```sql
SELECT 
  action,
  details->>'reward_name' as reward,
  created_at
FROM transactions
WHERE action = 'reward_redeemed'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🚀 Ready to Test!

Follow the tests in order for comprehensive coverage. Report any failures with:
- Test number
- Expected vs actual result
- Console errors (if any)
- Screenshots (if helpful)
