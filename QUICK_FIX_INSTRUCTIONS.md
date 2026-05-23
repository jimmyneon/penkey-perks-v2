# Quick Fix for Missing User Profiles

## Step 1: Check the Problem

Run this in Supabase SQL Editor:

```sql
-- See which auth users don't have profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN u.id IS NOT NULL THEN '✅ Has Profile' ELSE '❌ MISSING' END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;
```

## Step 2: Run the Force Sync Migration

In Supabase SQL Editor, run this file:
```
supabase/migrations/20251015_force_sync_all_users.sql
```

This will:
- Show you how many users are missing profiles
- Create profiles for ALL missing users
- Award them 250 beans + free coffee
- Show you the results

## Step 3: Verify It Worked

Run this query:

```sql
-- Should show 0 missing profiles
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(u.id) as users_with_profiles,
  COUNT(*) - COUNT(u.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;
```

## If It Still Doesn't Work

The migration might be failing silently. Try this manual approach:

```sql
-- Create profiles one by one
INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ) as name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Then award points separately
-- (This might fail if add_points function has issues, but profiles will exist)
```

## Check for Errors

If the migration shows errors, check:

1. **RLS Policies** - Make sure the migration can insert into `public.users`
2. **Permissions** - The migration runs as SECURITY DEFINER
3. **Constraints** - Check if there are any unique constraints being violated

Run this to check for constraint issues:

```sql
-- Check constraints on users table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;
```

## Why This Happened

The database trigger `handle_new_user()` should create profiles automatically, but it can fail if:
- Timing issues (trigger doesn't complete before app checks)
- Permission issues
- The trigger wasn't installed correctly
- Users were created before the trigger existed

The app now has safety checks to catch this, but we need to fix existing users first.
