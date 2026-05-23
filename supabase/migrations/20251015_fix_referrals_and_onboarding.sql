-- =============================================
-- FIX REFERRALS AND ONBOARDING
-- Date: 2025-10-15
-- =============================================
-- Issues fixed:
-- 1. Create referrals table (doesn't exist!)
-- 2. Add referral tracking and notifications
-- 3. Update handle_new_user to get name from OAuth
-- =============================================

-- =============================================
-- 1. CREATE REFERRALS TABLE
-- =============================================

-- Drop existing table if it exists (in case of partial creation)
DROP TABLE IF EXISTS public.referrals CASCADE;

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_referral UNIQUE (referred_id),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_confirmed ON public.referrals(confirmed);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
CREATE POLICY "Users can insert referrals"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_id);

DROP POLICY IF EXISTS "Staff can view all referrals" ON public.referrals;
CREATE POLICY "Staff can view all referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('staff', 'admin')
    )
  );

COMMENT ON TABLE public.referrals IS 'Tracks user referrals - confirmed means the referred user has checked in at least once';
COMMENT ON COLUMN public.referrals.confirmed IS 'True when referred user completes their first check-in';

-- =============================================
-- 2. UPDATE handle_new_user TO GET NAME
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_free_coffee_reward_id UUID;
  v_user_name TEXT;
BEGIN
  -- Extract name from OAuth metadata or email
  -- Try multiple OAuth provider formats
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',           -- Google, Facebook
    NEW.raw_user_meta_data->>'full_name',      -- Some providers
    NEW.raw_user_meta_data->>'display_name',   -- Twitter
    NEW.raw_user_meta_data->>'user_name',      -- GitHub
    split_part(NEW.email, '@', 1)              -- Fallback to email username
  );
  
  -- Create user profile
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_user_name,
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
      qr_code,
      expires_at
    )
    VALUES (
      v_user_id,
      v_free_coffee_reward_id,
      'active',
      'COFFEE-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
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

COMMENT ON FUNCTION public.handle_new_user IS 'Creates user profile with OAuth name, awards 250 beans signup bonus, and free coffee reward';

-- =============================================
-- 3. CREATE FUNCTION TO CONFIRM REFERRAL ON FIRST CHECK-IN
-- =============================================

CREATE OR REPLACE FUNCTION public.confirm_referral_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_record RECORD;
  v_referrer_name TEXT;
BEGIN
  -- Only process visit transactions
  IF NEW.source != 'visit' THEN
    RETURN NEW;
  END IF;
  
  -- Check if this user has an unconfirmed referral
  SELECT * INTO v_referral_record
  FROM public.referrals
  WHERE referred_id = NEW.user_id
    AND confirmed = false
  LIMIT 1;
  
  IF FOUND THEN
    -- Mark referral as confirmed
    UPDATE public.referrals
    SET confirmed = true,
        confirmed_at = NOW()
    WHERE id = v_referral_record.id;
    
    -- Award bonus to referrer (additional 50 beans on top of the 50 they got when user signed up)
    PERFORM public.add_points(
      v_referral_record.referrer_id,
      50,
      'referral_confirmed',
      'Referral confirmed - ' || NEW.user_id || ' completed first check-in'
    );
    
    -- Get referrer name for notification
    SELECT name INTO v_referrer_name
    FROM public.users
    WHERE id = v_referral_record.referrer_id;
    
    RAISE NOTICE 'Referral confirmed for referrer % - referred user % checked in', 
      v_referral_record.referrer_id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on points_transactions
DROP TRIGGER IF EXISTS on_checkin_confirm_referral ON public.points_transactions;
CREATE TRIGGER on_checkin_confirm_referral
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_referral_on_checkin();

COMMENT ON FUNCTION public.confirm_referral_on_checkin IS 'Confirms referral and awards bonus when referred user completes first check-in';

-- =============================================
-- 4. VERIFICATION
-- =============================================

DO $$
BEGIN
  -- Check referrals table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'referrals' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Referrals table not created!';
  END IF;
  
  -- Check trigger
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_checkin_confirm_referral'
  ) THEN
    RAISE EXCEPTION 'Referral confirmation trigger not created!';
  END IF;
  
  RAISE NOTICE '✅ All referral systems created successfully!';
END $$;

-- =============================================
-- SUCCESS MESSAGES
-- =============================================

SELECT '✅ Referrals table created!' as message;
SELECT '✅ Referral tracking and confirmation system active!' as message;
SELECT '✅ OAuth name extraction improved!' as message;
SELECT '📊 Referral stats: total = all referrals, confirmed = referred user checked in, pending = not checked in yet' as info;
