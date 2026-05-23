# 🏗️ SYSTEM ARCHITECTURE NOTES

## 📊 POINTS & REWARDS SYSTEM - HOW IT WORKS

### **CRITICAL: Points are NOT stored on users table!**

The `users` table does NOT have `points` or `stamps` columns. Points are calculated from transactions.

---

## 🗄️ DATABASE SCHEMA

### **1. Points Tracking**

**Table: `points_transactions`**
```sql
- id (uuid)
- user_id (uuid)
- amount (integer) - Can be positive or negative
- balance_after (integer) - Running total
- source (text) - 'game_prize', 'manual_award', 'pending_claim', etc.
- description (text)
- metadata (jsonb)
- created_at (timestamp)
```

**How it works:**
- Each transaction records the amount and the balance AFTER that transaction
- Current balance = latest `balance_after` value
- No `points` column on users table!

### **2. Pending Rewards**

**Table: `pending_rewards`**
```sql
- id (uuid)
- user_id (uuid)
- reward_type (text) - 'points', 'stamps', 'voucher'
- amount (integer)
- reward_name (text)
- status (text) - 'pending', 'claimed', 'expired'
- claimed_at (timestamp)
- expires_at (timestamp)
- game_play_id (uuid) - Links to game_plays
- source (text) - 'game_win', 'manual', etc.
```

**IMPORTANT:**
- ❌ NO `claimed` boolean column
- ✅ Use `status = 'pending'` to check if unclaimed
- ✅ Use `claimed_at IS NULL` as backup check

### **3. Game Plays**

**Table: `game_plays`**
```sql
- id (uuid)
- user_id (uuid)
- game_id (uuid)
- prize_type (text) - 'points', 'stamps', 'reward', 'nothing'
- prize_value (integer)
- prize_label (text)
- status (text) - 'pending', 'claimed', 'expired'
- pending_reward_id (uuid) - Links to pending_rewards
- transaction_id (uuid) - Links to points_transactions
- created_at (timestamp)
```

### **4. Users Table**

**Table: `users`**
```sql
- id (uuid)
- name (text)
- email (text)
- pending_rewards_count (integer) - Count of unclaimed rewards
- check_in_streak (integer)
- last_check_in (timestamp)
- ... other fields
```

**IMPORTANT:**
- ❌ NO `points` column
- ❌ NO `stamps` column
- ✅ Only `pending_rewards_count` for quick lookup

---

## 🔄 WORKFLOW: GAME PLAY TO POINTS

### **Step 1: User Plays Game**

1. API: `/api/games/play`
2. Creates `game_plays` entry with `status = 'pending'`
3. Calls `award_game_prize_pending()` function
4. Function creates `pending_rewards` entry
5. Function increments `users.pending_rewards_count`
6. Returns `isPending: true` to frontend

### **Step 2: User Checks In**

1. API: `/api/check-in/route.ts`
2. Calls `claim_pending_rewards()` function
3. Function loops through all pending rewards
4. For each reward:
   - Calls `add_points()` function
   - `add_points()` creates `points_transactions` entry
   - Marks `pending_rewards.status = 'claimed'`
   - Sets `pending_rewards.claimed_at = NOW()`
5. Updates `users.pending_rewards_count = 0`

### **Step 3: Points Are Available**

1. Dashboard fetches latest `points_transactions.balance_after`
2. Displays as "Available" balance
3. User can spend on rewards

---

## 🎯 KEY FUNCTIONS

### **1. `award_game_prize_pending()`**
- Creates pending reward
- Links to game_play
- Increments user pending count
- Returns pending_id

### **2. `claim_pending_rewards()`**
- Loops through all pending
- Calls `add_points()` for points
- Adds stamps to `coffee_stamps` table
- Activates vouchers in `user_rewards`
- Marks all as claimed

### **3. `add_points()`**
- Gets current balance from `get_user_points()`
- Calculates new balance
- Creates `points_transactions` entry
- Returns new balance

### **4. `get_user_points()`**
- Queries latest `balance_after` from `points_transactions`
- Returns current balance

---

## 🐛 COMMON BUGS & FIXES

### **Bug 1: Dashboard shows 0 pending**

**Cause:** Code checks `claimed = false` but column doesn't exist

**Fix:** Change to `status = 'pending'`

```typescript
// ❌ WRONG
.eq('claimed', false)

// ✅ CORRECT
.eq('status', 'pending')
```

### **Bug 2: Points not updating after check-in**

**Cause:** `add_points()` function not called or failing

**Fix:** Check `claim_pending_rewards()` calls `add_points()` for points type

### **Bug 3: Orphaned pending rewards**

**Cause:** `game_plays` and `pending_rewards` not linked

**Fix:** Ensure both have linking IDs:
- `game_plays.pending_reward_id` → `pending_rewards.id`
- `pending_rewards.game_play_id` → `game_plays.id`

### **Bug 4: RLS policy blocking inserts**

**Cause:** Missing INSERT policy on `game_plays`

