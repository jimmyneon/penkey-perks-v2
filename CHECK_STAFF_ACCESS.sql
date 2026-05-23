-- Check if you're in the staff table
SELECT 
  'Your staff record:' as info,
  id,
  user_id,
  role,
  name,
  active
FROM staff
WHERE user_id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903';

-- Check your user role in users table
SELECT 
  'Your user record:' as info,
  id,
  role,
  name,
  email
FROM users
WHERE id = 'a409b642-e4e9-4159-a47c-c8a14b9bc903';

-- Test if RLS would allow you to see user_rewards
-- This simulates what the API does
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "a409b642-e4e9-4159-a47c-c8a14b9bc903"}';

SELECT 
  'Can you see user_rewards?' as test,
  COUNT(*) as visible_count
FROM user_rewards;

RESET ROLE;
