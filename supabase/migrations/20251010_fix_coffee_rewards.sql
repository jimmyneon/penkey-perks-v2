-- =============================================
-- Fix Coffee Stamp Rewards System
-- =============================================

-- Step 1: Ensure Free Coffee reward exists
-- First check if it exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rewards WHERE name = 'Free Coffee') THEN
    INSERT INTO public.rewards (name, description, type, value, points_cost, expiry_days, active)
    VALUES (
      'Free Coffee',
      'Congratulations! You earned a free coffee with 10 stamps!',
      'free_item',
      'Free Coffee',
      0,  -- No points cost (earned through stamps)
      30,  -- Expires in 30 days
      TRUE
    );
  ELSE
    UPDATE public.rewards
    SET 
      description = 'Congratulations! You earned a free coffee with 10 stamps!',
      type = 'free_item',
      value = 'Free Coffee',
      points_cost = 0,
      expiry_days = 30,
      active = TRUE,
      updated_at = NOW()
    WHERE name = 'Free Coffee';
  END IF;
END $$;

-- Step 2: Check users who have 10+ stamps but no Free Coffee reward
DO $$
DECLARE
  v_user RECORD;
  v_reward_id UUID;
  v_stamp_count INTEGER;
BEGIN
  -- Get the Free Coffee reward ID
  SELECT id INTO v_reward_id
  FROM public.rewards
  WHERE name = 'Free Coffee'
  LIMIT 1;

  -- For each user with 10+ stamps
  FOR v_user IN 
    SELECT user_id, COUNT(*) as stamp_count
    FROM public.coffee_stamps
    GROUP BY user_id
    HAVING COUNT(*) >= 10
  LOOP
    v_stamp_count := v_user.stamp_count;
    
    -- Calculate how many free coffees they should have
    -- (1 for every 10 stamps)
    FOR i IN 1..(v_stamp_count / 10) LOOP
      -- Check if they already have this reward
      IF NOT EXISTS (
        SELECT 1 FROM public.user_rewards
        WHERE user_id = v_user.user_id
        AND reward_id = v_reward_id
        AND status = 'active'
        LIMIT i
      ) THEN
        -- Create the missing reward (don't reset stamps - they stay at 10)
        INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at, status)
        VALUES (
          v_user.user_id,
          v_reward_id,
          'COFFEE-' || substr(md5(random()::text || v_user.user_id::text), 1, 12),
          NOW() + INTERVAL '30 days',
          'active'
        );
        
        RAISE NOTICE 'Created Free Coffee reward for user % (stamps remain at 10 until redeemed)', v_user.user_id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Verify rewards were created
SELECT 
  u.email,
  COUNT(cs.id) as total_stamps,
  COUNT(ur.id) as free_coffees
FROM public.users u
LEFT JOIN public.coffee_stamps cs ON cs.user_id = u.id
LEFT JOIN public.user_rewards ur ON ur.user_id = u.id 
  AND ur.reward_id = (SELECT id FROM public.rewards WHERE name = 'Free Coffee' LIMIT 1)
  AND ur.status = 'active'
GROUP BY u.id, u.email
HAVING COUNT(cs.id) >= 10
ORDER BY total_stamps DESC;

SELECT '✅ Free Coffee rewards created for all eligible users!' as message;
