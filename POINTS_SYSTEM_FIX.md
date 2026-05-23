# 🔧 POINTS SYSTEM - VERIFICATION & FIXES

**Date:** 2025-10-09 17:18:00

---

## 🔍 CURRENT SETUP

### **Tables:**
1. ✅ `points_transactions` - Ledger of all point movements
2. ✅ `user_points_balance` - VIEW (calculated from transactions)

### **Functions:**
1. ✅ `get_user_points(user_id)` - Get current balance
2. ✅ `add_points(user_id, amount, source, description)` - Add/remove points
3. ✅ `get_lifetime_points(user_id)` - Total points ever earned

### **RLS Policies:**
1. ✅ Users can view own transactions
2. ❌ **MISSING:** Users cannot INSERT directly (only via function)

---

## ⚠️ POTENTIAL ISSUES

### **Issue 1: Direct INSERT Possible**
Users might be able to insert directly into `points_transactions` if there's no INSERT policy.

**Fix:** Add explicit DENY policy for INSERT

### **Issue 2: Transactions Not Showing**
If transactions aren't showing, possible causes:
- Function not being called
- RLS blocking view
- Wrong user_id

### **Issue 3: Balance Calculation**
Balance is a VIEW, not a table. It's calculated from transactions.

---

## 🔒 SECURITY FIXES NEEDED

### **1. Add INSERT/UPDATE/DELETE Policies**

```sql
-- Prevent direct inserts (only via function)
DROP POLICY IF EXISTS "Prevent direct inserts" ON public.points_transactions;
CREATE POLICY "Prevent direct inserts" ON public.points_transactions
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent updates" ON public.points_transactions;
CREATE POLICY "Prevent updates" ON public.points_transactions
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Prevent deletes" ON public.points_transactions;
CREATE POLICY "Prevent deletes" ON public.points_transactions
  FOR DELETE USING (false);
```

### **2. Ensure Function Has SECURITY DEFINER**

Already done ✅:
```sql
CREATE OR REPLACE FUNCTION public.add_points(...)
RETURNS INTEGER AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This allows the function to bypass RLS.

---

## 🧪 TESTING QUERIES

### **1. Check if transactions exist:**
```sql
SELECT * FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### **2. Check current balance:**
```sql
SELECT * FROM user_points_balance 
WHERE user_id = 'YOUR_USER_ID';
```

### **3. Test add_points function:**
```sql
SELECT add_points(
  'YOUR_USER_ID'::uuid,
  10,
  'test',
  'Testing points system'
);
```

### **4. Verify RLS policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'points_transactions';
```

---

## 📊 HOW IT SHOULD WORK

### **Flow:**
```
1. User checks in
   ↓
2. API calls add_points(user_id, 5, 'visit', 'Daily check-in')
   ↓
3. Function inserts into points_transactions:
   - user_id
   - amount: 5
   - balance_after: (calculated)
   - source: 'visit'
   - description: 'Daily check-in'
   - created_at: NOW()
   ↓
4. View user_points_balance automatically updates
   ↓
5. Dashboard shows new balance
```

### **Transaction Record:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": 5,
  "balance_after": 15,
  "source": "visit",
  "description": "Daily check-in",
  "metadata": null,
  "created_at": "2025-10-09T17:00:00Z"
}
```

---

## 🐛 DEBUGGING STEPS

### **Step 1: Check if function exists**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'add_points';
```

### **Step 2: Check if table exists**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'points_transactions';
```

### **Step 3: Check RLS is enabled**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'points_transactions';
```

### **Step 4: Test function manually**
```sql
-- Get your user ID first
SELECT id FROM users WHERE email = 'your@email.com';

-- Then test
SELECT add_points(
  'YOUR_USER_ID'::uuid,
  5,
  'test',
  'Manual test'
);

-- Check if it worked
SELECT * FROM points_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔧 COMPLETE FIX SCRIPT

Run this in Supabase SQL Editor:

```sql
-- 1. Ensure RLS is enabled
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view own points transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Prevent direct inserts" ON public.points_transactions;
DROP POLICY IF EXISTS "Prevent updates" ON public.points_transactions;
DROP POLICY IF EXISTS "Prevent deletes" ON public.points_transactions;

-- 3. Create secure policies
-- Allow users to view their own transactions
CREATE POLICY "Users can view own points transactions" 
  ON public.points_transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Prevent direct inserts (only via function)
CREATE POLICY "Prevent direct inserts" 
  ON public.points_transactions
  FOR INSERT 
  WITH CHECK (false);

-- Prevent updates
CREATE POLICY "Prevent updates" 
  ON public.points_transactions
  FOR UPDATE 
  USING (false);

-- Prevent deletes
CREATE POLICY "Prevent deletes" 
  ON public.points_transactions
  FOR DELETE 
  USING (false);

-- 4. Verify function exists and is correct
CREATE OR REPLACE FUNCTION public.add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  v_new_balance := public.get_user_points(p_user_id) + p_amount;
  
  -- Insert transaction (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.points_transactions (
    user_id, amount, balance_after, source, description, metadata
  ) VALUES (
    p_user_id, p_amount, v_new_balance, p_source, p_description, p_metadata
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test it
DO $$
DECLARE
  test_user_id UUID;
  result INTEGER;
BEGIN
  -- Get a user ID (replace with actual user)
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test adding points
    result := add_points(test_user_id, 1, 'test', 'System test');
    RAISE NOTICE 'Test successful! New balance: %', result;
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;
```

---

## ✅ VERIFICATION CHECKLIST

After running the fix script:

- [ ] RLS is enabled on points_transactions
- [ ] Users can SELECT their own transactions
- [ ] Users CANNOT INSERT directly
- [ ] Users CANNOT UPDATE transactions
- [ ] Users CANNOT DELETE transactions
- [ ] add_points function works
- [ ] Transactions are being logged
- [ ] Balance is calculated correctly
- [ ] Dashboard shows correct balance

---

## 📝 WHAT TO CHECK IN YOUR DATABASE

1. **Go to Supabase → SQL Editor**
2. **Run:** `SELECT * FROM points_transactions WHERE user_id = 'YOUR_USER_ID';`
3. **Expected:** Should see all your check-ins with amount=5

If you see NO transactions, then:
- The function isn't being called
- OR there's an error in the function
- OR RLS is blocking it

**Tell me what you see!**
