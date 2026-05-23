# 🔍 Signup Beans in Transaction History - Verification Report

## ✅ Current Implementation Status

### Database Trigger (`handle_new_user`)
**Location:** `supabase/migrations/20251013_add_free_coffee_on_signup.sql`

The signup bonus is automatically awarded via a database trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_free_coffee_reward_id UUID;
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  RETURNING id INTO v_user_id;
  
  -- Award signup bonus (250 beans)
  PERFORM public.add_points(
    v_user_id,
    250,
    'signup',
    'Welcome bonus for new account'
  );
  
  -- Award free coffee reward...
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Key Points:**
- ✅ Awards **250 beans** on signup
- ✅ Uses source type `'signup'`
- ✅ Description: `'Welcome bonus for new account'`
- ✅ Also awards a free coffee reward
- ✅ Calls `add_points()` function which creates a transaction record

---

## 📊 Transaction History Page

**Location:** `app/points/history/page.tsx`

The history page correctly displays all transactions including signup:

```tsx
// Fetches all transactions for the user
const { data: transactions } = await supabase
  .from('points_transactions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50)
```

**Display Logic:**
- Shows transaction description OR source
- Shows amount with +/- prefix
- Shows date/time formatted
- Shows source type (capitalized)
- Green icon for positive amounts (like signup bonus)

**Example Display:**
```
🟢 Welcome bonus for new account
   13 Oct 2025, 09:15
   +250 beans
   Signup
```

---

## 🔍 Verification Steps

### 1. Run the Verification Query
Execute the query in `CHECK_SIGNUP_BEANS_HISTORY.sql` to verify:

```bash
# In Supabase SQL Editor or via CLI
psql $DATABASE_URL -f CHECK_SIGNUP_BEANS_HISTORY.sql
```

This will check:
- ✅ `handle_new_user` function exists
- ✅ Recent signup transactions exist
- ✅ `'signup'` is in allowed sources constraint
- ✅ All recent users have signup transactions
- ✅ Points config has correct signup amount (250 beans)

### 2. Test with a New User
1. Create a new user account
2. Log in as that user
3. Navigate to `/points/history`
4. Verify you see:
   - Current balance: **250 beans**
   - Transaction: **+250 beans** from "Welcome bonus for new account"
   - Source: **signup**

### 3. Check Existing Users
For users created after Oct 13, 2025, they should have:
- A signup transaction with 250 beans
- A free coffee reward in their rewards list

---

## ⚠️ Potential Issues to Check

### Issue 1: Missing Signup Transactions for Old Users
**Symptom:** Users created before the migration don't have signup transactions

**Solution:** The migration `20251010_fix_signup_and_checkin.sql` includes a backfill:
```sql
-- Backfills users from last 30 days only
-- Users older than 30 days won't have signup transactions
```

**Action:** If you want to backfill older users, run:
```sql
-- Award signup bonus to users without one
INSERT INTO public.points_transactions (user_id, amount, balance_after, source, description)
SELECT 
  u.id,
  250,
  250 + COALESCE((SELECT SUM(amount) FROM points_transactions WHERE user_id = u.id), 0),
  'signup',
  'Retroactive welcome bonus'
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.points_transactions pt
  WHERE pt.user_id = u.id AND pt.source = 'signup'
);
```

### Issue 2: Source Constraint Error
**Symptom:** Error when creating signup transaction: "violates check constraint"

**Check:** Verify 'signup' is in the allowed sources:
```sql
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname LIKE '%points_transactions_source%';
```

**Fix:** Already applied in migration `20251010_fix_signup_and_checkin.sql`

### Issue 3: Transaction Not Showing in UI
**Symptom:** Transaction exists in database but not visible in UI

**Check:**
1. Verify RLS policies allow user to see their own transactions
2. Check if transaction has correct user_id
3. Verify the page is fetching from correct table

---

## 🎯 Expected Behavior

### For New Users (After Oct 13, 2025)
When a user signs up:
1. ✅ User profile created in `users` table
2. ✅ Transaction created in `points_transactions`:
   - amount: `250`
   - source: `'signup'`
   - description: `'Welcome bonus for new account'`
3. ✅ Free coffee reward added to `user_rewards`
4. ✅ Transaction visible in `/points/history`
5. ✅ Balance shows `250 beans` on dashboard

### Transaction History Display
- ✅ Shows in chronological order (newest first)
- ✅ Green icon with up arrow for positive amounts
- ✅ Shows "+250" in green text
- ✅ Shows "Welcome bonus for new account" as description
- ✅ Shows "signup" as source type
- ✅ Shows date and time of signup

---

## 🧪 Quick Test Commands

### Check if signup transactions exist
```sql
SELECT COUNT(*) as signup_count
FROM public.points_transactions
WHERE source = 'signup';
```

### Check recent signups
```sql
SELECT 
  u.email,
  u.created_at as user_created,
  pt.amount as beans_awarded,
  pt.created_at as transaction_created
FROM public.users u
LEFT JOIN public.points_transactions pt ON u.id = pt.user_id AND pt.source = 'signup'
WHERE u.created_at >= NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;
```

### Check a specific user's history
```sql
SELECT 
  amount,
  source,
  description,
  created_at
FROM public.points_transactions
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC;
```

---

## ✅ Conclusion

**The signup beans SHOULD be showing in transaction history** because:

1. ✅ The `handle_new_user()` trigger correctly calls `add_points()` with source='signup'
2. ✅ The `add_points()` function creates a record in `points_transactions`
3. ✅ The history page queries `points_transactions` and displays all transactions
4. ✅ The source 'signup' is in the allowed constraint values
5. ✅ The UI correctly formats and displays positive transactions

**If signup beans are NOT showing:**
- Run the verification query in `CHECK_SIGNUP_BEANS_HISTORY.sql`
- Check if the user was created before the migration (Oct 13, 2025)
- Verify the trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Check for any errors in the Supabase logs during user creation

**Next Steps:**
1. Run the verification query
2. Test with a new user signup
3. Check the Supabase dashboard logs for any trigger errors
4. If issues found, review the specific error messages
