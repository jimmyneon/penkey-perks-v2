# Fix: Rewards Not Displaying in "My Rewards"

## Problem
Rewards exist in the database but aren't showing up in the "My Rewards" tab on the rewards page.

## Root Causes
1. **Missing `value` column** in `rewards` table
2. **Nested query returning unexpected format** - Supabase's `rewards (*)` syntax might return null or array
3. **Type mismatch** between database and frontend expectations

## Solution Steps

### Step 1: Ensure Rewards Table Structure
Run this migration to ensure all columns exist:

```bash
# Apply the migration
supabase db push
```

Or in Supabase SQL Editor:
```sql
-- Copy and paste content from:
supabase/migrations/20251010_ensure_rewards_table_structure.sql
```

### Step 2: Verify Data
Run the debug script to check the data:

```sql
-- Copy and paste content from:
DEBUG_USER_REWARDS_DISPLAY.sql
```

Replace `'a409b642-e4e9-4159-a47c-c8a14b9bc903'` with your actual user_id.

### Step 3: Check Query Results
The query should return data like:
```json
{
  "id": "...",
  "user_id": "...",
  "reward_id": "...",
  "status": "active",
  "qr_code": "REWARD-...",
  "rewards": {
    "id": "...",
    "name": "20% Off",
    "description": "...",
    "type": "discount",
    "value": "20% Off"
  }
}
```

### Step 4: Fix the Frontend (if needed)
If the query returns `rewards` as an array instead of object, we need to update the component.

## Quick Test
After applying the migration, test in browser:

1. Go to `/rewards`
2. Click on "My Rewards" tab
3. You should see your active rewards
4. Click "Show QR Code" to verify it works

## If Still Not Working

### Check Browser Console
Open browser DevTools (F12) and check for errors in the Console tab.

### Check Network Tab
1. Open DevTools → Network tab
2. Refresh the page
3. Look for the request to `/rewards`
4. Check the response data structure

### Manual Fix in Code
If the nested query isn't working, we can modify the page to use a manual JOIN:

```typescript
// In app/rewards/page.tsx, replace lines 27-35 with:
const { data: userRewardsRaw } = await supabase
  .from('user_rewards')
  .select('*')
  .eq('user_id', user.id)
  .in('status', ['active', 'redeemed'])
  .order('created_at', { ascending: false })

const { data: rewardsData } = await supabase
  .from('rewards')
  .select('*')

const userRewards = userRewardsRaw?.map(ur => ({
  ...ur,
  rewards: rewardsData?.find(r => r.id === ur.reward_id)
})) || []
```

This manually joins the data in JavaScript instead of relying on Supabase's nested query.
