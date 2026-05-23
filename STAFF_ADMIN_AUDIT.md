# 🔧 Staff & Admin Pages - Beans Terminology Audit

## ❌ Issues Found

### **Staff Pages**

#### 1. **`app/staff/dashboard/staff-dashboard-client.tsx`**
- Line 202: "Total Points" → "Total Beans"
- Line 262: "Award Points" → "Award Beans"
- Line 263: "Give bonus points" → "Give bonus beans"
- Line 308: "Total Points" → "Total Beans"
- Line 416: "Total Points Awarded" → "Total Beans Awarded"
- Line 420: "points" → "beans" (average per customer)
- Line 451: "Points won in games" → "Beans won in games"
- Line 474: "Points rewards" → "Beans rewards"

#### 2. **`app/staff/scan/new-scanner-client.tsx`**
- Line 456: "Points" → "Beans" (customer info display)
- Line 496: "Award daily check-in points" → "Award daily check-in beans"
- Line 529: "Award Custom Points" → "Award Custom Beans"
- Line 531: "Bonus points, referrals, etc." → "Bonus beans, referrals, etc."

#### 3. **`app/staff/scan/scanner-client.tsx`**
- Line 86: "+${data.points} points" → "+${data.points} beans"
- Line 92: "points" → "beans"

---

### **Admin Pages**

#### 4. **`app/admin/points-config/points-config-client.tsx`**
- Line 76: "Failed to create points config" → "Failed to create beans config"
- Line 81: "Points configuration created" → "Beans configuration created"
- Line 112: "Failed to update points config" → "Failed to update beans config"
- Line 117: "Points configuration updated" → "Beans configuration updated"
- Line 164: "Failed to toggle points config" → "Failed to toggle beans config"
- Line 169: "Points action" → "Beans action"
- Line 193: "Points Configuration" → "Beans Configuration"
- Line 194: "Manage point awards and rewards" → "Manage bean awards and rewards"
- Line 216: "Total Points Awarded" → "Total Beans Awarded"
- Line 236: "Avg Points/Action" → "Avg Beans/Action"
- Line 271: "points" → "beans"
- Line 318: "Points Awarded" → "Beans Awarded"
- Line 363: "No points configurations yet" → "No beans configurations yet"
- Line 381: "Edit Points Config" / "Create Points Config" → "Edit Beans Config" / "Create Beans Config"
- Line 383: "Update points configuration" / "Add a new points action" → "Update beans configuration" / "Add a new beans action"
- Line 414: "Points Amount *" → "Beans Amount *"

#### 5. **`app/admin/approve-points/approve-points-client.tsx`**
- Line 15: `points: number` → Keep (variable name)
- Line 92: "points" → "beans" (toast message)
- Line 182: "Approve Manual Points" → "Approve Manual Beans"
- Line 216: "pts" → "beans"
- Line 309: "pts" → "beans"
- Line 343: "pts" → "beans"

---

## 📊 Summary

**Total Files to Update:** 5
**Total Lines to Change:** ~35

### Priority:
1. **High:** Staff dashboard, scanner (customer-facing staff tools)
2. **Medium:** Admin points config (admin-only)
3. **Low:** Approve points (rarely used)

---

## Impact Analysis

### Staff Pages (High Visibility)
- Staff dashboard: Used daily by all staff
- Scanner: Used for every customer interaction
- Award points: Used frequently for bonuses

### Admin Pages (Medium Visibility)
- Points config: Admin-only, occasional use
- Approve points: Admin-only, rare use

---

## Recommendations

**Option A:** Fix all (15 min)
- Complete consistency across entire app
- No confusion for staff or admins

**Option B:** Fix staff pages only (5 min)
- Focus on high-visibility customer-facing tools
- Leave admin pages for later

**Recommendation:** Fix all - staff and admins should see consistent terminology
