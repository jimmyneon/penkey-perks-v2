# 🧪 Beans System Testing Guide

## Quick Testing Checklist

### ✅ Step 2: Test Signup Flow

**Create a test user:**

```sql
-- In Supabase SQL Editor:
INSERT INTO public.users (email, name)
VALUES ('test-beans-' || gen_random_uuid() || '@test.com', 'Test User')
RETURNING id, email, name;
```

**Verify pending rewards created:**

```sql
-- Check pending rewards for the test user (use ID from above)
SELECT 
  reward_type,
  amount,
  reward_name,
  reward_description,
  status,
  expires_at
FROM public.pending_rewards
WHERE user_id = 'YOUR_TEST_USER_ID_HERE'
ORDER BY created_at DESC;
```

**Expected results:**
- ✅ 2 pending rewards
- ✅ 1x "points" reward: 250 beans
- ✅ 1x "voucher" reward: Free Coffee

---

### ✅ Step 3: Test Check-in and Pending Rewards

**Simulate a check-in:**

```sql
-- Claim pending rewards (simulates check-in)
SELECT public.claim_pending_rewards('YOUR_TEST_USER_ID_HERE');
```

**Verify rewards were claimed:**

```sql
-- Check user's bean balance
SELECT public.get_user_points('YOUR_TEST_USER_ID_HERE') as beans;

-- Check pending rewards status
SELECT 
  reward_type,
  amount,
  status,
  claimed_at
FROM public.pending_rewards
WHERE user_id = 'YOUR_TEST_USER_ID_HERE';

-- Check transactions
SELECT 
  amount,
  source,
  description,
  balance_after
FROM public.points_transactions
WHERE user_id = 'YOUR_TEST_USER_ID_HERE'
ORDER BY created_at DESC;
```

**Expected results:**
- ✅ User has 250 beans
- ✅ Pending rewards status = 'claimed'
- ✅ Transaction shows +250 beans from signup bonus

---

## 🎨 Step 4: Update Frontend UI

Now let's update the remaining UI components to use "beans"!

### Priority Files to Update

I can help you update these now:

1. **`/app/rewards/page.tsx`** - Rewards catalog
2. **`/app/dashboard/page.tsx`** - Main dashboard  
3. **`/app/admin/points-config/page.tsx`** - Admin panel

---

## 📝 Manual Testing (After UI Updates)

### Test in Browser

1. **Signup Flow:**
   - Create new account
   - Check dashboard → should see "You have 2 pending rewards"
   - Should see 250 beans + free coffee pending

2. **Check-in Flow:**
   - Go to check-in page
   - Check in (with GPS)
   - Pending rewards should unlock
   - Should see 250 beans available

3. **Rewards Page:**
   - View rewards catalog
   - Costs should show in beans (1,500, 4,000, 8,000, etc.)
   - Progress bars should show beans needed

4. **Admin Panel:**
   - View points config
   - Should show beans amounts (250, 50, 200, etc.)
   - Edit config → should work with new values

---

## 🐛 Common Issues & Fixes

### Issue: Pending rewards not showing
**Check:**
```sql
SELECT * FROM public.pending_rewards 
WHERE user_id = 'USER_ID' AND status = 'pending';
```

### Issue: Beans not awarded on signup
**Check:**
```sql
-- Verify trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_user_signup_bonus';

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'award_signup_bonus';
```

### Issue: Check-in not claiming rewards
**Check:**
```sql
-- Test claim function directly
SELECT public.claim_pending_rewards('USER_ID');
```

---

## ✅ Testing Complete Checklist

- [ ] New user gets 250 beans + coffee (pending)
- [ ] Check-in claims pending rewards
- [ ] Beans display correctly in UI
- [ ] Rewards show correct costs
- [ ] Admin panel shows beans
- [ ] Mobile view works
- [ ] Bean emoji displays correctly

---

**Ready to update the UI? Let me know and I'll update the components!** 🫘
