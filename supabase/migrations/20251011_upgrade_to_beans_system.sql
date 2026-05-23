-- =============================================
-- UPGRADE TO BEANS SYSTEM
-- =============================================
-- Migrates from low-value points to high-value beans
-- Adds signup bonus with free coffee
-- Updates all reward costs
-- Maintains backward compatibility
-- =============================================

-- =============================================
-- STEP 1: MULTIPLY EXISTING USER BALANCES BY 10
-- =============================================
-- This ensures existing users maintain purchasing power
-- when we increase reward costs

DO $$
DECLARE
  v_transaction RECORD;
  v_multiplier INTEGER := 10;
BEGIN
  -- Update all existing transactions
  FOR v_transaction IN 
    SELECT id, amount, balance_after 
    FROM public.points_transactions 
    ORDER BY created_at ASC
  LOOP
    UPDATE public.points_transactions
    SET 
      amount = amount * v_multiplier,
      balance_after = balance_after * v_multiplier
    WHERE id = v_transaction.id;
  END LOOP;
  
  RAISE NOTICE 'Multiplied all existing balances by %', v_multiplier;
END $$;

-- =============================================
-- STEP 2: UPDATE POINTS_CONFIG WITH NEW VALUES
-- =============================================

-- Update existing configs
UPDATE public.points_config SET points_amount = 250 WHERE action_type = 'signup';
UPDATE public.points_config SET points_amount = 50 WHERE action_type = 'daily_checkin';
UPDATE public.points_config SET points_amount = 100 WHERE action_type = 'profile_complete';
UPDATE public.points_config SET points_amount = 300 WHERE action_type = 'birthday_bonus';
UPDATE public.points_config SET points_amount = 200 WHERE action_type = 'streak_7_days';
UPDATE public.points_config SET points_amount = 1500 WHERE action_type = 'streak_30_days';
UPDATE public.points_config SET points_amount = 400 WHERE action_type = 'referral_signup';
UPDATE public.points_config SET points_amount = 600 WHERE action_type = 'referral_first_purchase';
UPDATE public.points_config SET points_amount = 150 WHERE action_type = 'social_share';
UPDATE public.points_config SET points_amount = 250 WHERE action_type = 'review_posted';

-- Update game prizes
UPDATE public.points_config SET points_amount = 75 WHERE action_type = 'first_game_play';
UPDATE public.points_config SET points_amount = 75 WHERE action_type = 'game_win_small';
UPDATE public.points_config SET points_amount = 150 WHERE action_type = 'game_win_medium';
UPDATE public.points_config SET points_amount = 250 WHERE action_type = 'game_win_large';
UPDATE public.points_config SET points_amount = 500 WHERE action_type = 'game_win_jackpot';

-- =============================================
-- STEP 3: ADD NEW POINT CONFIGS
-- =============================================

-- Add 14-day streak
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'streak_14_days',
  500,
  'Check in 14 days in a row',
  NULL,
  NULL,
  FALSE,
  '{"streak_required": 14}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 500,
  description = 'Check in 14 days in a row',
  metadata = '{"streak_required": 14}'::jsonb;

-- Add general game play (any game)
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'game_play',
  75,
  'Play any mini-game',
  NULL,
  3,
  FALSE,
  '{"requires_checkin": true}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 75,
  max_per_day = 3,
  metadata = '{"requires_checkin": true}'::jsonb;

-- Add general game win (any game)
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'game_win',
  250,
  'Win any mini-game',
  NULL,
  3,
  FALSE,
  '{"requires_checkin": true}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 250,
  max_per_day = 3,
  metadata = '{"requires_checkin": true}'::jsonb;

-- Add quiz perfect score
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'quiz_perfect',
  200,
  'Perfect score on quiz',
  NULL,
  1,
  FALSE,
  '{"requires_checkin": true}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 200,
  metadata = '{"requires_checkin": true}'::jsonb;

-- Add GPS duck near Penkey
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'gps_duck_near',
  150,
  'Find GPS duck near Penkey',
  NULL,
  NULL,
  FALSE,
  '{"location_based": true, "max_distance_meters": 100}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 150,
  metadata = '{"location_based": true, "max_distance_meters": 100}'::jsonb;

-- Add Golden Bean (far away)
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'golden_bean_far',
  750,
  'Find Golden Bean (farther location)',
  NULL,
  NULL,
  FALSE,
  '{"location_based": true, "rare": true}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 750,
  metadata = '{"location_based": true, "rare": true}'::jsonb;

