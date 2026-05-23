# 🔄 Auto-Sync Staff Table - Setup Complete

## What This Does

A database trigger now **automatically syncs** the `staff` table whenever you change `users.role`:

### Automatic Actions

| Change in `users.role` | Action in `staff` table |
|------------------------|-------------------------|
| `customer` → `staff` | ✅ Added as 'employee' |
| `customer` → `admin` | ✅ Added as 'owner' |
| `staff` → `admin` | ✅ Updated to 'owner' |
| `admin` → `staff` | ✅ Kept as current role |
| `staff/admin` → `customer` | ❌ Removed from staff table |

## 🚀 How to Apply

### Option 1: Run the Migration (Recommended)
```bash
# The migration file is already created
# Just apply it in Supabase
```

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste: `supabase/migrations/20251016_auto_sync_staff_table.sql`
4. Run it

### Option 2: Manual SQL
Copy and run `20251016_auto_sync_staff_table.sql` in Supabase SQL Editor

## ✅ What Gets Fixed

### Immediate Backfill
The migration automatically:
- Finds all users with `role = 'staff'` or `role = 'admin'`
- Adds them to the `staff` table if missing
- Sets correct staff role (admin → owner, staff → employee)

### Future Changes
From now on, when you:
```sql
-- Change someone to staff
UPDATE users SET role = 'staff' WHERE email = 'amanda@penkey.co.uk';
-- ✅ Automatically added to staff table as 'employee'

-- Promote to admin
UPDATE users SET role = 'admin' WHERE email = 'john@example.com';
-- ✅ Automatically updated in staff table to 'owner'

-- Remove staff access
UPDATE users SET role = 'customer' WHERE email = 'former-staff@example.com';
-- ✅ Automatically removed from staff table
```

## 🎯 Benefits

1. **No More Manual Sync**: Change role once, both tables update
2. **Fixes Current Issue**: Backfills Amanda and any other missing staff
3. **Prevents Future Issues**: Can't forget to update staff table
4. **Admin UI Compatible**: Works with your admin staff management pages

## 🔍 Verification

After running the migration, check it worked:

```sql
-- See all staff members
SELECT 
  u.email,
  u.role as user_role,
  s.role as staff_role
FROM users u
LEFT JOIN staff s ON s.user_id = u.id
WHERE u.role IN ('staff', 'admin')
ORDER BY u.email;
```

Expected result:
- All staff/admin users have matching staff table entries
- No NULL values in staff_role column

## 🧪 Test It

Try changing a role:
```sql
-- Test: Promote a customer to staff
UPDATE users SET role = 'staff' WHERE email = 'test@example.com';

-- Verify: Check staff table
SELECT * FROM staff WHERE user_id = (
  SELECT id FROM users WHERE email = 'test@example.com'
);
-- Should show new staff entry!
```

## 🛡️ Safety Features

- **Idempotent**: Safe to run multiple times
- **ON CONFLICT**: Won't create duplicates
- **SECURITY DEFINER**: Trigger has permission to modify staff table
- **Preserves Owner Role**: Won't demote owners to employees

## 📝 Technical Details

### Trigger Function
- **Name**: `sync_staff_table()`
- **Type**: AFTER UPDATE trigger
- **Fires**: Only when `users.role` changes
- **Action**: INSERT/UPDATE/DELETE in staff table

### Role Mapping
```
users.role → staff.role
------------------------
admin      → owner
staff      → employee
customer   → (removed)
```

## ⚠️ Important Notes

1. **Existing Owners Stay Owners**: If someone is already 'owner' in staff table, they stay owner even if demoted to 'staff' in users table
2. **Cascade Deletes**: If user is deleted, staff entry is automatically removed
3. **RLS Policies**: Staff can view their own record, admins can view all

## 🎉 Result

After running this migration:
- ✅ Amanda will be able to scan vouchers
- ✅ You'll never have this sync issue again
- ✅ Admin UI and manual SQL updates both work
- ✅ One source of truth: `users.role`
