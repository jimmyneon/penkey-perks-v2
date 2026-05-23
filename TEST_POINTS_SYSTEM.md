# 🔍 POINTS SYSTEM DIAGNOSTIC

**Run these queries in Supabase SQL Editor to check if everything is set up:**

---

## 1️⃣ CHECK IF TABLES EXIST

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('points_transactions', 'points_rewards', 'coffee_stamps');
```

**Expected:** Should return 3 rows
- points_transactions
- points_rewards  
- coffee_stamps

**If empty:** Migrations not run!

---

## 2️⃣ CHECK IF FUNCTIONS EXIST

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('add_points', 'get_user_points', 'get_lifetime_points');
```

**Expected:** Should return 3 rows
- add_points
- get_user_points
- get_lifetime_points

**If empty:** Migrations not run!

---

## 3️⃣ TEST ADD_POINTS FUNCTION

```sql
-- Replace YOUR_USER_ID with your actual user ID
SELECT add_points(
  'YOUR_USER_ID'::uuid,
  10,
  'test',
  'Testing points system'
);
```

**Expected:** Returns your new points balance (e.g., 10)

**If error:** Function not working or user doesn't exist

---

## 4️⃣ CHECK YOUR POINTS BALANCE

```sql
-- Replace YOUR_USER_ID with your actual user ID
SELECT get_user_points('YOUR_USER_ID'::uuid);
```

**Expected:** Returns a number (your current points)

---

## 5️⃣ VIEW YOUR POINTS HISTORY

```sql
-- Replace YOUR_USER_ID with your actual user ID
SELECT * FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

**Expected:** Shows all your point transactions

---

## 6️⃣ GET YOUR USER ID

```sql
SELECT id, email, name FROM users 
WHERE email = 'your@email.com';
```

Replace `your@email.com` with your actual email.

---

## 🐛 COMMON ISSUES

### Issue 1: Tables don't exist
**Cause:** Migrations not run
**Fix:** Run `20251009_three_tier_rewards_system.sql` in Supabase

### Issue 2: Functions don't exist
**Cause:** Migrations not run completely
**Fix:** Re-run the migration file

### Issue 3: "User not found" error
**Cause:** User ID doesn't match
**Fix:** Get correct user ID from query #6

### Issue 4: Points not showing in dashboard
**Cause:** Dashboard not fetching correctly
**Fix:** Check `app/dashboard/page.tsx` line 21-22

---

## ✅ QUICK TEST

**Run this all-in-one test:**

```sql
-- 1. Check setup
SELECT 
  'Tables' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('points_transactions', 'points_rewards', 'coffee_stamps')

UNION ALL

SELECT 
  'Functions' as check_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('add_points', 'get_user_points', 'get_lifetime_points');
```

**Expected output:**
```
check_type | count
-----------+------
Tables     | 3
Functions  | 3
```

**If counts are less:** Migrations incomplete!

---

## 🔧 FIX STEPS

### If migrations not run:

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Copy/paste: `supabase/migrations/20251009_three_tier_rewards_system.sql`
5. Click "Run"
6. Wait for success
7. Re-run diagnostic queries above

---

## 📊 EXPECTED WORKFLOW

1. User checks in → `/api/check-in` called
2. API calls `add_points(user_id, 5, 'visit', 'Daily check-in')`
3. Function inserts into `points_transactions`
4. Function returns new balance
5. Dashboard fetches with `get_user_points(user_id)`
6. Points display on screen

---

**Run these tests and let me know what you see!** 🔍
