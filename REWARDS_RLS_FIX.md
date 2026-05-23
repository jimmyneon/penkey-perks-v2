# Rewards Redemption RLS Fix

## Issue
Users were unable to redeem rewards from the `/rewards` page. The error was:
```
Error creating user reward: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "user_rewards"'
}
```

## Root Cause
The `user_rewards` table had Row Level Security (RLS) enabled but was missing the INSERT policy that allows users to create their own reward records when redeeming.

## Solution
Created migration `20251010_fix_user_rewards_rls.sql` that:

### 1. Rewards Table (Catalog)
- ✅ Enabled RLS
- ✅ Added policy: "Anyone can view active rewards" - allows all users to see available rewards
- ✅ Added policy: "Admins can manage rewards catalog" - allows admins to manage the catalog

### 2. User_Rewards Table (User's Redeemed Rewards)
- ✅ Enabled RLS
- ✅ Added policy: "Users can view own rewards" - users can see their own redeemed rewards
- ✅ Added policy: "Users can insert own rewards" - **KEY FIX** - allows users to redeem rewards
- ✅ Added policy: "Users can update own rewards" - allows users to update their rewards
- ✅ Added policy: "Staff can redeem rewards" - allows staff to mark rewards as redeemed
- ✅ Added policy: "Admins can manage all rewards" - allows admins full access

## Testing Steps
1. Apply the migration to your Supabase database
2. Navigate to `http://localhost:3000/rewards`
3. Try to redeem a reward by clicking "Yes, Redeem"
4. Verify that:
   - The redemption succeeds
   - Points are deducted
   - The reward appears in your "Your Rewards" section
   - A QR code is generated

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Open the file `APPLY_THIS_NOW.sql` from your project root
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Check the results - you should see a success message
8. Refresh your `/rewards` page

### Option 2: Via Supabase CLI
```bash
# Link your project first (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Option 3: Direct SQL
```bash
psql $DATABASE_URL -f supabase/migrations/20251010_fix_user_rewards_rls.sql
```

## Related Files
- `/app/api/rewards/redeem/route.ts` - API endpoint for redemption
- `/app/rewards/page.tsx` - Rewards page
- `/supabase/migrations/20251010_fix_user_rewards_rls.sql` - The fix migration
