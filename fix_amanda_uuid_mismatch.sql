-- Fix Amanda's UUID mismatch between auth.users and public.users
-- This is the most common cause of "role is correct but access denied"

-- Step 1: Check if there's a mismatch
SELECT 
  'UUID Mismatch Check' as check_name,
  au.id as auth_uuid,
  u.id as users_uuid,
  au.email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs Match - Not the problem'
    ELSE '❌ IDs MISMATCH - This is the problem!'
  END as diagnosis
FROM auth.users au
LEFT JOIN public.users u ON au.email = u.email
WHERE au.email = 'amanda@penkey.co.uk';

-- Step 2: If there's a mismatch, we need to fix it
-- Option A: Update public.users to use the auth.users UUID (RECOMMENDED)
DO $$
DECLARE
  v_auth_id uuid;
  v_users_id uuid;
  v_email text := 'amanda@penkey.co.uk';
BEGIN
  -- Get the auth.users ID
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = v_email;
  
  -- Get the public.users ID
  SELECT id INTO v_users_id
  FROM public.users
  WHERE email = v_email;
  
  -- Check if they're different
  IF v_auth_id IS NOT NULL AND v_users_id IS NOT NULL AND v_auth_id != v_users_id THEN
    RAISE NOTICE 'UUID Mismatch detected!';
    RAISE NOTICE 'auth.users.id: %', v_auth_id;
    RAISE NOTICE 'public.users.id: %', v_users_id;
    RAISE NOTICE 'Fixing by updating public.users.id to match auth.users.id...';
    
    -- Update public.users to use the correct UUID from auth.users
    UPDATE public.users
    SET id = v_auth_id
    WHERE email = v_email;
    
    RAISE NOTICE '✅ Fixed! Amanda public.users.id now matches auth.users.id';
  ELSIF v_auth_id = v_users_id THEN
    RAISE NOTICE '✅ No mismatch - IDs already match';
  ELSE
    RAISE NOTICE '⚠️ Could not find user in one or both tables';
  END IF;
END $$;

-- Step 3: Verify the fix worked
SELECT 
  'After Fix - Verification' as check_name,
  au.id as auth_uuid,
  u.id as users_uuid,
  au.email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs Now Match!'
    ELSE '❌ Still mismatched - manual intervention needed'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.email = u.email
WHERE au.email = 'amanda@penkey.co.uk';

-- Step 4: Test if Amanda can now access staff resources
SELECT 
  'RLS Policy Test' as test,
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = (SELECT id FROM auth.users WHERE email = 'amanda@penkey.co.uk')
    AND users.role IN ('staff', 'admin')
  ) as amanda_should_have_access;
