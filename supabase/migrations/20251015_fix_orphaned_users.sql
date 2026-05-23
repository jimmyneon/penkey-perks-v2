-- =============================================
-- FIX ORPHANED AUTH USERS
-- Date: 2025-10-15
-- =============================================
-- This migration fixes users who have auth entries but no profile
-- This can happen if users skip onboarding or if the trigger fails
-- =============================================

-- 1. Verify the handle_new_user trigger exists and is correct
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: on_auth_user_created trigger does not exist! Run 20251013_add_free_coffee_on_signup.sql first.';
  END IF;
  
  RAISE NOTICE '✅ Trigger exists';
END $$;

-- 2. Create profiles for orphaned auth users
-- =============================================
DO $$
DECLARE
  v_orphaned_count INTEGER := 0;
  v_auth_record RECORD;
  v_free_coffee_reward_id UUID;
BEGIN
  -- Get the Free Coffee reward ID
  SELECT id INTO v_free_coffee_reward_id
  FROM public.rewards
  WHERE name = 'Free Coffee'
    AND active = true
  LIMIT 1;

  -- Loop through all auth users without profiles
  FOR v_auth_record IN 
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE u.id IS NULL
  LOOP
    BEGIN
      -- Create user profile
      INSERT INTO public.users (id, email, name, avatar_url, created_at)
      VALUES (
        v_auth_record.id,
        v_auth_record.email,
        COALESCE(
          v_auth_record.raw_user_meta_data->>'name',
          v_auth_record.raw_user_meta_data->>'full_name',
          split_part(v_auth_record.email, '@', 1)
        ),
        v_auth_record.raw_user_meta_data->>'avatar_url',
        v_auth_record.created_at
      );
      
      -- Award signup bonus (250 beans)
      PERFORM public.add_points(
        v_auth_record.id,
        250,
        'signup',
        'Retroactive welcome bonus for orphaned user'
      );
      
      -- Award free coffee reward if it exists
      IF v_free_coffee_reward_id IS NOT NULL THEN
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
      END IF;
      
      v_orphaned_count := v_orphaned_count + 1;
      RAISE NOTICE 'Fixed orphaned user: % (%)', v_auth_record.email, v_auth_record.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to fix orphaned user % (%): %', 
          v_auth_record.email, v_auth_record.id, SQLERRM;
    END;
  END LOOP;
  
  IF v_orphaned_count > 0 THEN
    RAISE NOTICE '✅ Fixed % orphaned users', v_orphaned_count;
  ELSE
    RAISE NOTICE '✅ No orphaned users found';
  END IF;
END $$;

-- 3. Verify all auth users now have profiles
-- =============================================
DO $$
DECLARE
  v_remaining_orphans INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining_orphans
  FROM auth.users au
  LEFT JOIN public.users u ON au.id = u.id
  WHERE u.id IS NULL;
  
  IF v_remaining_orphans > 0 THEN
    RAISE WARNING 'Still have % orphaned users!', v_remaining_orphans;
  ELSE
    RAISE NOTICE '✅ All auth users now have profiles';
  END IF;
END $$;

-- 4. Add a safety check function to prevent future orphans
-- =============================================
-- This function can be called from the application to ensure a user has a profile
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_auth_user RECORD;
  v_free_coffee_reward_id UUID;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id) INTO v_profile_exists;
  
  IF v_profile_exists THEN
    RETURN TRUE;
  END IF;
  
  -- Profile doesn't exist, create it
  SELECT * INTO v_auth_user
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_auth_user.id IS NULL THEN
    RAISE EXCEPTION 'Auth user % does not exist', p_user_id;
  END IF;
  
  -- Create profile
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    v_auth_user.id,
    v_auth_user.email,
    COALESCE(
      v_auth_user.raw_user_meta_data->>'name',
      v_auth_user.raw_user_meta_data->>'full_name',
      split_part(v_auth_user.email, '@', 1)
    ),
    v_auth_user.raw_user_meta_data->>'avatar_url'
  );
  
  -- Award signup bonus
  PERFORM public.add_points(
    p_user_id,
    250,
    'signup',
    'Welcome bonus for new account'
  );
  
  -- Get and award free coffee reward
  SELECT id INTO v_free_coffee_reward_id
  FROM public.rewards
  WHERE name = 'Free Coffee'
    AND active = true
  LIMIT 1;
  
  IF v_free_coffee_reward_id IS NOT NULL THEN
    INSERT INTO public.user_rewards (
      user_id,
      reward_id,
      status,
      expires_at
    )
    VALUES (
      p_user_id,
      v_free_coffee_reward_id,
      'active',
      NOW() + INTERVAL '30 days'
    );
  END IF;
  
  RAISE NOTICE 'Created profile for user %', p_user_id;
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to ensure profile for user %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.ensure_user_profile IS 'Ensures a user has a profile, creating one if missing. Returns TRUE if profile exists or was created.';

-- Final success message
SELECT 
  '✅ Orphaned users fixed!' as message,
  'All auth users now have profiles' as status,
  'Use ensure_user_profile(user_id) to prevent future orphans' as prevention_tip;
