# 🔒 Promotional Offers - Persistence & Dismissal Logic

## Problem Solved

**Issue**: Modal could disappear or show multiple times without user action.

**Solution**: Implemented proper dismissal tracking to ensure:
- ✅ Modal stays visible until user dismisses or redeems
- ✅ Once dismissed, won't show again this session
- ✅ Once redeemed, won't show again (ever)
- ✅ Marked as "viewed" immediately when shown
- ✅ Proper session-based dismissal tracking

---

## How It Works Now

### 1. **Modal Appears**
When user opens the app:
- Provider checks for active offers
- Filters out already dismissed offers (this session)
- Shows highest priority offer
- **Immediately marks as "viewed"** in database

### 2. **User Dismisses (X button)**
When user clicks X or Close:
- Offer ID added to `dismissedOffers` Set (in-memory)
- Modal closes smoothly
- **Won't show again this session**
- Will show again on next app open (new session)

### 3. **User Redeems**
When user clicks "Redeem Now":
- Voucher created
- Offer marked as redeemed in database
- Offer ID added to `dismissedOffers` Set
- Modal closes
- **Won't show again ever** (database tracks redemption)

### 4. **Multiple Offers**
If you have multiple active offers:
- Shows highest priority first
- After dismissal, next offer won't show this session
- On next app open, shows next highest priority offer

---

## State Management

### In-Memory State (Session-Based)
```typescript
const [dismissedOffers, setDismissedOffers] = useState<Set<string>>(new Set())
```

**Purpose**: Track which offers user has dismissed **this session**
**Lifetime**: Until page refresh or app close
**Why**: Prevents annoying users with same offer multiple times in one session

### Database State (Permanent)
```sql
-- user_promotional_offers table
- viewed_at: When user saw the offer
- redeemed_at: When user redeemed (NULL if not redeemed)
```

**Purpose**: Track which offers user has **viewed** and **redeemed** permanently
**Lifetime**: Forever
**Why**: Prevents showing already redeemed offers

---

## Logic Flow

### On App Open
```
1. Load offers from API
   ↓
2. Filter by:
   - Active = true
   - Not redeemed (has_redeemed = false)
   - Not dismissed this session
   - Meets targeting criteria
   ↓
3. Get highest priority offer
   ↓
4. Show modal
   ↓
5. Mark as viewed in database (immediately)
```

### On Dismiss (X button)
```
1. User clicks X
   ↓
2. Add offer ID to dismissedOffers Set
   ↓
3. Close modal
   ↓
4. Offer won't show again this session
   ↓
5. Will show again on next app open
```

### On Redeem
```
1. User clicks "Redeem Now"
   ↓
2. Call redeem API
   ↓
3. Voucher created
   ↓
4. Database marks as redeemed
   ↓
5. Add to dismissedOffers Set
   ↓
6. Close modal
   ↓
7. Refetch offers (won't include redeemed one)
   ↓
8. Won't show again ever
```

---

## Key Changes Made

### 1. `promotional-offers-provider.tsx`

**Added**:
- ✅ `dismissedOffers` Set to track dismissed offers
- ✅ Check `!dismissedOffers.has(offer.id)` before showing
- ✅ Auto mark-viewed when modal appears
- ✅ Add to dismissed set on close
- ✅ Add to dismissed set on redeem
- ✅ Better logging

**Removed**:
- ❌ `hasChecked` flag (was causing issues)

### 2. `promotional-offer-modal.tsx`

**Removed**:
- ❌ Duplicate mark-viewed call (now in provider)

**Why**: Provider handles it immediately when shown, no need to do it again on redeem

---

## User Experience

### Scenario 1: User Dismisses Offer
```
1. User opens app → Modal appears
2. User clicks X → Modal closes
3. User navigates around app → Modal stays closed ✅
4. User refreshes page → Modal appears again (new session)
```

### Scenario 2: User Redeems Offer
```
1. User opens app → Modal appears
2. User clicks "Redeem Now" → Voucher created
3. Modal closes → Success message
4. User navigates around app → Modal stays closed ✅
5. User refreshes page → Modal stays closed ✅ (redeemed)
6. User comes back tomorrow → Modal stays closed ✅ (redeemed)
```

