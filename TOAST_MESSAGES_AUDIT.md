# 🔔 Toast Messages Audit - Beans Terminology

## Files That Need Updating

### ❌ **High Priority - User-Facing**

1. **`app/check-in/check-in-client.tsx`**
   - Line 139: "Points earned" → "Beans earned"
   - Line 142: "Total points" → "Total beans"

2. **`app/staff/scan/new-scanner-client.tsx`**
   - Line 137: "points" → "beans" (customer info toast)
   - Line 244: "points" → "beans" (customer info toast)
   - Line 275: "points" → "beans" (check-in complete toast)

3. **`app/staff/award-points/award-points-client.tsx`**
   - Line 169: "points amount" → "beans amount"
   - Line 199: "points" → "beans" (success toast)

4. **`components/dashboard/today-activity.tsx`**
   - Line 9: `pointsEarnedToday` → `beansEarnedToday` (prop name)
   - Line 12: `pointsEarnedToday` → `beansEarnedToday` (parameter)
   - Line 56-59: "points today" → "beans today"

### ⚠️ **Medium Priority - Staff Tools**

5. **`app/staff/scan/new-scanner-client-backup.tsx`**
   - Line 92: "points" → "beans"

### ✅ **Already Correct**

- Game toast messages (use prize labels from database)
- Login/onboarding toasts (no points mentioned)
- Message sending toasts (no points mentioned)

---

## Summary

**Total files to update:** 5  
**Total lines to change:** ~12

**Impact:**
- Check-in page (customer-facing) ✅ Critical
- Staff scanner (staff-facing) ⚠️ Important
- Award points (staff-facing) ⚠️ Important
- Dashboard activity (customer-facing) ✅ Critical

---

## Next Steps

1. Update check-in client (customer-facing)
2. Update today-activity component (customer-facing)
3. Update staff scanner toasts
4. Update award points toasts
5. Test all toast messages
