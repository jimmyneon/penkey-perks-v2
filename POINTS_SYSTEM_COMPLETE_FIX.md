# 🔧 POINTS SYSTEM - COMPLETE AUDIT & FIX

**Date:** 2025-10-10 18:22:00  
**Status:** 🚨 CRITICAL ISSUES FOUND

---

## 🐛 ISSUES IDENTIFIED

### **Issue 1: NO SIGNUP POINTS AWARDED** ❌
**Problem:** The `handle_new_user()` trigger function only creates the user profile but **DOES NOT award signup points**.

**Current Code:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What's Missing:** No call to `add_points()` to award welcome bonus!

**Impact:** New users sign up and see "Points awarded!" message but get 0 points.

---

### **Issue 2: CHECK-IN LOGIC BROKEN FOR NEW USERS** ❌
**Problem:** The `can_check_in()` function checks if there's ANY check-in TODAY, not a user-specific 24-hour cooldown.

**Current Logic:**
```sql
-- Check last check-in from points_transactions (source = 'visit')
SELECT MAX(created_at) INTO v_last_check_in
FROM public.points_transactions
WHERE user_id = p_user_id 
  AND source = 'visit'
  AND created_at >= v_today_start;  -- ⚠️ Only checks TODAY
```

**Problem Scenario:**
1. User A checks in at 11:59 PM
2. User B tries to check in at 12:01 AM (new day)
3. User B is allowed (correct)
4. BUT: If User A tries again at 12:01 AM, they're ALSO allowed (wrong!)

**What's Happening:**
- New users have NO transactions with `source='visit'`
- So `v_last_check_in` is NULL
- Function returns TRUE (allows check-in)
- BUT: After first check-in, if they try again same day, it should block them
- HOWEVER: The function only checks TODAY, not 24-hour cooldown per user

**Impact:** Users can check in multiple times per day from different browsers/devices.

---

### **Issue 3: INCONSISTENT POINTS TRACKING** ⚠️
**Problem:** Points are tracked in `points_transactions` but check-ins might not be logged consistently.

**Flow Issues:**
1. `/api/check-in` calls `add_points()` ✅
2. `add_points()` inserts into `points_transactions` ✅
3. BUT: If `add_points()` fails silently, user sees success message but gets no points ❌

---

## 📊 CURRENT SYSTEM ARCHITECTURE

### **Tables:**
```
users
├── id (UUID, PK)
├── email
├── name
└── created_at

points_transactions (LEDGER)
├── id (UUID, PK)
├── user_id (FK → users.id)
├── amount (INTEGER) - positive or negative
├── balance_after (INTEGER)
├── source (TEXT) - 'visit', 'signup', 'game_bonus', etc.
├── description (TEXT)
└── created_at (TIMESTAMP)
```

### **Functions:**
- `handle_new_user()` - Trigger on auth.users INSERT → creates user profile
- `add_points(user_id, amount, source, description)` - Adds points transaction
- `get_user_points(user_id)` - Returns current balance (SUM of transactions)
- `can_check_in(user_id)` - Checks if user can check in today

### **API Endpoints:**
- `/api/check-in` - Awards 5 points for daily visit
- `/api/games/play` - Awards points for game wins
- `/api/rewards/redeem` - Deducts points for rewards

---

## ✅ COMPLETE FIX

### **Fix 1: Add Signup Points to handle_new_user()**

```sql
-- Drop and recreate handle_new_user with signup points
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
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
  
  -- Award signup bonus (10 points)
  PERFORM public.add_points(
    v_user_id,
    10,
    'signup',
    'Welcome bonus for new account'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to award signup points for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile and awards 10 point signup bonus';
```

---

### **Fix 2: Fix can_check_in() to be User-Specific**

```sql
-- Fix can_check_in to check per-user, not just today
DROP FUNCTION IF EXISTS public.can_check_in(UUID);

CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_check_in TIMESTAMP WITH TIME ZONE;
  v_today_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get start of today (midnight)
  v_today_start := date_trunc('day', NOW());
  
  -- Get user's last check-in (any day)
  SELECT MAX(created_at) INTO v_last_check_in
  FROM public.points_transactions
  WHERE user_id = p_user_id 
    AND source = 'visit';
  
  -- If never checked in, allow it
  IF v_last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last check-in was before today, allow it
  IF v_last_check_in < v_today_start THEN
    RETURN TRUE;
  END IF;
  
  -- Already checked in today
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in today (one check-in per calendar day per user)';
```

---

### **Fix 3: Add Better Error Handling to API**

The `/api/check-in/route.ts` already has good error handling, but let's verify:

