# ⚡ RUN THIS NOW - Fix All Errors

**You're getting the `check_and_issue_rewards` error because you haven't run the fix migration yet.**

---

## 🚀 Quick Fix (2 minutes)

### **Step 1: Open Supabase**

1. Go to [supabase.com](https://supabase.com)
2. Select your Penkey Perks project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### **Step 2: Run This Migration**

1. Open this file: `supabase/migrations/20251010_COMPLETE_FIX.sql`
2. Copy the **entire contents**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd+Enter)

### **Step 3: Verify Success**

You should see a table showing:
```
game            | prize_count | total_probability
----------------|-------------|------------------
Duck Pond       | 6           | 1.00
Scratch Card    | 6           | 1.00
Spin Wheel      | 7           | 1.00
```

✅ If you see this → Success!

### **Step 4: Test Again**

1. Go back to your app
2. Try adding a coffee stamp
3. Try playing spin wheel
4. Should work now! 🎉

---

## 🐛 What This Fixes

- ✅ `check_and_issue_rewards` function error
- ✅ Coffee stamps not working
- ✅ Games not working
- ✅ Spin wheel empty segments
- ✅ Duck references removed
- ✅ **Check-in now resets at midnight (not 24 hours later)**
- ✅ **Games can only be played once per day (was allowing multiple plays)**

---

## 📋 What This Migration Does

1. **Recreates `add_coffee_stamp` function** (without the broken reference)
2. **Fixes `can_check_in` function** (resets at midnight, not 24 hours)
3. **Creates `can_play_game` function** (prevents multiple plays per day)
4. **Updates `prize_type` constraint** (allows points, stamps, reward, nothing)
5. **Seeds prizes for all 3 games:**
   - Spin Wheel: 7 prizes
   - Scratch Card: 6 prizes
   - Duck Pond: 6 prizes
6. **Verifies everything** (shows summary table)

---

## ⏱️ Time Required

- **2 minutes** to run migration
- **0 minutes** to restart (no restart needed!)
- **1 minute** to test

**Total: 3 minutes** 🚀

---

## 🆘 If It Fails

**Error: "relation does not exist"**
→ Make sure you ran the earlier migrations first

**Error: "permission denied"**
→ Make sure you're logged in as project owner

**No errors but still broken:**
→ Hard refresh browser (Cmd+Shift+R)

---

## ✅ After Running

You'll be able to:
- ✅ Add coffee stamps
- ✅ Play all games
- ✅ See proper prizes on spin wheel
- ✅ No more errors!

---

**Just run the migration and you're done!** 🎉
