-- =============================================
-- MANUALLY AWARD SIGNUP BONUS TO EXISTING USER
-- =============================================
-- Use this if a user signed up before the trigger was installed
-- Replace [USER_EMAIL] with the actual email address
-- =============================================

-- Step 1: Find the user
SELECT 
  id,
  email,
  name,
  created_at,
  current_points
FROM users
WHERE email = '[USER_EMAIL]';  -- REPLACE THIS

-- Step 2: Award 250 beans signup bonus
-- Replace [USER_ID] with the UUID from Step 1
SELECT public.add_points(
  '[USER_ID]'::uuid,  -- REPLACE THIS
  250,
  'signup',
  'Welcome bonus (manually awarded)'
);

-- Step 3: Award free coffee reward
-- First, get the Free Coffee reward ID
SELECT id, name, type, cost 
FROM rewards 
WHERE name = 'Free Coffee' AND active = true;

-- Then create the user reward
-- Replace [USER_ID] and [FREE_COFFEE_REWARD_ID]
INSERT INTO user_rewards (
  user_id,
  reward_id,
  reward_name,
  status,
  qr_code,
  expires_at
)
VALUES (
  '[USER_ID]'::uuid,  -- REPLACE THIS
  '[FREE_COFFEE_REWARD_ID]'::uuid,  -- REPLACE THIS (from query above)
  'Free Coffee',
  'active',
  'COFFEE-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  NOW() + INTERVAL '30 days'
);

-- Step 4: Verify it worked
SELECT 
  u.email,
  u.current_points,
  COUNT(ur.id) as active_rewards
FROM users u
LEFT JOIN user_rewards ur ON ur.user_id = u.id AND ur.status = 'active'
WHERE u.email = '[USER_EMAIL]'  -- REPLACE THIS
GROUP BY u.id, u.email, u.current_points;

-- =============================================
-- EASIER: Run this all-in-one query
-- =============================================
DO $$
DECLARE
  v_user_id UUID;
  v_reward_id UUID;
  v_user_email TEXT := '[USER_EMAIL]';  -- REPLACE THIS
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM users
  WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', v_user_email;
  END IF;
  
  -- Award 250 beans
  PERFORM public.add_points(
    v_user_id,
    250,
    'signup',
    'Welcome bonus (manually awarded)'
  );
  
  RAISE NOTICE 'Awarded 250 beans to user %', v_user_id;
  
  -- Get Free Coffee reward ID
  SELECT id INTO v_reward_id
  FROM rewards
  WHERE name = 'Free Coffee' AND active = true
  LIMIT 1;
  
  IF v_reward_id IS NULL THEN
    RAISE WARNING 'Free Coffee reward not found in rewards table';
  ELSE
    -- Award free coffee
    INSERT INTO user_rewards (
      user_id,
      reward_id,
      reward_name,
      status,
      qr_code,
      expires_at
    )
    VALUES (
      v_user_id,
      v_reward_id,
      'Free Coffee',
      'active',
      'COFFEE-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
      NOW() + INTERVAL '30 days'
    );
    
    RAISE NOTICE 'Awarded Free Coffee to user %', v_user_id;
  END IF;
  
  RAISE NOTICE '✅ Signup bonus manually awarded!';
END $$;
