# 🧪 TESTING GUIDE - Phase 1 Critical Fixes

## 🎯 HOW TO TEST THE IMPROVEMENTS

---

## STEP 1: RUN THE MIGRATIONS

### **In Supabase SQL Editor:**

```sql
-- 1. First, run the pending rewards fix
-- File: supabase/migrations/20251011_fix_pending_rewards_function.sql

-- 2. Then run Phase 1 critical fixes
-- File: supabase/migrations/20251011_phase1_critical_fixes.sql
```

**Expected Output:**
- ✅ Tables created/updated
- ✅ Indexes created
- ✅ Functions created
- ✅ Health check runs
- ✅ Success message displayed

---

## STEP 2: CHECK SYSTEM HEALTH

### **Run Health Check:**
```sql
SELECT public.system_health_check();
```

**Expected Result:**
```json
{
  "status": "healthy",
  "total_users": X,
  "active_users_7d": X,
  "pending_rewards_total": X,
  "games_played_today": X,
  "data_issues": 0  ← Should be 0!
}
```

---

## STEP 3: CHECK FOR DATA ISSUES

### **Run Reconciliation:**
```sql
SELECT * FROM public.reconcile_pending_rewards();
```

**Expected Result:**
- If empty: ✅ No issues!
- If rows returned: Issues found, proceed to Step 4

**Possible Issues:**
- `count_mismatch` - User pending count wrong
- `orphaned_pending` - Pending reward without game play
- `expired_not_marked` - Expired but still pending
- `missing_pending` - Game play without pending reward

---

## STEP 4: FIX DATA ISSUES (If Any)

### **Auto-Fix Counts:**
```sql
SELECT public.fix_pending_counts();
```

**Expected Result:**
```json
{
  "success": true,
  "fixed_count": X,
  "timestamp": "2025-10-11..."
}
```

### **Re-check:**
```sql
SELECT * FROM public.reconcile_pending_rewards();
```

Should now be empty! ✅

---

## STEP 5: TEST GAME PLAY FLOW

### **A. Play a Game:**

