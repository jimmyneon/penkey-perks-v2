# 🔧 Staff QR Scanner Access Issue - Fixed

## 🐛 The Problem

**You** (nfdrepairs@gmail.com) can scan vouchers in the staff QR scanner, but **Amanda** (amanda@penkey.co.uk) cannot.

## 🔍 Root Cause

The system uses **TWO** separate authorization checks:

### 1. Page Access Check (`/app/staff/scan/page.tsx`)
```typescript
// Checks users.role column
const { data: profile } = await supabase
  .from('users')
  .select('role, name')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin' && profile?.role !== 'staff') {
  redirect('/dashboard')
}
```

### 2. API Authorization Check (`/app/api/admin/rewards/redeem/route.ts`)
```typescript
// Checks staff table
const { data: staff } = await supabase
  .from('staff')
  .select('role')
  .eq('user_id', user.id)
  .single()

if (!staff) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## ❌ The Issue

Amanda likely has:
- ✅ `users.role` = 'staff' (allows page access)
- ❌ **Missing entry in `staff` table** (blocks API calls)

This means:
- She can **open** the scanner page
- But when she tries to **scan a voucher**, the API returns 403 Forbidden

## ✅ The Solution

Run the SQL script: **`fix_amanda_staff_access.sql`**

This script will:
1. Check both users' current status
2. Add Amanda to the `staff` table as 'employee'
3. Ensure John is in the `staff` table as 'owner'
4. Verify both users have correct `users.role` values
5. Test the exact query the API uses

## 📊 Database Structure

The system maintains TWO tables for staff:

### `users` table
- `role` column: 'customer', 'staff', or 'admin'
- Used for: Page-level access control
- Example: Showing/hiding staff navigation

### `staff` table
- Separate table with `user_id` and `role`
- `role`: 'employee' or 'owner'
- Used for: API-level authorization
- Example: Redeeming vouchers, adding points

## 🎯 Expected Result After Fix

Both users will have:

| User | Email | users.role | staff.role | Can Scan? |
|------|-------|-----------|------------|-----------|
| John | nfdrepairs@gmail.com | admin | owner | ✅ Yes |
| Amanda | amanda@penkey.co.uk | staff | employee | ✅ Yes |

## 🚀 How to Apply

1. Open Supabase SQL Editor
2. Copy and paste `fix_amanda_staff_access.sql`
3. Run the script
4. Check the output for confirmation
5. Have Amanda try scanning a voucher again

## 🔐 Why Two Tables?

This dual-table approach provides:
- **Fine-grained permissions**: Owners vs Employees
- **Audit trail**: Track when staff was added
- **Separation of concerns**: User profiles vs Staff roles
- **Future flexibility**: Can add more staff-specific fields

## ⚠️ Prevention

When adding new staff members in the future:
1. Set `users.role` = 'staff' or 'admin'
2. **Also** add entry to `staff` table
3. Or use the admin staff management UI which does both

## 📝 Related Files

- `/app/staff/scan/page.tsx` - Page access check
- `/app/api/admin/rewards/redeem/route.ts` - API authorization
- `/app/api/admin/staff/route.ts` - Staff management API
- `/database_map.md` - Database schema reference