**Fix:** Add policy:
```sql
CREATE POLICY "Users can insert own game plays"
  ON public.game_plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 📝 FRONTEND INTEGRATION

### **Dashboard - Points Card**

```typescript
// Get current balance from points_transactions
const { data: transactions } = await supabase
  .from('points_transactions')
  .select('balance_after')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)

const currentPoints = transactions?.[0]?.balance_after || 0

// Get pending points
const { data: pending } = await supabase
  .from('pending_rewards')
  .select('amount')
  .eq('user_id', user.id)
  .eq('reward_type', 'points')
  .eq('status', 'pending')  // ✅ CRITICAL: Use status, not claimed

const pendingPoints = pending?.reduce((sum, r) => sum + r.amount, 0) || 0
```

### **Game Page - Show Pending Message**

```typescript
// After game play API call
if (data.isPending) {
  // Show GamePrizePending component
  <GamePrizePending 
    isPending={true}
    prizeLabel={data.prize.label}
    prizeType={data.prize.type}
    prizeValue={data.prize.value}
  />
}
```

---

## 🔍 DEBUGGING QUERIES

### **Check User's Current State**

```sql
-- Get user info
SELECT 
  id,
  name,
  pending_rewards_count
FROM users 
WHERE id = 'USER_ID';

-- Get current balance
SELECT balance_after as current_balance
FROM points_transactions
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Get pending rewards
SELECT 
  reward_type,
  amount,
  status,
  created_at
FROM pending_rewards
WHERE user_id = 'USER_ID'
  AND status = 'pending'
ORDER BY created_at DESC;

-- Get recent game plays
SELECT 
  gp.created_at,
  mg.display_name,
  gp.prize_value,
  gp.status,
  gp.pending_reward_id
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
WHERE gp.user_id = 'USER_ID'
ORDER BY gp.created_at DESC
LIMIT 5;
```

### **Verify Linking**

```sql
-- Check if game plays are linked to pending rewards
SELECT 
  gp.id as game_play_id,
  gp.pending_reward_id,
  pr.id as pending_id,
  pr.game_play_id,
  CASE 
    WHEN gp.pending_reward_id = pr.id AND pr.game_play_id = gp.id 
    THEN '✅ LINKED' 
    ELSE '❌ NOT LINKED' 
  END as status
FROM game_plays gp
LEFT JOIN pending_rewards pr ON pr.id = gp.pending_reward_id
WHERE gp.user_id = 'USER_ID'
ORDER BY gp.created_at DESC
LIMIT 5;
```

---

## ⚠️ CRITICAL REMINDERS

1. **NEVER query `users.points`** - Column doesn't exist!
2. **ALWAYS use `status = 'pending'`** - NOT `claimed = false`
3. **Balance comes from `points_transactions.balance_after`**
4. **Pending count is just a cache** - Actual source is `pending_rewards` table
5. **Game plays create pending** - Check-in claims them
6. **`add_points()` creates transactions** - This is how points get added

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────┐
│  Game Play  │
└──────┬──────┘
       │
       ├──> game_plays (status: pending)
       │
       └──> pending_rewards (status: pending)
                │
                │ User checks in
                ↓
       ┌────────────────┐
       │ claim_pending  │
       │   _rewards()   │
       └────────┬───────┘
                │
                ├──> add_points()
                │       │
                │       └──> points_transactions (balance_after)
                │
                └──> pending_rewards (status: claimed)
```

---

## 🎯 TESTING CHECKLIST

- [ ] Play game → pending_rewards created
- [ ] Dashboard shows pending count
- [ ] Check-in → points_transactions created
- [ ] Dashboard shows updated balance
- [ ] pending_rewards marked as claimed
- [ ] pending_rewards_count reset to 0
- [ ] Game plays linked to pending rewards
- [ ] No orphaned records

---

## 📚 RELATED FILES

**Migrations:**
- `20251011_phase1_critical_fixes.sql` - Table structures
- `20251011_fix_pending_rewards_function.sql` - Bug fix
- `20251011_add_prize_label_column.sql` - Missing column
- `20251011_fix_game_plays_rls.sql` - RLS policies

**Components:**
- `components/dashboard/points-card.tsx` - Shows available & pending
- `components/game-prize-pending.tsx` - Shows pending message
- `app/api/games/play/route.ts` - Creates pending rewards
- `app/api/check-in/route.ts` - Claims pending rewards

**Functions:**
- `award_game_prize_pending()` - Creates pending
- `claim_pending_rewards()` - Claims pending
- `add_points()` - Adds to transactions
- `get_user_points()` - Gets current balance

---

## 🎉 SYSTEM IS WORKING!

**Last verified:** October 11, 2025

**Status:** ✅ Production Ready

**Known Issues:** None

**Pending Improvements:**
- Add materialized views for faster dashboard
- Add analytics tracking
- Add cron jobs for automated tasks

---

**Remember:** Points are transactions, not columns! 🎯
