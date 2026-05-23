# ❓ Did You Run the Migration?

## The Issue

You're still getting **403 Forbidden** which means Amanda is **NOT in the staff table**.

## Two Possibilities

### 1. Migration Wasn't Run Yet ❌
The migration file `20251016_auto_sync_staff_table.sql` was created but **not executed** in Supabase.

**Solution:** Run the migration in Supabase SQL Editor

### 2. Migration Was Run But Failed ⚠️
The migration ran but encountered an error.

**Solution:** Check Supabase logs or run the diagnostic script

## 🚀 Quick Fix (Run This NOW)

Open Supabase SQL Editor and run:

```sql
-- Quick fix: Add Amanda to staff table
INSERT INTO public.staff (user_id, role)
SELECT id, 'employee'
FROM public.users
WHERE email = 'amanda@penkey.co.uk'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'employee',
  updated_at = NOW();

-- Verify
SELECT 
  u.email,
  u.role as user_role,
  s.role as staff_role,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ CAN SCAN'
    ELSE '❌ CANNOT SCAN'
  END as status
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.email IN ('amanda@penkey.co.uk', 'nfdrepairs@gmail.com');
```

## 📋 Files to Use

1. **`diagnose_amanda_staff_issue.sql`** - Run this first to see what's wrong
2. **`fix_amanda_staff_NOW.sql`** - Run this to fix it immediately
3. **`20251016_auto_sync_staff_table.sql`** - Run this for the permanent trigger solution

## ✅ After Running the Fix

Amanda should be able to scan vouchers immediately. Have her:
1. Refresh the page
2. Try scanning a voucher again
3. Should work! ✨

## 🔍 To Verify

Run this query:
```sql
SELECT email, role FROM users WHERE email = 'amanda@penkey.co.uk';
SELECT u.email, s.role FROM staff s JOIN users u ON s.user_id = u.id WHERE u.email = 'amanda@penkey.co.uk';
```

Both queries should return results.