### Scenario 3: Multiple Offers
```
1. Staff creates Offer A (priority 5)
2. Staff creates Offer B (priority 10)
3. User opens app → Offer A appears (lower priority = higher)
4. User dismisses → Offer A closes
5. User navigates → No more offers this session ✅
6. User refreshes → Offer B appears (next priority)
7. User redeems → Offer B closes permanently
8. User refreshes → Offer A appears again (not redeemed)
```

---

## Database Tracking

### What Gets Tracked

**When Modal Appears**:
```sql
INSERT INTO user_promotional_offers (user_id, offer_id, viewed_at)
VALUES ('user-id', 'offer-id', NOW());
```

**When User Redeems**:
```sql
UPDATE user_promotional_offers 
SET redeemed_at = NOW(), voucher_id = 'voucher-id'
WHERE user_id = 'user-id' AND offer_id = 'offer-id';
```

### What Gets Queried

**Get Available Offers**:
```sql
SELECT * FROM get_user_promotional_offers('user-id')
-- Returns offers where:
-- - active = true
-- - has_redeemed = false (checks user_promotional_offers.redeemed_at)
-- - within date range
-- - meets targeting
```

---

## Session vs Permanent

| Action | Session Storage | Database | Effect |
|--------|----------------|----------|--------|
| **View** | No | ✅ Yes (viewed_at) | Tracked for analytics |
| **Dismiss** | ✅ Yes (dismissedOffers) | No | Won't show this session |
| **Redeem** | ✅ Yes (dismissedOffers) | ✅ Yes (redeemed_at) | Won't show ever |

**Why Session Storage for Dismiss?**
- User might change their mind later
- Don't want to permanently hide offers they just closed
- Gives them a fresh start each session

**Why Database for Redeem?**
- User already got the reward
- Shouldn't be able to redeem twice
- Permanent record needed

---

## Testing

### Test Dismissal
1. Open app → Modal appears
2. Click X → Modal closes
3. Navigate to different page → Modal stays closed ✅
4. Refresh page (Cmd+R) → Modal appears again ✅
5. Click X again → Modal closes
6. Hard refresh (Cmd+Shift+R) → Modal appears again ✅

### Test Redemption
1. Open app → Modal appears
2. Click "Redeem Now" → Voucher created
3. Modal closes → Success message
4. Navigate to different page → Modal stays closed ✅
5. Refresh page → Modal stays closed ✅
6. Hard refresh → Modal stays closed ✅
7. Check "My Rewards" → Voucher is there ✅

### Test Multiple Offers
1. Create 2 offers (different priorities)
2. Open app → First offer appears
3. Dismiss → Modal closes
4. Refresh → Second offer appears
5. Redeem → Modal closes
6. Refresh → First offer appears (not redeemed)
7. Redeem → Modal closes
8. Refresh → No modal ✅ (all redeemed)

---

## Console Logs

You'll see these logs:

**On Load**:
```
[Promotional Offers Provider] Checking for offers...
{offersCount: 1, loading: false, dismissedCount: 0}
[Promotional Offers Provider] Top priority offer: {id: "...", title: "..."}
```

**On Dismiss**:
```
[Promotional Offers Provider] Offer dismissed: abc-123-def-456
```

**On Redeem**:
```
[Promotional Offers Provider] Offer redeemed
```

---

## Summary

### What Changed
1. ✅ Added session-based dismissal tracking
2. ✅ Auto mark-viewed when modal appears
3. ✅ Proper state management for dismissed offers
4. ✅ Better logging for debugging
5. ✅ Removed duplicate mark-viewed call

### What Works Now
1. ✅ Modal stays visible until user acts
2. ✅ Dismissed offers don't show again this session
3. ✅ Redeemed offers never show again
4. ✅ Multiple offers work correctly
5. ✅ Clean user experience

### User Benefits
- 🎯 Won't miss offers (stays visible)
- 🚫 Won't be annoyed (dismissal works)
- ✅ Can't redeem twice (database tracking)
- 🔄 Fresh start each session (if dismissed)
- 📊 All interactions tracked (analytics)

**The modal now has proper persistence and dismissal logic!** 🎉
