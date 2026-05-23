-- =============================================
-- TEST BEANS SYSTEM
-- =============================================
-- Quick test to verify everything works
-- =============================================

-- =============================================
-- 1. CREATE TEST USER (Proper Way)
-- =============================================

DO $$
DECLARE
  v_test_user_id UUID;
  v_test_email TEXT;
  v_reward_count INTEGER;
  v_current_beans INTEGER;
  rec RECORD;
BEGIN
  -- Generate unique test email
  v_test_email := 'test-beans-' || gen_random_uuid() || '@test.com';
  
  -- Create test user with proper UUID
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    gen_random_uuid(),
    v_test_email,
    'Test Beans User',
    'customer'
  )
  RETURNING id INTO v_test_user_id;
  
  RAISE NOTICE '✅ Created test user:';
  RAISE NOTICE '   ID: %', v_test_user_id;
  RAISE NOTICE '   Email: %', v_test_email;
  RAISE NOTICE '';
  
  -- Wait a moment for triggers to fire
  PERFORM pg_sleep(1);
  
  -- Check pending rewards
  RAISE NOTICE '🎁 Checking pending rewards...';
  
  -- Display results
  FOR rec IN 
    SELECT 
      reward_type,
      amount,
      reward_name,
      status
    FROM public.pending_rewards
    WHERE user_id = v_test_user_id
    ORDER BY created_at
  LOOP
    RAISE NOTICE '   - % %: % (status: %)', 
      CASE 
        WHEN rec.reward_type = 'points' THEN '🫘'
        WHEN rec.reward_type = 'voucher' THEN '☕'
        ELSE '🎁'
      END,
      rec.reward_name,
      CASE 
        WHEN rec.reward_type = 'points' THEN rec.amount || ' beans'
        ELSE 'Free coffee'
      END,
      rec.status;
  END LOOP;
  
  -- Get counts
  SELECT COUNT(*) INTO v_reward_count 
  FROM public.pending_rewards 
  WHERE user_id = v_test_user_id;
  
  SELECT COALESCE(public.get_user_points(v_test_user_id), 0) INTO v_current_beans;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary for test user:';
  RAISE NOTICE '   User ID: %', v_test_user_id;
  RAISE NOTICE '   Pending Rewards: %', v_reward_count;
  RAISE NOTICE '   Current Beans: %', v_current_beans;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Test user created successfully!';
  RAISE NOTICE '   Expected: 2 pending rewards (250 beans + free coffee)';
  RAISE NOTICE '   To claim: User must check in at location';
  
END $$;

-- =============================================
-- 2. VERIFY GAME PRIZES
-- =============================================

SELECT 
  '🎮 GAME PRIZES' as category,
  mg.display_name as game,
  gp.label,
  gp.prize_value as beans,
  CASE 
    WHEN gp.prize_value >= 50 THEN '✅'
    ELSE '❌'
  END as status
FROM public.game_prizes gp
JOIN public.mini_games mg ON mg.id = gp.game_id
WHERE gp.prize_type = 'points' AND gp.active = TRUE
ORDER BY mg.display_name, gp.prize_value DESC
LIMIT 10;

-- =============================================
-- 3. VERIFY POINT CONFIGS
-- =============================================

SELECT 
  '⚙️  POINT CONFIGS' as category,
  action_type,
  points_amount as beans,
  description,
  CASE 
    WHEN points_amount >= 50 THEN '✅'
    ELSE '❌'
  END as status
FROM public.points_config
WHERE active = TRUE
ORDER BY points_amount DESC
LIMIT 10;

-- =============================================
-- 4. VERIFY REWARDS
-- =============================================

SELECT 
  '🎁 REWARDS' as category,
  name,
  points_required as beans,
  reward_type,
  CASE 
    WHEN points_required >= 1000 THEN '✅'
    ELSE '❌'
  END as status
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required DESC;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🫘 BEANS SYSTEM TEST COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Check the results above to verify:';
  RAISE NOTICE '  ✅ Test user created with pending rewards';
  RAISE NOTICE '  ✅ Game prizes showing bean values';
  RAISE NOTICE '  ✅ Point configs showing bean values';
  RAISE NOTICE '  ✅ Rewards showing bean costs';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
