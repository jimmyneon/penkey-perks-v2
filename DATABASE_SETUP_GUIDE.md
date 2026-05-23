# 🗄️ DATABASE SETUP GUIDE - Penkey Perks

**Last Updated:** 2025-10-10  
**Status:** Ready to run

---

## 🎯 WHAT THIS DOES

This guide will set up your complete database schema for the Penkey Perks app, including:
- ✅ Points system (earn & redeem)
- ✅ Coffee stamps (GPS validated)
- ✅ Games with prizes
- ✅ Badges & milestones
- ✅ All security policies (RLS)

---

## ⚠️ IMPORTANT: Run Migrations in Order

You **MUST** run these migrations in the exact order listed below.

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Open Supabase SQL Editor**

1. Go to [https://supabase.com](https://supabase.com)
2. Select your Penkey Perks project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

### **Step 2: Run FINAL_FIX_ALL Migration**

This is the **MOST IMPORTANT** migration. It:
- Drops old `ducks` table (if exists)
- Sets up points system correctly
- Fixes all RLS policies
- Updates all functions

**File:** `supabase/migrations/20251009_FINAL_FIX_ALL.sql`

**How to run:**
1. Copy the entire contents of the file
2. Paste into SQL Editor
3. Click **Run** (or press Cmd+Enter)
4. ✅ Should see "Success. No rows returned"

**What it creates:**
- `points_transactions` table with proper RLS
- Functions: `get_user_points()`, `add_points()`, `can_check_in()`
- Removes old `ducks` table references

---

### **Step 3: Run Three-Tier Rewards System Migration**

This creates the complete rewards infrastructure.

**File:** `supabase/migrations/20251009_three_tier_rewards_system.sql`

**What it creates:**
- `points_rewards` table (redemption options)
- `coffee_stamps` table (GPS validated)
- Enhanced game functions with stock limits
- Auto-reward issuing system

**How to run:**
1. Open new query in SQL Editor
2. Copy entire file contents
3. Paste and run
4. ✅ Should complete without errors

---

### **Step 4: Run Badges & Milestones Migration**

This adds gamification features.

**File:** `supabase/migrations/20251009_badges_milestones.sql`

**What it creates:**
- `badge_tiers` table (6 badge levels)
- `user_badges` table (earned badges)
- `milestones` table (achievements)
- `user_milestones` table (progress tracking)
- Auto-badge award system

**How to run:**
1. Open new query in SQL Editor
2. Copy entire file contents
3. Paste and run
4. ✅ Should complete without errors

---

## ✅ VERIFICATION CHECKLIST

After running all migrations, verify everything is set up correctly:

### **Check Tables Exist:**

Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users',
  'points_transactions',
  'points_rewards',
  'coffee_stamps',
  'user_badges',
  'badge_tiers',
  'milestones',
  'user_milestones',
  'mini_games',
  'game_prizes',
  'game_plays',
  'rewards',
  'user_rewards',
  'referrals',
  'staff',
  'transactions'
)
ORDER BY table_name;
```

**Expected:** Should return 16 tables

---

### **Check Functions Exist:**

Run this query:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_user_points',
  'add_points',
  'get_lifetime_points',
  'can_check_in',
  'add_coffee_stamp',
  'validate_location',
  'play_game_enhanced',
  'check_milestones'
)
ORDER BY routine_name;
```

**Expected:** Should return 8 functions

---

### **Check RLS is Enabled:**

Run this query:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('points_transactions', 'coffee_stamps', 'user_badges')
ORDER BY tablename;
```

**Expected:** All should show `rowsecurity = true`

---

### **Test Points System:**

Run this query (replace `YOUR_USER_ID` with a real user ID):
```sql
-- Get a test user ID
SELECT id, email FROM users LIMIT 1;

-- Test adding points (use the ID from above)
SELECT add_points(
  'YOUR_USER_ID'::uuid,
  10,
  'test',
  'Testing points system'
);

-- Check balance
SELECT get_user_points('YOUR_USER_ID'::uuid);

-- View transaction
SELECT * FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID'::uuid
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** 
- `add_points()` returns new balance (10)
- `get_user_points()` returns 10
- Transaction is visible in table

---

## 🐛 TROUBLESHOOTING

### **Error: "relation already exists"**

This means you've already run this migration before.

**Solution:**
- Skip to next migration
- OR drop the table first: `DROP TABLE IF EXISTS table_name CASCADE;`

---

### **Error: "function does not exist"**

This means a previous migration didn't run successfully.

**Solution:**
- Go back and run previous migrations in order
- Check for any error messages

---

### **Error: "permission denied"**

You need proper permissions in Supabase.

**Solution:**
- Make sure you're logged in as project owner
- Check your Supabase project settings

---

### **Points not showing up**

**Check:**
1. Did `FINAL_FIX_ALL` migration run successfully?
2. Is RLS enabled on `points_transactions`?
3. Are you querying with the correct user ID?

**Debug query:**
```sql
-- Check if points_transactions table exists
SELECT * FROM points_transactions LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'points_transactions';
```

---

## 📊 WHAT EACH TABLE DOES

### **Core Tables:**
- `users` - Customer profiles
- `points_transactions` - Ledger of all point movements (immutable)
- `coffee_stamps` - Coffee purchases with GPS validation
- `rewards` - Available rewards catalog
- `user_rewards` - Issued rewards with QR codes

### **Games Tables:**
- `mini_games` - Game configurations (Scratch Card, Spin Wheel, Duck Pond)
- `game_prizes` - Prize definitions with probabilities
- `game_plays` - History of all game plays

### **Gamification Tables:**
- `badge_tiers` - 6 badge levels (Fresh Duck → Grand Duck Master)
- `user_badges` - Badges earned by users
- `milestones` - Achievement definitions
- `user_milestones` - User progress on milestones

### **Admin Tables:**
- `staff` - Admin/employee roles
- `transactions` - Audit log of all actions
- `referrals` - Referral tracking

---

## 🎯 NEXT STEPS

After running all migrations:

1. ✅ **Test the app locally:**
   ```bash
   npm run dev
   ```

2. ✅ **Create a test account:**
   - Go to http://localhost:3000
   - Sign up with email
   - Try checking in

3. ✅ **Verify points system:**
   - Check in (should award 5 points)
   - Check dashboard shows correct balance
   - Check Supabase shows transaction

4. ✅ **Test games:**
   - Play a daily game
   - Win a prize
   - Verify it's added to balance

5. ✅ **Deploy to production:**
   - Push code to GitHub
   - Deploy to Vercel
   - Run migrations on production database

---

## 📞 SUPPORT

If you encounter issues:

1. Check the error message carefully
2. Verify you ran migrations in order
3. Check Supabase logs for details
4. Review the troubleshooting section above

---

**Status:** ✅ Ready to run  
**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy (just copy & paste!)