1. Go to any game (e.g., http://localhost:3000/games/scratch_card)
2. Play the game
3. Win a prize (points or stamps)

### **B. Check Database:**

```sql
-- Check game play was logged
SELECT * FROM game_plays 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ Row exists
- ✅ `status = 'pending'`
- ✅ `prize_type` matches what you won
- ✅ `pending_reward_id` is set

```sql
-- Check pending reward was created
SELECT * FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID'
  AND status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ Row exists
- ✅ `game_play_id` matches game play ID
- ✅ `amount` matches prize value
- ✅ `expires_at` is set (14 days from now)

```sql
-- Check user pending count
SELECT id, name, pending_rewards_count 
FROM users 
WHERE id = 'YOUR_USER_ID';
```

**Expected:**
- ✅ `pending_rewards_count` increased by 1

---

## STEP 6: TEST DASHBOARD

### **A. Check Dashboard UI:**

1. Go to http://localhost:3000/dashboard
2. Look at Points Card
3. Look at Stamps Card

**Expected:**
- ✅ "X Pending" shown in Points Card (if won points)
- ✅ "X Pending Stamps" shown in Stamps Card (if won stamps)
- ✅ "Check In Now" button visible
- ✅ Pending count matches database

---

## STEP 7: TEST CHECK-IN FLOW

### **A. Perform Check-In:**

1. Go to http://localhost:3000/check-in
2. Complete check-in process

### **B. Check Database:**

```sql
-- Check pending reward was claimed
SELECT * FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:**
- ✅ `status = 'claimed'`
- ✅ `claimed = true`
- ✅ `claimed_at` is set
- ✅ `claimed_via = 'check_in'`

```sql
-- Check game play was updated
SELECT * FROM game_plays 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:**
- ✅ `status = 'claimed'`
- ✅ `claimed_at` is set
- ✅ `transaction_id` is set

```sql
-- Check user balance updated
SELECT id, name, points, stamps, pending_rewards_count 
FROM users 
WHERE id = 'YOUR_USER_ID';
```

**Expected:**
- ✅ `points` or `stamps` increased
- ✅ `pending_rewards_count = 0`

### **C. Check Dashboard:**

1. Refresh dashboard
2. Check Points/Stamps cards

**Expected:**
- ✅ Pending count is 0
- ✅ Available balance increased
- ✅ "Check In Now" button hidden

---

## STEP 8: VERIFY INDEXES

### **Check Indexes Created:**

```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('game_plays', 'pending_rewards', 'users')
ORDER BY tablename, indexname;
```

**Expected Indexes:**

**game_plays:**
- idx_game_plays_user_id
- idx_game_plays_game_id
- idx_game_plays_status
- idx_game_plays_created_at
- idx_game_plays_pending_reward
- idx_game_plays_user_created

**pending_rewards:**
- idx_pending_rewards_user_status
- idx_pending_rewards_expires_at
- idx_pending_rewards_source
- idx_pending_rewards_game_play
- idx_pending_rewards_created_at

**users:**
- idx_users_pending_count
- idx_users_email
- idx_users_role

---

## STEP 9: PERFORMANCE TEST

### **A. Test Dashboard Load Time:**

```sql
-- This should be FAST (< 100ms)
EXPLAIN ANALYZE
SELECT 
  u.points,
  u.stamps,
  u.pending_rewards_count,
  COALESCE(SUM(CASE WHEN pr.reward_type = 'points' THEN pr.amount ELSE 0 END), 0) as pending_points,
  COALESCE(SUM(CASE WHEN pr.reward_type = 'stamps' THEN pr.amount ELSE 0 END), 0) as pending_stamps
FROM users u
LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
WHERE u.id = 'YOUR_USER_ID'
GROUP BY u.id, u.points, u.stamps, u.pending_rewards_count;
```

**Expected:**
- ✅ Uses indexes (Index Scan, not Seq Scan)
- ✅ Execution time < 100ms

---

## STEP 10: EDGE CASES

### **A. Test "Nothing" Prize:**

1. Play game until you get "nothing"
2. Check database:

```sql
SELECT * FROM game_plays 
WHERE user_id = 'YOUR_USER_ID'
  AND prize_type = 'nothing'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- ✅ Row exists
- ✅ `status = 'claimed'` (auto-claimed)
- ✅ No pending reward created

### **B. Test Multiple Pending:**

1. Play multiple games
2. Win multiple prizes
3. Check dashboard shows total pending
4. Check-in once
5. Verify ALL pending claimed

### **C. Test Expiry:**

```sql
-- Manually expire a pending reward (for testing)
UPDATE pending_rewards
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID'
  AND status = 'pending'
LIMIT 1;

-- Check reconciliation finds it
SELECT * FROM reconcile_pending_rewards()
WHERE issue_type = 'expired_not_marked';
```

**Expected:**
- ✅ Issue found
- ✅ Shows expired reward

---

## ✅ SUCCESS CRITERIA

**Phase 1 is successful when:**

- [x] All migrations run without errors
- [x] Health check shows "healthy"
- [x] Reconciliation shows 0 issues
- [x] Game play creates pending reward
- [x] Dashboard shows pending count
- [x] Check-in claims all pending
- [x] User balances update correctly
- [x] All indexes created
- [x] Performance is good (< 100ms queries)
- [x] No orphaned records
- [x] Counts always accurate

---

## 🐛 TROUBLESHOOTING

### **Issue: Health check shows errors**
```sql
-- Check the error
SELECT public.system_health_check();

-- Look at the details
SELECT * FROM reconcile_pending_rewards();
```

### **Issue: Pending count wrong**
```sql
-- Auto-fix it
SELECT public.fix_pending_counts();
```

### **Issue: Game play not creating pending**
```sql
-- Check the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'award_game_prize_pending';

-- Check for errors in logs
SELECT * FROM pending_rewards 
WHERE error_log IS NOT NULL;
```

### **Issue: Slow queries**
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM game_plays WHERE user_id = 'YOUR_USER_ID';

-- Should show "Index Scan" not "Seq Scan"
```

---

## 📊 MONITORING QUERIES

### **Daily Health Check:**
```sql
SELECT public.system_health_check();
```

### **Find Issues:**
```sql
SELECT * FROM public.reconcile_pending_rewards();
```

### **User Summary:**
```sql
SELECT 
  u.name,
  u.points,
  u.stamps,
  u.pending_rewards_count,
  COUNT(pr.id) as actual_pending,
  COUNT(gp.id) as games_played
FROM users u
LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
LEFT JOIN game_plays gp ON gp.user_id = u.id AND gp.created_at >= CURRENT_DATE
WHERE u.id = 'YOUR_USER_ID'
GROUP BY u.id, u.name, u.points, u.stamps, u.pending_rewards_count;
```

---

## 🎉 NEXT STEPS AFTER TESTING

1. ✅ Verify all tests pass
2. ✅ Fix any issues found
3. ✅ Deploy to production
4. ✅ Monitor for 24 hours
5. ✅ Proceed to Phase 2 improvements

**Good luck with testing!** 🚀
