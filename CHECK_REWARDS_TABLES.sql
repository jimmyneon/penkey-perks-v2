-- =============================================
-- CHECK REWARDS TABLES
-- =============================================
-- Shows which rewards tables exist and what's in them
-- =============================================

-- Check if 'rewards' table exists
SELECT 
  '📊 REWARDS TABLE' as check_name,
  COUNT(*) as total_rewards,
  COUNT(*) FILTER (WHERE active = true) as active_rewards
FROM public.rewards;

-- Show rewards from 'rewards' table
SELECT 
  'rewards table' as source,
  id,
  name,
  points_cost,
  type,
  active
FROM public.rewards
ORDER BY points_cost ASC
LIMIT 10;

-- Check 'points_rewards' table
SELECT 
  '📊 POINTS_REWARDS TABLE' as check_name,
  COUNT(*) as total_rewards,
  COUNT(*) FILTER (WHERE active = true) as active_rewards
FROM public.points_rewards;

-- Show rewards from 'points_rewards' table
SELECT 
  'points_rewards table' as source,
  id,
  name,
  points_required,
  reward_type,
  active
FROM public.points_rewards
ORDER BY points_required ASC
LIMIT 10;

-- Summary
DO $$
DECLARE
  v_rewards_count INTEGER;
  v_points_rewards_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_rewards_count FROM public.rewards WHERE active = true;
  SELECT COUNT(*) INTO v_points_rewards_count FROM public.points_rewards WHERE active = true;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎁 REWARDS TABLES COMPARISON';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'rewards table: % active rewards', v_rewards_count;
  RAISE NOTICE 'points_rewards table: % active rewards', v_points_rewards_count;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF v_rewards_count > 0 AND v_points_rewards_count > 0 THEN
    RAISE NOTICE '⚠️  You have TWO rewards tables!';
    RAISE NOTICE '   Frontend is using: rewards table';
    RAISE NOTICE '   Beans updated in: points_rewards table';
    RAISE NOTICE '   → Need to sync or update frontend';
  ELSIF v_rewards_count > 0 THEN
    RAISE NOTICE '✅ Using rewards table';
  ELSIF v_points_rewards_count > 0 THEN
    RAISE NOTICE '⚠️  Frontend queries "rewards" but data is in "points_rewards"';
    RAISE NOTICE '   → Need to update frontend to use points_rewards';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
