-- =============================================
-- ADD REFERRAL CODES TO USERS TABLE
-- Date: 2025-10-15
-- =============================================
-- Issue: Referral codes were generated on-the-fly and not stored
-- Solution: Add referral_code column and generate unique codes
-- =============================================

-- 1. Add referral_code column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Create function to generate simple random code
CREATE OR REPLACE FUNCTION generate_simple_referral_code()
RETURNS TEXT AS $$
BEGIN
  -- Generate 8 character random code (letters and numbers)
  RETURN UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- 3. Generate codes for existing users
UPDATE public.users
SET referral_code = generate_simple_referral_code()
WHERE referral_code IS NULL;

-- 4. Update the trigger to generate code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile with referral code
  INSERT INTO public.users (id, email, name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    generate_simple_referral_code()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never fail - just continue
    RETURN NEW;
END;
$$;

-- 5. Verify all users have codes
DO $$
DECLARE
  v_users_without_codes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users_without_codes
  FROM public.users
  WHERE referral_code IS NULL;
  
  IF v_users_without_codes > 0 THEN
    RAISE WARNING '% users still missing referral codes', v_users_without_codes;
  ELSE
    RAISE NOTICE '✅ All users have referral codes!';
  END IF;
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
RAISE NOTICE '✅ Referral codes added to users table!';
RAISE NOTICE 'ℹ️  Frontend code updated to use database codes';
RAISE NOTICE 'ℹ️  Old generateReferralCode() function no longer used';