```typescript
// Award 5 points for visit
const { data: newBalance, error: pointsError } = await supabase
  .rpc('add_points', {
    p_user_id: user.id,
    p_amount: 5,
    p_source: 'visit',
    p_description: 'Daily visit check-in'
  })

if (pointsError) {
  console.error('Error adding points:', pointsError)
  return NextResponse.json(
    { error: 'Failed to award points. Please contact support.' },
    { status: 500 }
  )
}
```

✅ This is correct - it checks for errors and returns 500 if points fail.

---

## 🔧 MIGRATION FILE

Create: `supabase/migrations/20251010_fix_signup_and_checkin.sql`

```sql
-- =============================================
-- FIX: Signup Points & Check-In Logic
-- =============================================

-- 1. Fix handle_new_user to award signup points
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
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
  
  -- Award signup bonus (10 points)
  PERFORM public.add_points(
    v_user_id,
    10,
    'signup',
    'Welcome bonus for new account'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to award signup points for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile and awards 10 point signup bonus';

-- 2. Fix can_check_in to be user-specific
-- =============================================
DROP FUNCTION IF EXISTS public.can_check_in(UUID);

CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_check_in TIMESTAMP WITH TIME ZONE;
  v_today_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get start of today (midnight)
  v_today_start := date_trunc('day', NOW());
  
  -- Get user's last check-in (any day)
  SELECT MAX(created_at) INTO v_last_check_in
  FROM public.points_transactions
  WHERE user_id = p_user_id 
    AND source = 'visit';
  
  -- If never checked in, allow it
  IF v_last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last check-in was before today, allow it
  IF v_last_check_in < v_today_start THEN
    RETURN TRUE;
  END IF;
  
  -- Already checked in today
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in today (one check-in per calendar day per user)';

-- 3. Backfill signup points for existing users (optional)
-- =============================================
-- Award 10 points to users who signed up but never got signup bonus
INSERT INTO public.points_transactions (user_id, amount, balance_after, source, description)
SELECT 
  u.id,
  10,
  10,
  'signup',
  'Retroactive welcome bonus'
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.points_transactions pt
  WHERE pt.user_id = u.id AND pt.source = 'signup'
)
AND u.created_at >= '2025-10-01'; -- Only backfill recent users

SELECT '✅ Signup points and check-in logic fixed!' as message;
```

---

## 🧪 TESTING CHECKLIST

### **Test 1: Signup Points**
1. Create a new user account
2. Check Supabase SQL Editor:
   ```sql
   SELECT * FROM points_transactions 
   WHERE user_id = 'NEW_USER_ID' AND source = 'signup';
   ```
3. **Expected:** 1 row with amount=10

### **Test 2: Check-In Once Per Day**
1. User checks in → Should succeed
2. User tries again immediately → Should fail with "already checked in"
3. Wait until next day (or change system time) → Should succeed again

### **Test 3: Multiple Users Same Day**
1. User A checks in → Success
2. User B checks in → Success (not blocked by User A)
3. User A tries again → Blocked
4. User B tries again → Blocked

### **Test 4: Points Balance**
1. New user signs up → 10 points
2. User checks in → 15 points (10 + 5)
3. User plays game and wins 20 points → 35 points
4. User redeems 30 point reward → 5 points

---

## 📝 POINTS SOURCES REFERENCE

| Source | Amount | When Awarded |
|--------|--------|--------------|
| `signup` | +10 | New user registration |
| `visit` | +5 | Daily check-in |
| `game_bonus` | +5 to +50 | Game wins |
| `referral` | +20 | Friend signs up with referral code |
| `birthday` | +25 | User's birthday |
| `manual_add` | Variable | Staff manual award |
| `redemption` | Negative | Reward redemption |
| `refund` | Positive | Failed redemption refund |

---

## 🚀 DEPLOYMENT STEPS

1. **Run Audit:**
   ```bash
   # In Supabase SQL Editor
   # Run: POINTS_SYSTEM_AUDIT.sql
   ```

2. **Apply Fix:**
   ```bash
   # In Supabase SQL Editor
   # Run: supabase/migrations/20251010_fix_signup_and_checkin.sql
   ```

3. **Test:**
   - Create new test user
   - Verify 10 points awarded
   - Test check-in
   - Verify 15 points total

4. **Monitor:**
   ```sql
   -- Check all recent transactions
   SELECT * FROM points_transactions 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

---

## 🎯 SUCCESS CRITERIA

- ✅ New users automatically get 10 points on signup
- ✅ Users can check in once per calendar day
- ✅ Check-in awards 5 points
- ✅ Multiple users can check in on same day
- ✅ Points balance is accurate
- ✅ All transactions are logged
- ✅ No duplicate check-ins possible

---

## 📞 SUPPORT

If issues persist:
1. Run `POINTS_SYSTEM_AUDIT.sql` and share results
2. Check Supabase logs for errors
3. Verify migrations were applied successfully
