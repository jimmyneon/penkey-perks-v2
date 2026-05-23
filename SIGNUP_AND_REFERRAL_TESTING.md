# 🧪 Signup Bonus & Referral Testing Guide

## 📋 Prerequisites

**Run these migrations in Supabase SQL Editor first:**
1. `20251015_fix_referrals_and_onboarding.sql` - Creates referrals table
2. `20251015_restrict_promos_for_new_customers.sql` - Restricts promos for new users

---

## 1️⃣ Test Signup Bonus (250 Beans + Free Coffee)

### **Test Steps:**

1. **Open incognito/private browser window**
2. **Go to your app**: `https://rewards.penkey.co.uk`
3. **Sign up** with a new email or Google OAuth
4. **Complete onboarding** (enter name, phone, etc.)
5. **Check dashboard**

### **Expected Results:**

✅ **Dashboard shows:**
- 250 beans in balance
- "Free Coffee" in My Rewards section
- Welcome message

### **Verify in Database:**

```sql
-- Replace [NEW_USER_ID] with the actual UUID

-- Check signup bonus was awarded
SELECT * FROM points_transactions 
WHERE user_id = '[NEW_USER_ID]' 
  AND source = 'signup'
  AND amount = 250;

-- Check free coffee was awarded
SELECT * FROM user_rewards 
WHERE user_id = '[NEW_USER_ID]' 
  AND reward_name = 'Free Coffee'
  AND status = 'active';
```

### **If It Doesn't Work:**

Check if the `handle_new_user` trigger is running:
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check Supabase logs for errors
-- Go to: Supabase Dashboard → Logs → Postgres Logs
```

---

## 2️⃣ Test Referral System

### **Setup:**
- **User A**: Existing user (you)
- **User B**: New user (test account in incognito)

### **Test Steps:**

#### **Step 1: User A Gets Referral Link**
1. Log in as User A
2. Go to **Referrals** page
3. Copy referral link or show QR code
4. Note User A's current bean balance

#### **Step 2: User B Signs Up**
1. Open **incognito browser**
2. Paste referral link (or scan QR)
3. Sign up with new email
4. Complete onboarding

#### **Step 3: Check User A Got 50 Beans**
1. Go back to User A's browser
2. Refresh dashboard
3. Check bean balance increased by 50

#### **Step 4: User B Checks In**
1. As User B, go to Penkey café
2. Check in (or simulate check-in)
3. Complete first visit

#### **Step 5: Check User A Got +50 Beans**
1. Go back to User A's browser
2. Refresh dashboard
3. Check bean balance increased by another 50 (100 total from this referral)

### **Expected Results:**

✅ **User A (Referrer):**
- Gets 50 beans immediately when User B signs up
- Gets +50 beans when User B checks in (100 total)
- Referrals page shows: Total = 1, Confirmed = 1, Pending = 0

✅ **User B (Referred):**
- Gets normal signup bonus (250 beans + free coffee)
- Sees "Referral Applied!" toast notification
- Can check in normally

### **Verify in Database:**

```sql
-- Check referral was created
SELECT * FROM referrals 
WHERE referrer_id = '[USER_A_ID]' 
  AND referred_id = '[USER_B_ID]';
-- Should show: confirmed = false initially

-- Check User A got 50 beans on signup
SELECT * FROM points_transactions 
WHERE user_id = '[USER_A_ID]' 
  AND source = 'referral'
  AND amount = 50
ORDER BY created_at DESC 
LIMIT 1;

-- After User B checks in:

-- Check referral is now confirmed
SELECT * FROM referrals 
WHERE referred_id = '[USER_B_ID]';
-- Should show: confirmed = true, confirmed_at = [timestamp]

-- Check User A got +50 beans on confirmation
SELECT * FROM points_transactions 
WHERE user_id = '[USER_A_ID]' 
  AND source = 'referral_confirmed'
  AND amount = 50
ORDER BY created_at DESC 
LIMIT 1;
```

### **Referral Stats Explained:**

| Stat | Meaning |
|------|---------|
| **Total** | All people who signed up with your link |
| **Confirmed** | Referred users who checked in at least once |
| **Pending** | Signed up but haven't checked in yet |

---

## 3️⃣ Test Promotional Offers (Staff Created)

### **Important Rule:**
🚫 **New customers (< 24 hours old) CANNOT see or redeem promotional offers**
✅ **Only existing customers (> 24 hours old) can access them**

### **Test Steps:**

#### **Test 1: New Customer Can't See Offers**

1. **Create a promotional offer** (as staff)
2. **Sign up as new customer** (incognito)
3. **Check dashboard/offers page**

**Expected:** No promotional offers shown

#### **Test 2: Existing Customer Can See Offers**

1. **Use account > 24 hours old**
2. **Check dashboard/offers page**

**Expected:** Promotional offers are visible

#### **Test 3: New Customer Tries to Redeem**

1. **Get offer ID** from database
2. **Try to redeem** (via API or direct)

**Expected Error:**
```
"Promotional offers are only available to existing customers. Please check back tomorrow!"
```

### **Verify in Database:**

```sql
-- Check user account age
SELECT 
  id,
  email,
  created_at,
  NOW() - created_at as account_age,
  CASE 
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'NEW - No promos'
    ELSE 'EXISTING - Can access promos'
  END as promo_eligibility
FROM users
WHERE email = '[TEST_EMAIL]';

-- Test the function directly
SELECT * FROM get_user_promotional_offers('[USER_ID]');
-- Should return empty for new customers
```

---

## 4️⃣ Common Issues & Fixes

### **Issue: Signup bonus not awarded**

**Check:**
```sql
-- Is the trigger installed?
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check Supabase logs for errors
```

**Fix:** Run migration `20251015_fix_referrals_and_onboarding.sql`

---

### **Issue: Referral not created**

**Check:**
```sql
-- Does referrals table exist?
SELECT * FROM information_schema.tables 
WHERE table_name = 'referrals';

-- Check for RLS blocking
SET ROLE authenticated;
SELECT * FROM referrals WHERE referred_id = auth.uid();
```

**Fix:** Run migration `20251015_fix_referrals_and_onboarding.sql`

---

### **Issue: New customer can see promotional offers**

**Check:**
```sql
-- Check function version
SELECT prosrc FROM pg_proc 
WHERE proname = 'get_user_promotional_offers';
-- Should include "24 hours" check
```

**Fix:** Run migration `20251015_restrict_promos_for_new_customers.sql`

---

## 5️⃣ Quick Test Checklist

- [ ] New signup gets 250 beans
- [ ] New signup gets free coffee
- [ ] Referrer gets 50 beans on signup
- [ ] Referrer gets +50 beans on first check-in
- [ ] Referral stats show correctly (total/confirmed/pending)
- [ ] New customers can't see promotional offers
- [ ] Existing customers can see promotional offers
- [ ] Error messages are user-friendly
- [ ] Toast notifications appear

---

## 📊 Summary of Rewards

| Event | Who Gets What |
|-------|---------------|
| **New Signup** | New user: 250 beans + free coffee |
| **Referral Signup** | Referrer: 50 beans immediately |
| **First Check-in (Referred)** | Referrer: +50 beans (100 total) |
| **Promotional Offer** | Existing customers only (> 24 hours) |

---

## 🚨 Migrations Required

Run these in order:
1. `20251015_fix_staff_rls_policies.sql`
2. `20251015_fix_referrals_and_onboarding.sql`
3. `20251015_add_auth_user_cascade_delete.sql`
4. `20251015_restrict_promos_for_new_customers.sql`

**All migrations are in:** `supabase/migrations/`
