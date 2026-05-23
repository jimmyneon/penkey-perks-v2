-- =============================================
-- FORCE SYNC ALL AUTH USERS TO PUBLIC.USERS
-- Date: 2025-10-15
-- =============================================
-- This migration forcefully creates profiles for ALL auth users
-- that don't have a corresponding public.users entry
-- =============================================

-- First, let's see what we're dealing with
DO $$
DECLARE
  v_total_auth INTEGER;
  v_total_profiles INTEGER;
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_auth FROM auth.users;
  SELECT COUNT(*) INTO v_total_profiles FROM public.users;
  v_missing := v_total_auth - v_total_profiles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BEFORE SYNC:';
  RAISE NOTICE 'Total auth.users: %', v_total_auth;
  RAISE NOTICE 'Total public.users: %', v_total_profiles;
  RAISE NOTICE 'Missing profiles: %', v_missing;
  RAISE NOTICE '========================================';
END $$;

-- Temporarily disable RLS for this migration
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards DISABLE ROW LEVEL SECURITY;

-- Create profiles for ALL missing users
DO $$
DECLARE
  v_created_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_auth_record RECORD;
  v_free_coffee_reward_id UUID;
  v_user_name TEXT;
BEGIN
  -- Get the Free Coffee reward ID (if it exists)
  SELECT id INTO v_free_coffee_reward_id
  FROM public.rewards
  WHERE name = 'Free Coffee'
    AND active = true
  LIMIT 1;

  -- Loop through ALL auth users without profiles
  FOR v_auth_record IN 
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
    ORDER BY au.created_at ASC
  LOOP
    BEGIN
      -- Try to extract name from metadata in multiple ways
      v_user_name := COALESCE(
        v_auth_record.raw_user_meta_data->>'name',
        v_auth_record.raw_user_meta_data->>'full_name',
        v_auth_record.raw_user_meta_data->>'display_name',
        split_part(v_auth_record.email, '@', 1)
      );
      
      -- Create user profile with original created_at timestamp
      INSERT INTO public.users (
        id, 
        email, 
        name, 
        avatar_url,
        created_at,
        updated_at
      )
      VALUES (
        v_auth_record.id,
        v_auth_record.email,
        v_user_name,
        v_auth_record.raw_user_meta_data->>'avatar_url',
        v_auth_record.created_at,
        v_auth_record.created_at
      );
      
      RAISE NOTICE 'Created profile for: % (%) - Name: %', 
        v_auth_record.email, 
        v_auth_record.id,
        v_user_name;
      
      -- Award signup bonus (250 beans)
      BEGIN
        PERFORM public.add_points(
          v_auth_record.id,
          250,
          'signup',
          'Retroactive welcome bonus'
        );
        RAISE NOTICE '  → Awarded 250 beans';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '  → Failed to award points: %', SQLERRM;
      END;
      
      -- Award free coffee reward if it exists
      IF v_free_coffee_reward_id IS NOT NULL THEN
        BEGIN
          INSERT INTO public.user_rewards (
            user_id,
            reward_id,
            status,
            expires_at
          )
          VALUES (
            v_auth_record.id,
            v_free_coffee_reward_id,
            'active',
            NOW() + INTERVAL '30 days'
          );
          RAISE NOTICE '  → Awarded free coffee';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE WARNING '  → Failed to award free coffee: %', SQLERRM;
        END;
      END IF;
      
      v_created_count := v_created_count + 1;
      
    EXCEPTION
      WHEN unique_violation THEN
        RAISE WARNING 'Profile already exists for user % (%), skipping', 
          v_auth_record.email, v_auth_record.id;
        v_failed_count := v_failed_count + 1;
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user % (%): %', 
          v_auth_record.email, v_auth_record.id, SQLERRM;
        v_failed_count := v_failed_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SYNC COMPLETE:';
  RAISE NOTICE '✅ Successfully created: % profiles', v_created_count;
  IF v_failed_count > 0 THEN
    RAISE NOTICE '⚠️  Failed to create: % profiles', v_failed_count;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Verify the sync worked
DO $$
DECLARE
  v_total_auth INTEGER;
  v_total_profiles INTEGER;
  v_still_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_auth FROM auth.users;
  SELECT COUNT(*) INTO v_total_profiles FROM public.users;
  v_still_missing := v_total_auth - v_total_profiles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AFTER SYNC:';
  RAISE NOTICE 'Total auth.users: %', v_total_auth;
  RAISE NOTICE 'Total public.users: %', v_total_profiles;
  RAISE NOTICE 'Still missing: %', v_still_missing;
  RAISE NOTICE '========================================';
  
  IF v_still_missing > 0 THEN
    RAISE WARNING '⚠️  Still have % users without profiles!', v_still_missing;
    RAISE NOTICE 'Run verify_user_sync.sql to see which users are still missing';
  ELSE
    RAISE NOTICE '✅ ALL AUTH USERS NOW HAVE PROFILES!';
  END IF;
END $$;

-- Final verification query
SELECT 
  '✅ SYNC COMPLETE' as status,
  COUNT(DISTINCT au.id) as total_auth_users,
  COUNT(DISTINCT u.id) as total_profiles,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT u.id) as remaining_orphans
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;
