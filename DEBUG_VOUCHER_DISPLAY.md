# Voucher Display Debugging Guide

## Current Status
- ✅ Vouchers exist in database (3 active vouchers for john richardson)
- ✅ RLS policies are correctly configured
- ✅ `auth.uid()` matches `user_id` in vouchers
- ✅ Database structure is correct

## The Issue
Vouchers are not displaying on the dashboard despite existing in the database.

## Next Steps

### 1. Check Browser Console
Open the dashboard in your browser and check the console for these log messages:

```
[Dashboard] Loading vouchers for user: <user_id>
[Dashboard] Loaded vouchers: <array>
[Dashboard] Vouchers count: <number>
[getActiveVouchers] Fetching vouchers for user: <user_id>
[getActiveVouchers] Result: <array>
[getActiveVouchers] Vouchers count: <number>
```

**What to look for:**
- If `Loaded vouchers` is an empty array `[]`, the query is returning no data
- If there's an error in the console, that's the issue
- Check what `user_id` is being passed (should be `50d08b52-a9e4-4c79-b739-1f0e3db1b3d5`)

### 2. Test RLS with User Context
Run `TEST_RLS_WITH_USER_CONTEXT.sql` to verify the query works with service role.

### 3. Check Supabase Session
The issue might be that the Supabase client doesn't have the auth session when making the query.

**To test:**
1. Log in as john richardson
2. Open browser DevTools → Application → Local Storage
3. Look for `sb-<project-ref>-auth-token`
4. If missing or expired, the session is not available

### 4. Possible Solutions

**If RLS is blocking:**
- The RLS policy uses `auth.uid() = user_id`
- This requires the Supabase client to have the auth session
- If the session is missing, `auth.uid()` returns NULL and the query fails

**If frontend code issue:**
- The dashboard might be using sample data instead of real data
- Check line 417 in `new-v2-dashboard.tsx`:
  ```typescript
  const displayVouchers = vouchers.length > 0 ? vouchers : sampleVouchers
  ```
- If `vouchers` is empty, it falls back to `sampleVouchers`

### 5. Quick Fix Test
Add this to the dashboard temporarily to see what's happening:

```typescript
// After line 191, add:
console.log('[DEBUG] authUser.id:', authUser.id)
console.log('[DEBUG] vouchers state:', vouchers)
console.log('[DEBUG] displayVouchers:', displayVouchers)
```

### 6. SQL Test to Verify RLS Works
Run this in Supabase SQL Editor with service role:

```sql
-- This should return 3 rows
SELECT 
  uv.*,
  vt.name as voucher_name
FROM public.user_vouchers uv
LEFT JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
WHERE uv.user_id = '50d08b52-a9e4-4c79-b739-1f0e3db1b3d5'
  AND uv.status = 'active';
```

If this returns data but the frontend doesn't, it's an auth/session issue.
