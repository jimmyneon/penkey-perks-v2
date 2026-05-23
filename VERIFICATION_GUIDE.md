# ✅ VERIFICATION GUIDE - Complete System Check

## 🎯 QUICK VERIFICATION (5 minutes)

---

## STEP 1: Check System Health (1 min)

**In Supabase SQL Editor:**

```sql
SELECT public.system_health_check();
```

**Expected Result:**
```json
{
  "status": "healthy",
  "data_issues": 0,  ← Should be 0!
  "total_users": 2,
  "games_enabled": 10,
  "pending_rewards_total": X,
  "games_played_today": X
}
```

✅ **If `data_issues: 0`** → Perfect! Continue  
⚠️ **If `data_issues > 0`** → Run Step 1B

---

## STEP 1B: Check & Fix Data Issues (if needed)

```sql
-- See what issues exist
SELECT * FROM public.reconcile_pending_rewards();
```

**If you see "orphaned_pending":**

```sql
-- Fix the orphaned reward
UPDATE pending_rewards pr
SET game_play_id = (
  SELECT gp.id 
  FROM game_plays gp
  WHERE gp.user_id = pr.user_id
    AND gp.created_at::date = pr.created_at::date
  ORDER BY gp.created_at DESC
  LIMIT 1
)
WHERE pr.game_play_id IS NULL
  AND pr.source = 'game_win'
  AND pr.status = 'pending';

-- Fix pending counts
SELECT public.fix_pending_counts();

-- Re-check
SELECT public.system_health_check();
```

---

## STEP 2: Verify Game Play Works (2 mins)

### **A. Play a Game:**

1. Go to: http://localhost:3000/games/scratch_card
2. Play the game
3. Win a prize

### **B. Check Database:**

```sql
-- Get your user ID first
SELECT id, email, name FROM users WHERE email = 'your@email.com';

-- Replace YOUR_USER_ID below with your actual ID

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
- ✅ `status = 'pending'` (if won something)
- ✅ `pending_reward_id` is NOT NULL (if won something)
- ✅ `prize_type` matches what you won

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
- ✅ `game_play_id` is NOT NULL (linked!)
- ✅ `amount` matches prize value
- ✅ `expires_at` is set (14 days from now)

```sql
-- Verify they're linked
SELECT 
  gp.id as game_play_id,
  gp.prize_type,
  gp.prize_value,
  gp.pending_reward_id,
  pr.id as pending_reward_id_check,
  pr.game_play_id as game_play_id_check,
  CASE 
    WHEN gp.pending_reward_id = pr.id AND pr.game_play_id = gp.id 
    THEN '✅ LINKED' 
    ELSE '❌ NOT LINKED' 
  END as link_status
FROM game_plays gp
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'YOUR_USER_ID'
ORDER BY gp.created_at DESC
LIMIT 1;
```

**Expected:**
- ✅ `link_status = '✅ LINKED'`

---

## STEP 3: Verify Dashboard Shows Pending (1 min)

### **A. Check Dashboard:**

1. Go to: http://localhost:3000/dashboard
2. Look at Points Card or Stamps Card

**Expected:**
- ✅ Shows "X Pending" (where X > 0)
- ✅ Shows "Check In Now" button
- ✅ Shows total preview

**Example:**
```
┌─────────────────────────────┐
│ Points                      │
├─────────────────────────────┤
│  150        5               │
│  Available  Pending    ← Should show!
├─────────────────────────────┤
│ You have 5 pending points!  │
│ Check in to claim them.     │
│ [Check In Now]              │
└─────────────────────────────┘
```

### **B. Verify in Database:**

```sql
-- Check user pending count
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
- ✅ `pending_rewards_count > 0`

---

## STEP 4: Verify No Orphaned Issues (30 sec)

```sql
-- Should return NO rows (or only old ones from before fix)
SELECT * FROM public.reconcile_pending_rewards()
WHERE issue_type = 'orphaned_pending';
```

**Expected:**
- ✅ Empty result (no orphaned pending rewards)
- ⚠️ If you see the old one from before (created_at before you restarted server), that's OK - it's from before the fix

---

## STEP 5: Test Check-In (Optional - 2 mins)

### **A. Perform Check-In:**

1. Go to: http://localhost:3000/check-in
2. Complete check-in

### **B. Verify in Database:**

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
LIMIT 3;
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
- ✅ `points` or `stamps` increased
- ✅ `pending_rewards_count = 0`

---

## 📊 COMPREHENSIVE VERIFICATION QUERIES

### **Get Your User ID:**
```sql
SELECT id, email, name, points, stamps, pending_rewards_count 
FROM users 
WHERE email = 'your@email.com';
```

