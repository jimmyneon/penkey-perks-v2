-- =============================================
-- ADD FREE COFFEE REWARD ON SIGNUP
-- Date: 2025-10-13
-- =============================================
-- This migration adds a free coffee reward to new user signups
-- =============================================

-- Update handle_new_user to award free coffee reward
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_free_coffee_reward_id UUID;
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  RETURNING id INTO v_user_id;
  
  -- Award signup bonus (250 beans)
  PERFORM public.add_points(
    v_user_id,
    250,
    'signup',
    'Welcome bonus for new account'
  );
  
  -- Get the Free Coffee reward ID
  SELECT id INTO v_free_coffee_reward_id
  FROM public.rewards
  WHERE name = 'Free Coffee'
    AND active = true
  LIMIT 1;
  
  -- Award free coffee reward if it exists
  IF v_free_coffee_reward_id IS NOT NULL THEN
    INSERT INTO public.user_rewards (
      user_id,
      reward_id,
      status,
      expires_at
    )
    VALUES (
      v_user_id,
      v_free_coffee_reward_id,
      'active',
      NOW() + INTERVAL '30 days'
    );
    
    RAISE NOTICE 'Awarded free coffee reward to new user %', v_user_id;
  ELSE
    RAISE WARNING 'Free Coffee reward not found in rewards table';
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to award signup rewards for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile, awards 250 beans signup bonus, and free coffee reward';

-- Verification
SELECT '✅ Free coffee signup reward added!' as message,
       'New users will receive 250 beans + free coffee' as reward_info;
