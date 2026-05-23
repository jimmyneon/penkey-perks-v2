# Customer Insights - Detailed Explanation

## What Each Stat Shows

### 1. 📊 **Total Customers**
**What it is:** Total number of registered customer accounts

**Database Query:**
```typescript
const { count: totalCustomers } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('role', 'customer')
```

**What it pulls:**
- Counts ALL rows in `users` table where `role = 'customer'`
- This is your total customer base (everyone who signed up)

**Example:** If you have 150 people who created accounts, this shows 150

---

### 2. 📈 **Active Customers (30 days)**
**What it is:** Number of UNIQUE customers who checked in at least once in the last 30 days

**Database Query:**
```typescript
const { data: activeCheckIns } = await supabase
  .from('check_ins')
  .select('user_id')
  .gte('created_at', thirtyDaysAgo.toISOString())

const uniqueUserIds = new Set(activeCheckIns?.map(c => c.user_id) || [])
const uniqueActive = uniqueUserIds.size
```

**What it pulls:**
- Gets ALL check-ins from last 30 days
- Extracts the `user_id` from each check-in
- Uses JavaScript `Set()` to count only UNIQUE user IDs
- Shows how many customers are actively using your app

**Example:** 
- If 50 different customers checked in last month → shows 50
- If 1 customer checked in 20 times → still counts as 1

**Why this matters:** Shows customer retention and engagement

---

### 3. ✅ **Check-ins Today**
**What it is:** Total number of check-ins since midnight today

**Database Query:**
```typescript
const { count: checkInsToday } = await supabase
  .from('check_ins')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', today.toISOString())
```

**What it pulls:**
- Counts ALL rows in `check_ins` table created today
- Resets at midnight
- Shows daily foot traffic

**Example:** If 30 customers checked in today → shows 30

---

### 4. ☕ **Stamps Today**
**What it is:** Number of coffee stamps given out today

**Database Query:**
```typescript
const { count: stampsToday } = await supabase
  .from('coffee_stamps')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', today.toISOString())
```

**What it pulls:**
- Counts ALL rows in `coffee_stamps` table created today
- Shows how many coffees were purchased today
- Resets at midnight

**Example:** If staff gave out 45 stamps today → shows 45

---

### 5. ✨ **Total Points**
**What it is:** All-time total points awarded across ALL customers

**Database Query:**
```typescript
const { data: totalPointsData } = await supabase
  .rpc('get_total_points_awarded')
```

**What the function does:**
```sql
CREATE FUNCTION get_total_points_awarded()
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM points_transactions
  WHERE amount > 0;
$$
```

**What it pulls:**
- Sums ALL positive amounts from `points_transactions` table
- Shows total points ever awarded (lifetime)
- Grows over time, never decreases

**Example:** If you've awarded 15,000 points total since launch → shows 15,000

**Note:** You need to run `ADD_TOTAL_POINTS_FUNCTION.sql` for this to work!

---

### 6. 🎁 **Pending Rewards**
**What it is:** Number of active rewards waiting to be redeemed

**Database Query:**
```typescript
const { count: pendingRewards } = await supabase
  .from('user_rewards')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active')
```

**What it pulls:**
- Counts ALL rows in `user_rewards` where `status = 'active'`
- These are rewards customers earned but haven't redeemed yet
- Includes: free coffees, point rewards, etc.

**Example:** If 12 customers have unredeemed rewards → shows 12

---

## How to Verify Data is Pulling Correctly

### Check Your Terminal Logs
When you load the staff dashboard, look for:
```
📊 Staff Dashboard Stats: {
  totalCustomers: '5 users with role=customer',
  activeCustomers: '3 unique users who checked in last 30 days',
  checkInsToday: '2 check-ins since midnight',
  stampsToday: '1 coffee stamps given today',
  totalPoints: '150 total points awarded all-time',
  pendingRewards: '4 active rewards waiting to redeem'
}
```

### Manual Database Check
Run these queries in Supabase SQL Editor:

```sql
-- 1. Total Customers
SELECT COUNT(*) FROM users WHERE role = 'customer';

-- 2. Active Customers (30 days)
SELECT COUNT(DISTINCT user_id) 
FROM check_ins 
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 3. Check-ins Today
SELECT COUNT(*) 
FROM check_ins 
WHERE created_at >= CURRENT_DATE;

-- 4. Stamps Today
SELECT COUNT(*) 
FROM coffee_stamps 
WHERE created_at >= CURRENT_DATE;

-- 5. Total Points
SELECT COALESCE(SUM(amount), 0) 
FROM points_transactions 
WHERE amount > 0;

-- 6. Pending Rewards
SELECT COUNT(*) 
FROM user_rewards 
WHERE status = 'active';
```

---

## Common Issues

### If Total Points shows 0:
- Run `ADD_TOTAL_POINTS_FUNCTION.sql` in Supabase
- The RPC function might not exist yet

### If Active Customers seems wrong:
- Check if `check_ins` table has data
- Verify dates are within last 30 days

### If everything shows 0:
- Database might be empty (no customers yet)
- Check RLS policies aren't blocking queries
- Verify staff user has proper permissions

---

## Summary

These stats give you a real-time view of:
- **Business Health:** Total customers, active users
- **Daily Operations:** Today's check-ins and stamps
- **Engagement:** Total points awarded, pending rewards

All data is pulled directly from your Supabase database tables!