-- Add social share milestone
INSERT INTO public.points_config (
  action_type, 
  points_amount, 
  description, 
  min_interval_hours, 
  max_per_day, 
  requires_verification, 
  metadata
) VALUES (
  'social_share_milestone',
  150,
  'Share milestone on social media',
  24,
  2,
  FALSE,
  '{"platforms": ["facebook", "twitter", "instagram"]}'::jsonb
) ON CONFLICT (action_type) DO UPDATE SET
  points_amount = 150,
  min_interval_hours = 24,
  max_per_day = 2;

-- =============================================
-- STEP 4: UPDATE POINTS_REWARDS COSTS
-- =============================================

-- First, expand the reward_type check constraint to include 'badge'
DO $$
BEGIN
  -- Drop the old constraint
  ALTER TABLE public.points_rewards 
  DROP CONSTRAINT IF EXISTS points_rewards_reward_type_check;
  
  -- Add new constraint with 'badge' included
  ALTER TABLE public.points_rewards 
  ADD CONSTRAINT points_rewards_reward_type_check 
  CHECK (reward_type IN ('fixed_discount', 'percentage_discount', 'free_item', 'badge'));
  
  RAISE NOTICE 'Updated reward_type constraint to include badge';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed or already updated: %', SQLERRM;
END $$;

-- Update existing rewards
UPDATE public.points_rewards 
SET points_required = 1500 
WHERE name LIKE '%Pastry%' OR name LIKE '%pastry%';

UPDATE public.points_rewards 
SET points_required = 4000 
WHERE name = '£5 Off Voucher';

UPDATE public.points_rewards 
SET points_required = 8000 
WHERE name = '£10 Off Voucher';

UPDATE public.points_rewards 
SET points_required = 6000 
WHERE name = '20% Off Voucher';