### **See All Your Recent Activity:**
```sql
-- Replace YOUR_USER_ID
SELECT 
  gp.created_at,
  mg.display_name as game,
  gp.prize_type,
  gp.prize_value,
  gp.prize_label,
  gp.status as game_status,
  pr.status as pending_status,
  pr.claimed_at,
  CASE 
    WHEN gp.pending_reward_id IS NOT NULL AND pr.game_play_id IS NOT NULL 
    THEN '✅ Linked' 
    ELSE '❌ Not Linked' 
  END as link_status
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'YOUR_USER_ID'
ORDER BY gp.created_at DESC
LIMIT 10;
```

### **Check All Pending Rewards:**
```sql
SELECT 
  pr.created_at,
  pr.reward_name,
  pr.reward_type,
  pr.amount,
  pr.status,
  pr.game_play_id,
  EXTRACT(DAY FROM pr.expires_at - NOW()) as days_until_expiry,
  CASE 
    WHEN pr.game_play_id IS NOT NULL THEN '✅ Linked' 
    ELSE '❌ Orphaned' 
  END as link_status
FROM pending_rewards pr
WHERE pr.user_id = 'YOUR_USER_ID'
ORDER BY pr.created_at DESC
LIMIT 10;
```

### **System Overview:**
```sql
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
  'Games Played Today',
  COUNT(*)::text
FROM game_plays
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
  'Pending Rewards',
  COUNT(*)::text
FROM pending_rewards
WHERE status = 'pending'
UNION ALL
SELECT 
  'Data Issues',
  COUNT(*)::text
FROM reconcile_pending_rewards()
UNION ALL
SELECT 
  'Orphaned Pending',
  COUNT(*)::text
FROM reconcile_pending_rewards()
WHERE issue_type = 'orphaned_pending';
```

---

## ✅ SUCCESS CHECKLIST

Copy and check off as you verify:

```
VERIFICATION CHECKLIST:
[ ] System health check shows "healthy"
[ ] data_issues = 0
[ ] Played a game successfully
[ ] Game play logged in database
[ ] Pending reward created
[ ] Game play and pending reward are LINKED
[ ] pending_reward_id is set on game_play
[ ] game_play_id is set on pending_reward
[ ] Dashboard shows pending count
[ ] User pending_rewards_count is accurate
[ ] No orphaned pending rewards (for new plays)
[ ] All indexes created
[ ] All functions exist
```

---

## 🎯 QUICK VERIFICATION COMMANDS

**Copy/paste these (replace YOUR_USER_ID):**

```sql
-- 1. Health check
SELECT public.system_health_check();

-- 2. Check for issues
SELECT * FROM public.reconcile_pending_rewards();

-- 3. Your latest game play
SELECT * FROM game_plays 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 1;

-- 4. Your pending rewards
SELECT * FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID' 
  AND status = 'pending'
ORDER BY created_at DESC;

-- 5. Verify linking
SELECT 
  gp.id,
  gp.pending_reward_id,
  pr.id,
  pr.game_play_id,
  CASE 
    WHEN gp.pending_reward_id = pr.id AND pr.game_play_id = gp.id 
    THEN '✅ LINKED' 
    ELSE '❌ NOT LINKED' 
  END
FROM game_plays gp
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'YOUR_USER_ID'
ORDER BY gp.created_at DESC
LIMIT 1;
```

---

## 🐛 TROUBLESHOOTING

### **Issue: Dashboard doesn't show pending**

**Check:**
```sql
-- Do you have pending rewards?
SELECT * FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID' 
  AND status = 'pending';

-- Is your user count correct?
SELECT pending_rewards_count FROM users WHERE id = 'YOUR_USER_ID';
```

**Fix:**
```sql
SELECT public.fix_pending_counts();
```

### **Issue: Game play not creating pending**

**Check:**
1. Look at browser console (F12) for errors
2. Look at terminal logs for API errors
3. Check function exists:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'award_game_prize_pending';
```

### **Issue: Still seeing orphaned pending**

**Only for NEW game plays after restart:**

```sql
-- Check if it's an old one (before fix)
SELECT created_at FROM pending_rewards 
WHERE id IN (
  SELECT details->>'pending_reward_id' 
  FROM reconcile_pending_rewards() 
  WHERE issue_type = 'orphaned_pending'
);
```

If it's recent (after you restarted), the fix didn't apply. Re-run migration.

---

## 🎉 ALL GOOD?

**If all checks pass:**
- ✅ System is working perfectly!
- ✅ Pending rewards system is robust
- ✅ Ready for production!

**Next steps:**
- Monitor for 24 hours
- Test with multiple users
- Consider Phase 2 improvements

**Great work!** 🚀
