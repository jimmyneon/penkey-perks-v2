-- =============================================
-- FIX: Signup Points & Check-In Logic
-- Date: 2025-10-10
-- =============================================
-- This migration fixes two critical issues:
-- 1. New users not receiving signup bonus points
-- 2. Check-in logic allowing multiple check-ins per day
-- =============================================

-- 1. Fix handle_new_user to award signup points
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
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
  
  -- Award signup bonus (10 points)
  PERFORM public.add_points(
    v_user_id,
    10,
    'signup',
    'Welcome bonus for new account'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to award signup points for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile and awards 10 point signup bonus';

-- 2. Fix can_check_in to be user-specific
-- =============================================
DROP FUNCTION IF EXISTS public.can_check_in(UUID);

CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_check_in TIMESTAMP WITH TIME ZONE;
  v_today_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get start of today (midnight)
  v_today_start := date_trunc('day', NOW());
  
  -- Get user's last check-in (any day)
  SELECT MAX(created_at) INTO v_last_check_in
  FROM public.points_transactions
  WHERE user_id = p_user_id 
    AND source = 'visit';
  
  -- If never checked in, allow it
  IF v_last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last check-in was before today, allow it
  IF v_last_check_in < v_today_start THEN
    RETURN TRUE;
  END IF;
  
  -- Already checked in today
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in today (one check-in per calendar day per user)';

-- 3. Ensure 'signup' is a valid source in points_transactions
-- =============================================
-- Check if the constraint exists and includes 'signup'
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'points_transactions' 
    AND constraint_name LIKE '%source%'
  ) THEN
    ALTER TABLE public.points_transactions 
    DROP CONSTRAINT IF EXISTS points_transactions_source_check;
  END IF;
  
  -- Add new constraint with 'signup' included
  ALTER TABLE public.points_transactions 
  ADD CONSTRAINT points_transactions_source_check 
  CHECK (source IN (
    'visit', 
    'signup',
    'referral', 
    'share', 
    'birthday', 
    'game_bonus', 
    'manual_add', 
    'manual_remove', 
    'redemption',
    'reward_redemption',
    'refund'
  ));
END $$;

-- 4. Backfill signup points for existing users (optional)
-- =============================================
-- Award 10 points to users who signed up but never got signup bonus
-- Only backfill users created in the last 30 days to avoid massive data changes
DO $$
DECLARE
  v_backfill_count INTEGER := 0;
  v_user_record RECORD;
BEGIN
  FOR v_user_record IN 
    SELECT u.id, u.email, u.created_at
    FROM public.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.points_transactions pt
      WHERE pt.user_id = u.id AND pt.source = 'signup'
    )
    AND u.created_at >= NOW() - INTERVAL '30 days'
  LOOP
    -- Award signup points
    PERFORM public.add_points(
      v_user_record.id,
      10,
      'signup',
      'Retroactive welcome bonus'
    );
    v_backfill_count := v_backfill_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Backfilled signup points for % users', v_backfill_count;
END $$;

-- 5. Verification queries
-- =============================================
-- Check that functions were created successfully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'handle_new_user function not created!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'can_check_in' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'can_check_in function not created!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'on_auth_user_created trigger not created!';
  END IF;
  
  RAISE NOTICE '✅ All functions and triggers created successfully!';
END $$;

-- Final success message
SELECT '✅ Signup points and check-in logic fixed!' as message,
       'New users will now receive 10 points on signup' as signup_fix,
       'Users can check in once per calendar day' as checkin_fix,
       'Existing users from last 30 days have been backfilled' as backfill_status;
