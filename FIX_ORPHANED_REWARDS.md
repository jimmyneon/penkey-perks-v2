# Fix Orphaned Reward Redemptions

## Problem
Points are being deducted from `points_transactions` for reward redemptions, but no corresponding entries are being created in `user_rewards`. This causes redeemed rewards to not show up for customers.

## Root Cause
The `user_rewards` table either:
1. Doesn't exist in the database
2. Has incorrect RLS policies preventing inserts
3. Has a structural issue preventing the INSERT from succeeding

## Solution

### Step 1: Run Diagnostic
First, check the current state of the database:

```bash
# In Supabase SQL Editor, run:
cat DIAGNOSE_REWARD_ISSUE.sql
```

This will show:
- All reward redemption transactions
- Orphaned redemptions (transactions without user_rewards)
- Table structure and RLS policies
- Affected rewards

### Step 2: Apply the Fix
Run the migration to create the table and fix orphaned entries:

```bash
# Apply the migration
supabase db push
```

Or manually in Supabase SQL Editor:
```sql
-- Run the entire migration file
\i supabase/migrations/20251010_create_user_rewards_and_fix_orphans.sql
```

### Step 3: Verify the Fix
After applying the migration, run the diagnostic again to confirm:

```sql
-- Check if any orphaned transactions remain
SELECT 
  pt.id as transaction_id,
  pt.user_id,
  pt.amount,
  pt.created_at,
  pt.description,
  pt.metadata->>'reward_id' as reward_id,
  u.name as user_name
FROM points_transactions pt
JOIN users u ON pt.user_id = u.id
LEFT JOIN user_rewards ur ON (
  ur.user_id = pt.user_id 
  AND ur.reward_id::text = pt.metadata->>'reward_id'
  AND ur.created_at >= pt.created_at - INTERVAL '5 minutes'
  AND ur.created_at <= pt.created_at + INTERVAL '5 minutes'
)
WHERE pt.source = 'reward_redemption'
  AND pt.amount < 0
  AND ur.id IS NULL;
```

Should return 0 rows if successful.

### Step 4: Test New Redemptions
Test that new reward redemptions work correctly:

1. Log in as a customer with enough points
2. Redeem a reward
3. Check that:
   - Points are deducted (entry in `points_transactions`)
   - User reward is created (entry in `user_rewards`)
   - Reward shows up in customer's rewards list

## What the Migration Does

1. **Creates `user_rewards` table** with proper structure:
   - Links to users and rewards tables
   - Includes QR code, status, expiry
   - Has proper indexes

2. **Sets up RLS policies**:
   - Users can view/insert/update their own rewards
   - Staff can redeem rewards
   - Admins have full access

3. **Fixes orphaned redemptions**:
   - Finds all reward redemption transactions without user_rewards
   - Creates missing user_rewards entries
   - Generates QR codes and sets expiry dates
   - Reports any errors

## Prevention
The migration ensures this won't happen again by:
- Creating the table with proper structure
- Setting up correct RLS policies
- Allowing users to insert their own rewards during redemption

## Manual Fix (If Migration Fails)
If the migration fails, you can manually fix individual cases:

```sql
-- For a specific transaction
INSERT INTO user_rewards (user_id, reward_id, qr_code, status, expires_at, created_at)
SELECT 
  pt.user_id,
  (pt.metadata->>'reward_id')::UUID,
  'REWARD-' || EXTRACT(EPOCH FROM pt.created_at)::BIGINT || '-' || substr(md5(random()::text), 1, 8),
  'active',
  pt.created_at + INTERVAL '30 days',
  pt.created_at
FROM points_transactions pt
WHERE pt.id = 'TRANSACTION_ID_HERE';
```
