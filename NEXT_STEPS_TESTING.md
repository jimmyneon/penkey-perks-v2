# 🧪 NEXT STEPS - TESTING & VERIFICATION

## ✅ PHASE 1 COMPLETE - NOW TEST!

---

## 🎯 IMMEDIATE NEXT STEPS (15 minutes)

### **STEP 1: Check System Health** (2 mins)

Run this in Supabase SQL Editor:

```sql
SELECT public.system_health_check();
```

**Expected Result:**
```json
{
  "status": "healthy",
  "total_users": X,
  "pending_rewards_total": X,
  "data_issues": 0  ← Should be 0!
}
```

✅ **If `data_issues: 0`** → Perfect! Continue to Step 2  
⚠️ **If `data_issues > 0`** → Run Step 1B first

---

### **STEP 1B: Fix Data Issues (if needed)** (2 mins)

```sql
-- See what issues exist
SELECT * FROM public.reconcile_pending_rewards();

-- Auto-fix pending counts
SELECT public.fix_pending_counts();

-- Re-check health
SELECT public.system_health_check();
```

---

### **STEP 2: Test Game Play** (5 mins)

**A. Play a Game:**
1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/games/scratch_card
3. Play the game
4. Win a prize (points or stamps)

**B. Verify in Database:**

```sql
-- Replace YOUR_USER_ID with your actual user ID
-- Check game play was logged
SELECT 
  id,
  prize_type,
  prize_value,
  prize_label,
  status,
  pending_reward_id,
  created_at
FROM game_plays 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ Row exists
- ✅ `status = 'pending'`
- ✅ `pending_reward_id` is NOT NULL

```sql
-- Check pending reward was created
SELECT 
  id,
  reward_type,
  amount,
  reward_name,
  status,
  game_play_id,
  expires_at
FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID'
  AND status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ Row exists
- ✅ `game_play_id` matches the game play ID above
- ✅ `expires_at` is set (14 days from now)

---

### **STEP 3: Check Dashboard** (2 mins)

1. Go to: http://localhost:3000/dashboard
2. Look at Points Card or Stamps Card

**Expected:**
- ✅ Shows "X Pending" (where X is your pending count)
- ✅ Shows "Check In Now" button
- ✅ Shows total after check-in preview

**Screenshot for reference:**
```
┌─────────────────────────────┐
│ Points                      │
├─────────────────────────────┤
│  150        25              │
│  Available  Pending         │
├─────────────────────────────┤
│ You have 25 pending points! │
│ Check in to claim them.     │
│ [Check In Now]              │
└─────────────────────────────┘
```

---

### **STEP 4: Test Check-In** (4 mins)

**A. Perform Check-In:**
1. Go to: http://localhost:3000/check-in
2. Complete check-in process
3. Should see success message

**B. Verify in Database:**

```sql
-- Check pending reward was claimed
SELECT 
  id,
  reward_type,
  amount,
  status,
  claimed,
  claimed_at,
  claimed_via
FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ `status = 'claimed'`
- ✅ `claimed = true`
- ✅ `claimed_at` is set
- ✅ `claimed_via = 'check_in'`

```sql
-- Check user balance updated
SELECT 
  id,
  name,
  points,
  stamps,
  pending_rewards_count
FROM users 
WHERE id = 'YOUR_USER_ID';
```

**Expected:**
- ✅ `points` or `stamps` increased by the prize amount
- ✅ `pending_rewards_count = 0`

**C. Check Dashboard Again:**
1. Refresh: http://localhost:3000/dashboard
2. Look at Points/Stamps Card

**Expected:**
- ✅ Pending count is now 0
- ✅ Available balance increased
- ✅ "Check In Now" button is hidden

---

## ✅ SUCCESS CRITERIA

**Phase 1 is successful if:**

- [x] Migrations ran without errors
- [ ] Health check shows "healthy"
- [ ] `data_issues: 0`
- [ ] Game play creates pending reward
- [ ] Dashboard shows pending count correctly
- [ ] Check-in claims all pending
- [ ] User balance updates correctly
- [ ] Pending count resets to 0

---

## 🐛 TROUBLESHOOTING

### **Issue: Game play doesn't create pending reward**

**Check:**
```sql
-- Does the function exist?
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'award_game_prize_pending';
```

**Should return:** 1 row

**Check game API logs:**
- Look in terminal where `npm run dev` is running
- Look for errors after playing game

### **Issue: Dashboard doesn't show pending**

**Check:**
```sql
-- Does user have pending rewards?
SELECT * FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID' 
  AND status = 'pending';
