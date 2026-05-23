# OAuth & Signup Fixes - Complete Summary

## 🐛 Issues Fixed

### 1. **Google OAuth Redirect Loop (Safari)**
**Problem:** After Google OAuth, user gets redirected to home page, then has to sign in again.

**Root Cause:** When database trigger fails to create profile, callback tries to call `ensure_user_profile` RPC which doesn't exist, causing redirect loop.

**Fix:** Auth callback now creates profile directly if trigger fails, preventing the loop.

### 2. **Signup Bonus Not Applied**
**Problem:** New users don't get 250 beans + free coffee.

**Root Cause:** Database trigger `handle_new_user` was failing silently due to incorrect column names (`reward_name` doesn't exist in `user_rewards` table).

**Fix:** 
- Updated trigger to use correct columns
- Added fallback in auth callback to award bonus if trigger fails

### 3. **Referrals Not Created**
**Problem:** When using referral link, referral record not created in database.

**Root Cause:** User profile must exist before referral can be created (foreign key constraint). If trigger fails, profile doesn't exist.

**Fix:** Auth callback creates profile immediately, allowing referral API to work.

---

## ✅ What Now Works

### **Signup Flow:**
1. User clicks referral link (optional)
2. Signs up with Google OAuth
3. **Trigger creates profile** (primary method)
4. **Callback creates profile** (fallback if trigger fails)
5. Profile exists with 250 beans
6. Referral is created (if using referral link)
7. User goes to onboarding
8. **Welcome modal shows** after onboarding
9. User sees 250 beans + free coffee

### **Dual Protection:**
- ✅ Database trigger (fast, automatic)
- ✅ Auth callback fallback (safety net)
- ✅ No more redirect loops
- ✅ Signup bonus always awarded

---

## 🔧 Files Changed

### 1. `/app/auth/callback/route.ts`
- Removed dependency on `ensure_user_profile` RPC
- Creates profile directly if not found
- Awards signup bonus as fallback
- Better error logging

### 2. `/supabase/migrations/20251015_fix_referrals_and_onboarding.sql`
- Fixed `user_rewards` INSERT (removed `reward_name`, added `qr_code`)
- Creates referrals table
- Installs `handle_new_user` trigger
- Adds referral confirmation system

### 3. `/app/onboarding/page.tsx`
- Added welcome modal showing signup bonus
- Displays 250 beans + free coffee
- Shows "What's Next" steps
- Beautiful animated UI

---

## 🧪 Testing

### **Test 1: Normal Signup (No Referral)**
```bash
1. Delete test account (if exists)
2. Go to /login in incognito
3. Sign up with Google OAuth
4. Complete onboarding
5. See welcome modal
6. Check dashboard: 250 beans + free coffee
```

**Expected Database:**
```sql
SELECT 
  u.email,
  u.name,
  (SELECT SUM(amount) FROM points_transactions WHERE user_id = u.id) as points,
  (SELECT COUNT(*) FROM user_rewards WHERE user_id = u.id AND status = 'active') as rewards
FROM users u
WHERE u.email = 'test@gmail.com';

-- Should show: points = 250, rewards = 1
```

### **Test 2: Signup with Referral**
```bash
1. Get referral link from existing user
2. Click referral link in incognito
3. Sign up with Google OAuth
4. Complete onboarding
5. See welcome modal
6. Check: referrer got 50 beans
```

**Expected Database:**
```sql
-- Check referral was created
SELECT * FROM referrals WHERE referred_id = 'NEW_USER_ID';
-- Should show: confirmed = false

-- Check referrer got 50 beans
SELECT * FROM points_transactions 
WHERE user_id = 'REFERRER_ID' 
  AND source = 'referral'
ORDER BY created_at DESC LIMIT 1;
-- Should show: amount = 50
```

### **Test 3: OAuth Redirect (Safari)**
```bash
1. Use Safari browser
2. Sign up with Google OAuth
3. Should go directly to onboarding (not home page)
4. No redirect loop
```

---

## 📊 Database Queries

### **Check if trigger is working:**
```sql
SELECT 
  'Trigger' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ Installed' ELSE '❌ Missing' END as status

UNION ALL

SELECT 
  'Function' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user'
  ) THEN '✅ Installed' ELSE '❌ Missing' END as status;
```

### **Check user signup:**
```sql
-- Replace with actual email
SELECT 
  u.email,
  u.name,
  u.created_at,
  COALESCE((SELECT SUM(amount) FROM points_transactions WHERE user_id = u.id), 0) as total_points,
  (SELECT COUNT(*) FROM user_rewards WHERE user_id = u.id AND status = 'active') as active_rewards,
  (SELECT COUNT(*) FROM referrals WHERE referred_id = u.id) as referrals
FROM users u
WHERE u.email = 'test@gmail.com';
```

### **Check referral details:**
```sql
SELECT 
  r.id,
  r.confirmed,
  r.created_at,
  referrer.email as referrer_email,
  referred.email as referred_email
FROM referrals r
JOIN users referrer ON referrer.id = r.referrer_id
JOIN users referred ON referred.id = r.referred_id
WHERE referred.email = 'test@gmail.com';
```

---

## 🚨 If Still Not Working

### **1. Check Supabase Logs:**
Go to: **Supabase Dashboard → Logs → Postgres Logs**

Look for:
- Trigger errors
- Column not found errors
- Permission errors

### **2. Check user_rewards columns:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_rewards' 
ORDER BY ordinal_position;
```

Make sure these columns exist:
- `user_id`
- `reward_id`
- `status`
- `qr_code`
- `expires_at`

### **3. Manually fix an account:**
```sql
-- Replace with actual values
DO $$
DECLARE
  v_user_id UUID := 'USER_ID_FROM_AUTH_USERS';
  v_email TEXT := 'user@email.com';
BEGIN
  -- Create profile
  INSERT INTO public.users (id, email, name)
  VALUES (v_user_id, v_email, 'User Name')
  ON CONFLICT (id) DO NOTHING;
  
  -- Award bonus
  PERFORM public.add_points(v_user_id, 250, 'signup', 'Welcome bonus');
  
  RAISE NOTICE '✅ Fixed!';
END $$;
```

---

## 📋 Deployment Checklist

- [x] Run migration: `20251015_fix_referrals_and_onboarding.sql`
- [x] Deploy updated code to Vercel
- [x] Test signup flow
- [x] Test referral flow
- [x] Test OAuth redirect (Safari)
- [x] Check Supabase logs for errors
- [x] Verify welcome modal appears

---

## 🎯 Success Criteria

✅ New user signs up → Profile created  
✅ New user signs up → 250 beans awarded  
✅ New user signs up → Free coffee awarded  
✅ Welcome modal shows after onboarding  
✅ Referral link → Referral created  
✅ Referral link → Referrer gets 50 beans  
✅ OAuth redirect → Goes to onboarding (not home)  
✅ No redirect loops  
✅ Works in Safari, Chrome, Firefox  

---

## 💡 How It Works

### **Primary Path (Trigger):**
```
User signs up
  ↓
auth.users INSERT
  ↓
handle_new_user trigger fires
  ↓
Creates profile in public.users
  ↓
Awards 250 beans
  ↓
Awards free coffee
```

### **Fallback Path (Callback):**
```
User signs up
  ↓
OAuth callback
  ↓
Checks if profile exists
  ↓
If not, creates profile manually
  ↓
Awards 250 beans
  ↓
Continues to onboarding
```

### **Result:**
✅ Profile always created  
✅ Bonus always awarded  
✅ No redirect loops  
✅ Robust and reliable  
