# 🔧 Fix "How It Works" Dynamic Display

**Issue:** "How It Works" showing static version after migration deployed  
**Date:** 2025-10-10 18:52:00

---

## 🔍 Diagnosis Steps

### **Step 1: Verify Migration Ran Successfully**

Run in Supabase SQL Editor:
```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'points_config';
```

**Expected:** Should return 1 row with `points_config`

---

### **Step 2: Check Data Exists**

```sql
-- Count configs
SELECT COUNT(*) FROM points_config;
```

**Expected:** Should return 20+ rows

---

### **Step 3: Check Active Configs**

```sql
-- Show active configs
SELECT action_type, points_amount, description, active
FROM points_config
WHERE active = true
ORDER BY points_amount DESC;
```

**Expected:** Should show multiple rows with point values

---

### **Step 4: Check RLS Policies**

```sql
-- Check policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'points_config';
```

**Expected:** Should show "Anyone can view active point configs" for SELECT

---

## 🐛 Common Issues & Fixes

### **Issue 1: Table Doesn't Exist**

**Symptom:** Query returns 0 rows or error

**Fix:** Re-run migration
```bash
# In Supabase SQL Editor
# Run: supabase/migrations/20251010_create_points_config_table.sql
```

---

### **Issue 2: No Data in Table**

**Symptom:** Table exists but COUNT(*) = 0

**Fix:** The migration should have inserted data. Check if INSERT statements ran:
```sql
-- Manually insert if needed
INSERT INTO points_config (action_type, points_amount, description, active) VALUES
('signup', 10, 'Welcome bonus for new account registration', TRUE),
('daily_checkin', 5, 'Daily visit check-in at shop', TRUE),
('referral_signup', 20, 'Friend signs up with your referral code', TRUE);
-- ... etc
```

---

### **Issue 3: RLS Blocking Access**

**Symptom:** Data exists but query returns empty

**Fix:** Check RLS policy exists:
```sql
-- Drop and recreate policy
DROP POLICY IF EXISTS "Anyone can view active point configs" ON points_config;

CREATE POLICY "Anyone can view active point configs"
  ON points_config
  FOR SELECT
  USING (active = TRUE);
```

---

### **Issue 4: Browser Cache**

**Symptom:** Everything looks correct in DB but page shows static

**Fix:** 
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Restart dev server (`npm run dev`)
4. Check server console for errors

---

### **Issue 5: Query Error (Silent Fail)**

**Symptom:** No error shown but data not loading

**Fix:** Check server logs for errors. I added debug logging:
```typescript
console.log('Points Config Debug:', {
  configsCount: pointsConfigs?.length || 0,
  error: configError,
  configs: pointsConfigs?.slice(0, 3)
})
```

Look for this in your terminal where `npm run dev` is running.

---

## 🔧 Quick Fix Commands

### **Run This Test Query:**
```sql
-- File: TEST_POINTS_CONFIG.sql
-- This checks everything at once
```

### **If Table Missing:**
```bash
# Re-run migration
# In Supabase SQL Editor:
# Copy/paste: supabase/migrations/20251010_create_points_config_table.sql
```

### **If Data Missing:**
```sql
-- Check if INSERT ran
SELECT COUNT(*) FROM points_config;

-- If 0, re-run the INSERT section from migration
```

### **If RLS Issue:**
```sql
-- Verify policy
SELECT * FROM pg_policies WHERE tablename = 'points_config';

-- Should show SELECT policy for everyone
```

---

## 🎯 Expected Behavior

### **When Working:**

1. Navigate to `/rewards`
2. Click "How It Works" tab
3. Should see dynamic values:
   - "Get 10 points when you join" (from database)
   - "Earn 5 points per visit" (from database)
   - Quick stats show database values

### **Debug Output:**
```
Points Config Debug: {
  configsCount: 20,
  error: null,
  configs: [
    { action_type: 'game_win_jackpot', points_amount: 50, ... },
    { action_type: 'birthday_bonus', points_amount: 25, ... },
    { action_type: 'referral_signup', points_amount: 20, ... }
  ]
}
```

---

## 🚀 Step-by-Step Fix

### **1. Check Server Console**
Look at your terminal where `npm run dev` is running.
Find the "Points Config Debug" log.

**If you see:**
```
configsCount: 0
error: null
```
→ Data not in database, re-run migration

**If you see:**
```
configsCount: 0
error: { code: '42P01', message: 'relation "points_config" does not exist' }
```
→ Table doesn't exist, run migration

**If you see:**
```
configsCount: 20
error: null
```
→ Data is loading! Check browser cache or component logic

---

### **2. Restart Dev Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

### **3. Hard Refresh Browser**
- **Mac:** Cmd + Shift + R
- **Windows:** Ctrl + Shift + R
- Or open in incognito/private window

---

### **4. Check Component Logic**

The component should show dynamic version when `pointsConfigs.length > 0`:

```tsx
{pointsConfigs.length > 0 ? (
  <HowItWorksDynamic pointsConfigs={pointsConfigs} />
) : (
  <HowItWorks />  // Static fallback
)}
```

If `pointsConfigs` is empty array, it shows static version.

---

## 📊 Verification Checklist

- [ ] Table `points_config` exists
- [ ] Table has 20+ rows
- [ ] Active configs exist (WHERE active = TRUE)
- [ ] RLS policy allows SELECT
- [ ] Server logs show `configsCount: 20+`
- [ ] Browser cache cleared
- [ ] Dev server restarted
- [ ] Page shows dynamic values

---

## 🎯 Quick Test

### **Run in Supabase SQL Editor:**
```sql
-- This is the EXACT query the page uses
SELECT 
  action_type, 
  points_amount, 
  description, 
  active
FROM points_config
WHERE active = true
ORDER BY points_amount DESC;
```

**If this returns data:** Problem is in the app  
**If this returns empty:** Problem is in the database

---

## 💡 Most Likely Cause

**Browser cache or dev server needs restart.**

Try this:
1. Stop dev server (Ctrl+C)
2. Run `npm run dev` again
3. Hard refresh browser (Cmd+Shift+R)
4. Check "How It Works" tab

---

## 📞 Still Not Working?

Share the output of:
1. `SELECT COUNT(*) FROM points_config;`
2. Server console "Points Config Debug" log
3. Any errors in browser console (F12 → Console tab)

This will help diagnose the exact issue!