```

**Check:**
- Browser console for errors (F12)
- Network tab for failed API calls
- Refresh the page

### **Issue: Health check shows data_issues > 0**

**Fix:**
```sql
-- See what's wrong
SELECT * FROM reconcile_pending_rewards();

-- Auto-fix
SELECT fix_pending_counts();

-- Verify fixed
SELECT system_health_check();
```

---

## 📊 VERIFICATION QUERIES

### **Get Your User ID:**
```sql
SELECT id, email, name FROM users WHERE email = 'your@email.com';
```

### **See All Your Game Plays:**
```sql
SELECT 
  gp.created_at,
  mg.display_name as game,
  gp.prize_type,
  gp.prize_value,
  gp.status,
  pr.status as pending_status
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'YOUR_USER_ID'
ORDER BY gp.created_at DESC
LIMIT 10;
```

### **See All Your Pending Rewards:**
```sql
SELECT 
  reward_name,
  reward_type,
  amount,
  status,
  created_at,
  expires_at,
  EXTRACT(DAY FROM expires_at - NOW()) as days_until_expiry
FROM pending_rewards
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### **Check System Performance:**
```sql
-- This should be FAST (< 100ms)
EXPLAIN ANALYZE
SELECT 
  u.points,
  u.stamps,
  u.pending_rewards_count,
  COALESCE(SUM(CASE WHEN pr.reward_type = 'points' THEN pr.amount ELSE 0 END), 0) as pending_points
FROM users u
LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
WHERE u.id = 'YOUR_USER_ID'
GROUP BY u.id, u.points, u.stamps, u.pending_rewards_count;
```

**Look for:** "Index Scan" (good) not "Seq Scan" (bad)

---

## 🎯 AFTER TESTING PASSES

### **Option A: Everything Works! 🎉**

**Next Steps:**
1. ✅ Mark all tests as passed
2. ✅ Monitor for 24 hours
3. ✅ Consider Phase 2 improvements:
   - Materialized views for faster dashboard
   - Analytics views
   - Automated cron jobs
   - Advanced monitoring

### **Option B: Issues Found 🐛**

**Next Steps:**
1. Document the issue
2. Check troubleshooting section
3. Run reconciliation queries
4. Fix data issues
5. Re-test

---

## 📋 TESTING CHECKLIST

Copy this and check off as you go:

```
TESTING CHECKLIST:
[ ] Step 1: Health check shows "healthy"
[ ] Step 1: data_issues = 0
[ ] Step 2: Played a game
[ ] Step 2: Game play logged in database
[ ] Step 2: Pending reward created
[ ] Step 2: pending_reward_id linked
[ ] Step 3: Dashboard shows pending count
[ ] Step 3: "Check In Now" button visible
[ ] Step 4: Performed check-in
[ ] Step 4: Pending reward marked claimed
[ ] Step 4: User balance updated
[ ] Step 4: pending_rewards_count = 0
[ ] Step 4: Dashboard updated correctly
[ ] Bonus: Played multiple games
[ ] Bonus: All pending claimed at once
[ ] Bonus: Performance is good (< 100ms)
```

---

## 🚀 READY TO TEST?

**Start with Step 1 and work through each step!**

**Questions?** Check `TESTING_GUIDE.md` for more details.

**Good luck!** 🎉
