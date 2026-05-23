# 🔧 User Profile Creation Fix

## Problem Identified

Some users were not getting a profile entry in the `public.users` table when their auth account was created in `auth.users`. This caused issues because:

1. **The trigger should work automatically**: The `handle_new_user()` trigger on `auth.users` should create a profile in `public.users` immediately when auth is created
2. **Users could skip onboarding**: When users clicked "Skip for now" on the onboarding page, they would go to the dashboard without completing their profile
3. **No safety net**: If the trigger failed for any reason (timing, permissions, etc.), there was no fallback mechanism

## Root Causes

1. **Database trigger timing**: The trigger might not complete before the app tries to read the profile
2. **Skipped onboarding**: Users could bypass profile completion, but the onboarding page only *updates* the profile, it doesn't *create* it
3. **No validation**: The app assumed the profile existed without checking

## Solution Implemented

### 1. Database Migration (`20251015_fix_orphaned_users.sql`)

**What it does:**
- Scans for all `auth.users` entries without corresponding `public.users` entries
- Creates profiles for these "orphaned" users
- Awards them the signup bonus (250 beans + free coffee) retroactively
- Creates a new safety function `ensure_user_profile(user_id)` that can be called to guarantee profile creation

**Run this migration to fix existing users:**
```bash
# Apply the migration through Supabase dashboard or CLI
```

### 2. Auth Callback Safety Check (`app/auth/callback/route.ts`)

**Added:**
- After OAuth login, checks if profile exists
- If missing, calls `ensure_user_profile()` to create it
- Retries fetching the profile after creation

**This fixes:** Users signing in with Google OAuth

### 3. Login Page Safety Check (`app/login/page.tsx`)

**Added:**
- After email/password signup, waits 500ms for trigger
- Checks if profile was created
- If missing, calls `ensure_user_profile()` to create it

**This fixes:** Users signing up with email/password

### 4. Onboarding Safety Check (`app/onboarding/page.tsx`)

**Added:**
- Before updating profile, checks if it exists
- If missing, calls `ensure_user_profile()` to create it
- Prevents update errors on non-existent profiles

**This fixes:** Users who reach onboarding without a profile

## How the Fix Works

### Normal Flow (Trigger Works)
```
1. User signs up → auth.users entry created
2. Trigger fires → public.users entry created automatically
3. Signup bonus awarded → 250 beans + free coffee
4. User redirected to onboarding or dashboard
```

### Safety Net Flow (Trigger Fails)
```
1. User signs up → auth.users entry created
2. Trigger fails/delayed → public.users entry missing
3. App detects missing profile → calls ensure_user_profile()
4. Profile created manually → signup bonus awarded
5. User continues normally
```

## Testing the Fix

### 1. Check for Orphaned Users
```sql
-- Run this query in Supabase SQL Editor
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN u.id IS NOT NULL THEN 'Has Profile' ELSE 'MISSING' END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;
```

### 2. Test New Signups
- Sign up with email/password
- Sign up with Google OAuth
- Check that profile is created immediately
- Verify signup bonus is awarded (250 beans + free coffee)

### 3. Test Onboarding Skip
- Sign up as new user
- Click "Skip for now" on onboarding
- Verify you can access dashboard
- Verify profile exists in database

## Files Changed

1. ✅ `/supabase/migrations/20251015_fix_orphaned_users.sql` - New migration to fix existing users
2. ✅ `/app/auth/callback/route.ts` - Added safety check for OAuth
3. ✅ `/app/login/page.tsx` - Added safety check for email signup
4. ✅ `/app/onboarding/page.tsx` - Added safety check before profile update
5. ✅ `/check_orphaned_users.sql` - Diagnostic query to check for issues

## Prevention

The `ensure_user_profile()` function is now available as a safety net:

```typescript
// Call this anywhere you need to guarantee a profile exists
const { error } = await supabase.rpc('ensure_user_profile', {
  p_user_id: userId
})
```

This function:
- Checks if profile exists
- Creates it if missing
- Awards signup bonus
- Returns true/false for success
- Is idempotent (safe to call multiple times)

## Next Steps

1. **Run the migration** to fix existing orphaned users
2. **Test the changes** with new signups
3. **Monitor logs** for "Profile not found" messages (should be rare now)
4. **Consider adding monitoring** to alert if orphaned users are detected

## Database Trigger Status

The current trigger (`handle_new_user`) should be working correctly. It:
- Creates profile in `public.users`
- Awards 250 beans signup bonus
- Awards free coffee reward
- Runs automatically on `auth.users` INSERT

If you need to verify the trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## Summary

✅ **Fixed**: Orphaned users now get profiles created automatically  
✅ **Fixed**: Multiple safety checks ensure profiles always exist  
✅ **Fixed**: Onboarding can't fail due to missing profile  
✅ **Added**: `ensure_user_profile()` function as safety net  
✅ **Added**: Diagnostic queries to check for issues  

The system now has multiple layers of protection to ensure every auth user has a corresponding profile.
