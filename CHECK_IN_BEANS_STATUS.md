# ✅ Check-In Beans Transfer - Status Report

**Date:** October 11, 2025  
**Question:** When I check-in, do the Penkey beans transfer?

---

## 🎯 Answer: YES, BUT NEEDS UPDATE!

The pending rewards system **IS READY** and **WILL TRANSFER** beans on check-in, but the check-in amount needs to be updated from 5 points to 50 beans.

---

## ✅ What Works (Already Implemented)

### 1. **Pending Rewards System** ✅
**File:** `supabase/migrations/20251011_pending_rewards_system.sql`

**Function:** `claim_pending_rewards()`
- ✅ Claims all pending rewards when user checks in
- ✅ Transfers points/beans to user balance
- ✅ Transfers coffee stamps
- ✅ Activates vouchers
- ✅ Adds game play credits
- ✅ Sends celebration email
- ✅ Updates user's pending count

### 2. **Check-In API** ✅
**File:** `app/api/check-in/route.ts`

**Line 128-133:**
```typescript
// Claim pending rewards
const { data: claimResult } = await supabase
  .rpc('claim_pending_rewards', {
    p_user_id: userToCheckIn,
    p_latitude: latitude,
    p_longitude: longitude
  })
```

**What happens on check-in:**
1. ✅ Validates 24-hour cooldown
2. ✅ Updates check-in streak
3. ✅ Awards check-in points (NEEDS UPDATE - see below)
4. ✅ **Claims all pending rewards** ← THIS TRANSFERS BEANS!
5. ✅ Checks combo progress
6. ✅ Checks lucky time
7. ✅ Opens surprise box (5% chance)
8. ✅ Logs transaction
9. ✅ Invalidates caches

---

## ⚠️ What Needs Updating

### Issue: Check-In Awards 5 Points Instead of 50 Beans

**File:** `app/api/check-in/route.ts`  
**Lines 101-105:**

```typescript
// CURRENT (WRONG)
const basePoints = 5  // ❌ Old system
const bonusPoints = Math.floor(basePoints * (streakMultiplier - 1))
const totalPoints = basePoints + bonusPoints
```

**Should be:**
```typescript
// NEW (CORRECT)
const basePoints = 50  // ✅ New beans system
const bonusPoints = Math.floor(basePoints * (streakMultiplier - 1))
const totalPoints = basePoints + bonusPoints
```

---

## 🔄 How Pending Rewards Transfer Works

### Flow Diagram

```
User earns beans → Stored as pending_rewards
                    ↓
User checks in → claim_pending_rewards() called
                    ↓
Pending rewards processed:
  - Points → Added to balance via add_points()
  - Stamps → Inserted into coffee_stamps
  - Vouchers → Activated in user_rewards
  - Game plays → Credits added
                    ↓
Pending rewards marked as 'claimed'
                    ↓
User's balance updated ✅
```

### Example

**Before Check-In:**
```
User balance: 100 beans
Pending rewards:
  - 250 beans (signup bonus)
  - 50 beans (game win)
  - 1 coffee stamp
Total pending: 300 beans + 1 stamp
```

**User Checks In:**
```
1. Check-in awards: 50 beans (base)
2. Pending claimed: 300 beans + 1 stamp
3. New balance: 100 + 50 + 300 = 450 beans
4. Coffee stamps: +1
```

**After Check-In:**
```
User balance: 450 beans ✅
Coffee stamps: +1 ✅
Pending rewards: 0 (all claimed) ✅
```

---

## 📊 What Gets Transferred

### Reward Types Supported

| Type | What Happens | Example |
|------|--------------|---------|
| **points** | Added to balance | 250 beans → balance |
| **stamps** | Added to coffee card | 1 stamp → coffee_stamps |
| **voucher** | Activated for use | Free coffee → active |
| **game_play** | Game credits added | 1 play → metadata |

---

## 🧪 Testing the Transfer

### Test Scenario

1. **Create pending reward:**
```sql
INSERT INTO pending_rewards (user_id, reward_type, amount, reward_name, source)
VALUES ('USER_ID', 'points', 250, 'Test Beans', 'test');
```

2. **Check pending:**
```sql
SELECT * FROM pending_rewards WHERE user_id = 'USER_ID' AND status = 'pending';
-- Should show 250 beans pending
```

3. **Check in:**
```bash
POST /api/check-in
```

4. **Verify transfer:**
```sql
-- Check balance increased
SELECT points FROM users WHERE id = 'USER_ID';

-- Check pending claimed
SELECT * FROM pending_rewards WHERE user_id = 'USER_ID' AND status = 'claimed';
```

---

## 🔧 Required Fix

### Update Check-In Base Points

**File to modify:** `app/api/check-in/route.ts`

**Change line 103:**
```typescript
// FROM:
const basePoints = 5

// TO:
const basePoints = 50
```

**Also update description (line 113):**
```typescript
// FROM:
p_description: bonusPoints > 0 
  ? `Daily check-in (+${bonusPoints} streak bonus)`
  : 'Daily visit check-in'

// TO:
p_description: bonusPoints > 0 
  ? `Daily check-in: ${basePoints} beans (+${bonusPoints} streak bonus)`
  : `Daily check-in: ${basePoints} beans`
```

---

## ✅ Summary

### What Works NOW:
1. ✅ Pending rewards system fully functional
2. ✅ `claim_pending_rewards()` transfers beans on check-in
3. ✅ Points, stamps, vouchers all transfer correctly
4. ✅ Email notifications sent
5. ✅ Transaction logging works
6. ✅ Cache invalidation works

### What Needs Fixing:
1. ⚠️ Check-in base points: 5 → 50 beans
2. ⚠️ Check-in description: Update to mention beans

### After Fix:
- ✅ Check-in awards 50 beans (not 5)
- ✅ Pending beans transfer on check-in
- ✅ Streak multiplier applies to 50 beans
- ✅ Everything works with new beans system

---

## 🚀 Quick Fix

Run this to update check-in to beans system:

```typescript
// app/api/check-in/route.ts (lines 101-114)

// Award 50 beans for visit (with streak multiplier)
const streakMultiplier = streakData?.multiplier || 1.0
const basePoints = 50  // ✅ UPDATED FOR BEANS
const bonusPoints = Math.floor(basePoints * (streakMultiplier - 1))
const totalPoints = basePoints + bonusPoints

const { data: newBalance, error: pointsError } = await supabase
  .rpc('add_points', {
    p_user_id: userToCheckIn,
    p_amount: totalPoints,
    p_source: 'visit',
    p_description: bonusPoints > 0 
      ? `Daily check-in: ${basePoints} beans (+${bonusPoints} streak bonus)`
      : `Daily check-in: ${basePoints} beans`
  })
```

---

**Status:** ✅ Pending rewards transfer works!  
**Action Needed:** Update base points from 5 to 50  
**Estimated Time:** 2 minutes  
**Risk:** Low (simple value change)

---

**End of Report**