-- Add new high-tier rewards
INSERT INTO public.points_rewards (
  name, 
  description, 
  reward_type, 
  discount_value, 
  points_required, 
  expiry_days, 
  active
) VALUES (
  'Reusable Cup',
  'Eco-friendly Penkey branded reusable cup',
  'free_item',
  NULL,
  12000,
  90,
  TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO public.points_rewards (
  name, 
  description, 
  reward_type, 
  discount_value, 
  points_required, 
  expiry_days, 
  active
) VALUES (
  'Penkey Hoodie',
  'Exclusive Penkey branded hoodie - Limited edition!',
  'free_item',
  NULL,
  25000,
  90,
  TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO public.points_rewards (
  name, 
  description, 
  reward_type, 
  discount_value, 
  points_required, 
  expiry_days, 
  active
) VALUES (
  'Legend Status',
  'Lifetime VIP status with exclusive perks and priority service',
  'badge',
  NULL,
  50000,
  NULL,
  TRUE
) ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 5: CREATE SIGNUP BONUS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.award_signup_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_free_coffee_reward_id UUID;
BEGIN
  -- Get Free Coffee reward ID
  SELECT id INTO v_free_coffee_reward_id
  FROM public.rewards
  WHERE name = 'Free Coffee' AND active = TRUE
  LIMIT 1;
  
  -- Award 250 beans as pending (unlocks on first check-in)
  INSERT INTO public.pending_rewards (
    user_id,
    reward_type,
    amount,
    reward_name,
    reward_description,
    source,
    expires_at,
    metadata
  ) VALUES (
    NEW.id,
    'points',
    250,
    'Welcome Bonus - 250 Beans',
    'Welcome to Penkey! Check in at our shop to claim your welcome beans.',
    'signup_bonus',
    NOW() + INTERVAL '30 days',
    '{"auto_award": true, "requires_checkin": true}'::jsonb
  );
  
  -- Award free coffee voucher as pending (unlocks on first check-in)
  IF v_free_coffee_reward_id IS NOT NULL THEN
    INSERT INTO public.pending_rewards (
      user_id,
      reward_type,
      reward_id,
      amount,
      reward_name,
      reward_description,
      source,
      expires_at,
      metadata
    ) VALUES (
      NEW.id,
      'voucher',
      v_free_coffee_reward_id,
      1,
      'Welcome Free Coffee',
      'Enjoy a free coffee on us! Visit Penkey to claim your welcome gift.',
      'signup_bonus',
      NOW() + INTERVAL '30 days',
      '{"requires_checkin": true, "requires_purchase": false}'::jsonb
    );
  END IF;
  
  -- Update pending rewards count
  UPDATE public.users
  SET pending_rewards_count = 2
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.award_signup_bonus IS 'Awards 250 beans + free coffee to new users (pending until first check-in)';

-- =============================================
-- STEP 6: ATTACH SIGNUP BONUS TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS on_user_signup_bonus ON public.users;
CREATE TRIGGER on_user_signup_bonus
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.award_signup_bonus();

-- =============================================
-- STEP 7: UPDATE STREAK BONUS LOGIC
-- =============================================

CREATE OR REPLACE FUNCTION public.award_streak_bonuses(p_user_id UUID, p_streak INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_bonuses JSONB := '[]'::jsonb;
  v_bonus_points INTEGER := 0;
BEGIN
  -- Award 7-day streak bonus
  IF p_streak = 7 THEN
    v_bonus_points := public.get_points_for_action('streak_7_days');
    IF v_bonus_points > 0 THEN
      PERFORM public.add_points(
        p_user_id,
        v_bonus_points,
        'streak_7_days',
        '7-day check-in streak bonus!',
        jsonb_build_object('streak', p_streak)
      );
      v_bonuses := v_bonuses || jsonb_build_object('streak', 7, 'points', v_bonus_points);
    END IF;
  END IF;
  
  -- Award 14-day streak bonus
  IF p_streak = 14 THEN
    v_bonus_points := public.get_points_for_action('streak_14_days');
    IF v_bonus_points > 0 THEN
      PERFORM public.add_points(
        p_user_id,
        v_bonus_points,
        'streak_14_days',
        '14-day check-in streak bonus! You''re on fire!',
        jsonb_build_object('streak', p_streak)
      );
      v_bonuses := v_bonuses || jsonb_build_object('streak', 14, 'points', v_bonus_points);
    END IF;
  END IF;
  
  -- Award 30-day streak bonus
  IF p_streak = 30 THEN
    v_bonus_points := public.get_points_for_action('streak_30_days');
    IF v_bonus_points > 0 THEN
      PERFORM public.add_points(
        p_user_id,
        v_bonus_points,
        'streak_30_days',
        '30-day check-in streak bonus! Legend status!',
        jsonb_build_object('streak', p_streak)
      );
      v_bonuses := v_bonuses || jsonb_build_object('streak', 30, 'points', v_bonus_points);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'bonuses_awarded', v_bonuses,
    'total_bonus_points', v_bonus_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.award_streak_bonuses IS 'Awards bonus beans for check-in streaks (7, 14, 30 days)';

-- =============================================
-- STEP 8: UPDATE CHECK-IN FUNCTION TO AWARD STREAKS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_check_in_streak(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_check_in TIMESTAMP;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_longest_streak INTEGER;
  v_hours_since_last INTEGER;
  v_streak_bonuses JSONB;
BEGIN
  -- Get user's last check-in and current streak
  SELECT last_check_in, check_in_streak, longest_streak
  INTO v_last_check_in, v_current_streak, v_longest_streak
  FROM public.users
  WHERE id = p_user_id;
  
  -- Calculate hours since last check-in
  IF v_last_check_in IS NOT NULL THEN
    v_hours_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_check_in)) / 3600;
  ELSE
    v_hours_since_last := 999; -- First check-in
  END IF;
  
  -- Update streak
  IF v_hours_since_last <= 48 THEN
    -- Within 48 hours = continue streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Broke streak, start over
    v_new_streak := 1;
  END IF;
  
  -- Update longest streak if needed
  IF v_new_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_new_streak;
  END IF;
  
  -- Update user
  UPDATE public.users
  SET last_check_in = NOW(),
      check_in_streak = v_new_streak,
      longest_streak = v_longest_streak,
      total_check_ins = COALESCE(total_check_ins, 0) + 1,
      check_in_streak_multiplier = CASE
        WHEN v_new_streak >= 30 THEN 3.0
        WHEN v_new_streak >= 14 THEN 2.0
        WHEN v_new_streak >= 7 THEN 1.5
        WHEN v_new_streak >= 3 THEN 1.25
        ELSE 1.0
      END,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Award streak bonuses if applicable
  v_streak_bonuses := public.award_streak_bonuses(p_user_id, v_new_streak);
  
  RETURN jsonb_build_object(
    'streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'multiplier', CASE
      WHEN v_new_streak >= 30 THEN 3.0
      WHEN v_new_streak >= 14 THEN 2.0
      WHEN v_new_streak >= 7 THEN 1.5
      WHEN v_new_streak >= 3 THEN 1.25
      ELSE 1.0
    END,
    'streak_broken', v_hours_since_last > 48,
    'bonuses', v_streak_bonuses
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_check_in_streak IS 'Updates user check-in streak and awards milestone bonuses';

-- =============================================
-- STEP 9: ADD BRANDING METADATA
-- =============================================

-- Add app settings for beans branding
DO $$
BEGIN
  -- Create app_settings table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Insert beans branding settings
  INSERT INTO public.app_settings (key, value, description) VALUES
  ('currency_name', '"beans"'::jsonb, 'Display name for points currency'),
  ('currency_name_singular', '"bean"'::jsonb, 'Singular form of currency'),
  ('currency_icon', '"🫘"'::jsonb, 'Icon/emoji for currency'),
  ('currency_color', '"#8B4513"'::jsonb, 'Brand color for currency (brown)'),
  ('signup_bonus_enabled', 'true'::jsonb, 'Enable signup bonus (250 beans + free coffee)'),
  ('signup_bonus_points', '250'::jsonb, 'Beans awarded on signup'),
  ('signup_bonus_includes_coffee', 'true'::jsonb, 'Include free coffee with signup')
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();
END $$;

-- =============================================
-- STEP 10: CREATE MIGRATION NOTIFICATION (OPTIONAL)
-- =============================================

-- Queue email to all existing users about the upgrade
-- This is wrapped in a try-catch so it doesn't fail if email template doesn't exist yet
DO $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_emails_queued INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Check if email functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'queue_email_from_template') THEN
    -- Only notify users who have points
    FOR v_user IN
      SELECT DISTINCT u.id, u.email, u.name
      FROM public.users u
      JOIN public.points_transactions pt ON pt.user_id = u.id
      WHERE u.email IS NOT NULL
      LIMIT 100 -- Limit to prevent overwhelming email queue
    LOOP
      BEGIN
        -- Try to queue upgrade notification email
        IF public.can_send_email(v_user.id, 'announcement') THEN
          PERFORM public.queue_email_from_template(
            'system_upgrade_beans',
            v_user.email,
            v_user.id,
            jsonb_build_object(
              'name', v_user.name,
              'oldCurrency', 'points',
              'newCurrency', 'beans',
              'multiplier', 10,
              'newBalance', public.get_user_points(v_user.id),
              'appUrl', v_app_url
            )
          );
          v_emails_queued := v_emails_queued + 1;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Template doesn't exist yet, skip email notification
          RAISE NOTICE 'Email template not found - skipping email notifications';
          EXIT; -- Exit the loop
      END;
    END LOOP;
    
    IF v_emails_queued > 0 THEN
      RAISE NOTICE 'Queued % migration notification emails', v_emails_queued;
    ELSE
      RAISE NOTICE 'Email notifications skipped (template not found or no eligible users)';
    END IF;
  ELSE
    RAISE NOTICE 'Email system not set up - skipping email notifications';
  END IF;
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_total_points INTEGER;
  v_total_configs INTEGER;
  v_total_rewards INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_total_configs FROM public.points_config WHERE active = TRUE;
  SELECT COUNT(*) INTO v_total_rewards FROM public.points_rewards WHERE active = TRUE;
  SELECT COALESCE(SUM(balance_after), 0) INTO v_total_points 
  FROM (
    SELECT DISTINCT ON (user_id) balance_after 
    FROM public.points_transactions 
    ORDER BY user_id, created_at DESC
  ) AS latest_balances;
  
  RAISE NOTICE '✅ BEANS SYSTEM UPGRADE COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '👥 Total Users: %', v_total_users;
  RAISE NOTICE '🫘 Total Beans in Circulation: %', v_total_points;
  RAISE NOTICE '⚙️  Active Point Configs: %', v_total_configs;
  RAISE NOTICE '🎁 Active Rewards: %', v_total_rewards;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎉 Signup Bonus: 250 beans + Free Coffee';
  RAISE NOTICE '📧 Email notifications: Optional (template can be added later)';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Next: Run POST_MIGRATION_VERIFICATION.sql to verify';
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- View updated point configs
SELECT 
  action_type,
  points_amount as beans,
  description,
  active
FROM public.points_config
WHERE active = TRUE
ORDER BY points_amount DESC;

-- View updated rewards
SELECT 
  name,
  points_required as beans_cost,
  reward_type,
  active
FROM public.points_rewards
WHERE active = TRUE
ORDER BY points_required ASC;
