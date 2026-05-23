-- First, check the staff table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the constraint on staff.role
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.staff'::regclass
  AND conname LIKE '%role%';

-- Check if staff user exists in staff table
SELECT 
  'Staff user check:' as info,
  *
FROM staff
WHERE user_id = '5480d475-de07-4285-955a-a358309daec9';

-- Check if staff user exists in users table
SELECT 
  'User record:' as info,
  id,
  role,
  name,
  email
FROM users
WHERE id = '5480d475-de07-4285-955a-a358309daec9';

-- Check current RLS policy on user_rewards for staff
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_rewards'
  AND policyname LIKE '%staff%';

-- THE FIX: Add staff user to staff table if missing
-- Try with 'owner' role (common valid values: 'owner', 'manager', 'barista')
INSERT INTO staff (user_id, role)
VALUES ('5480d475-de07-4285-955a-a358309daec9', 'owner')
ON CONFLICT (user_id) DO NOTHING;

-- Alternative: Try 'manager' if owner doesn't work
-- INSERT INTO staff (user_id, role)
-- VALUES ('5480d475-de07-4285-955a-a358309daec9', 'manager')
-- ON CONFLICT (user_id) DO NOTHING;

-- Verify it was added
SELECT 
  'After insert:' as info,
  *
FROM staff
WHERE user_id = '5480d475-de07-4285-955a-a358309daec9';
