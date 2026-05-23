-- =============================================
-- SEED EMAIL TRIGGERS
-- =============================================
-- This migration creates automated email triggers
-- that fire when specific database events occur
-- =============================================

-- =============================================
-- 1. WELCOME EMAIL TRIGGER
-- =============================================

INSERT INTO public.email_triggers (
  name,
  description,
  template_id,
  event_type,
  table_name,
  conditions,
  delay_minutes,
  active
) VALUES (
  'user_signup',
  'Send welcome email when user signs up',
  (SELECT id FROM public.email_templates WHERE name = 'welcome_email'),
  'insert',
  'users',
  '{}'::jsonb,
  0,
  true
);

-- =============================================
-- 2. REWARD EARNED TRIGGER
-- =============================================

INSERT INTO public.email_triggers (
  name,
  description,
  template_id,
  event_type,
  table_name,
  conditions,
  delay_minutes,
  active
) VALUES (
  'reward_earned',
  'Send email when user earns a reward',
  (SELECT id FROM public.email_templates WHERE name = 'reward_earned'),
  'insert',
  'user_rewards',
  '{"status": "active"}'::jsonb,
  0,
  true
);

-- =============================================
-- 3. REWARD REDEEMED TRIGGER
-- =============================================

INSERT INTO public.email_triggers (
  name,
  description,
  template_id,
  event_type,
  table_name,
  conditions,
  delay_minutes,
  active
) VALUES (
  'reward_redeemed',
  'Send confirmation email when reward is redeemed',
  (SELECT id FROM public.email_templates WHERE name = 'reward_redeemed'),
  'update',
  'user_rewards',
  '{"status": "redeemed"}'::jsonb,
  0,
  true
);

-- =============================================
-- 4. REFERRAL CONFIRMED TRIGGER
-- =============================================

INSERT INTO public.email_triggers (
  name,
  description,
  template_id,
  event_type,
  table_name,
  conditions,
  delay_minutes,
  active
) VALUES (
  'referral_confirmed',
  'Send email when referral is confirmed',
  (SELECT id FROM public.email_templates WHERE name = 'referral_confirmed'),
  'update',
  'referrals',
  '{"confirmed": true}'::jsonb,
  0,
  true
);

-- =============================================
-- 5. CREATE TRIGGER FUNCTIONS
-- =============================================

-- Function to handle user signup emails
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_app_url TEXT;
BEGIN
  -- Get app URL from environment or use default
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Generate referral URL
  v_referral_code := SUBSTRING(MD5(NEW.id::TEXT), 1, 8);
  
  -- Queue welcome email
  PERFORM public.queue_email_from_template(
    'welcome_email',
    NEW.email,
    NEW.id,
    jsonb_build_object(
      'name', NEW.name,
      'referralUrl', v_app_url || '/signup?ref=' || v_referral_code,
      'appUrl', v_app_url
    ),
    0,
    (SELECT id FROM public.email_triggers WHERE name = 'user_signup')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle reward earned emails
CREATE OR REPLACE FUNCTION public.trigger_reward_earned_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_reward RECORD;
  v_app_url TEXT;
  v_qr_code_url TEXT;
  v_expiry_days INTEGER;
BEGIN
  -- Only send for new active rewards
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;
  
  -- Get user details
  SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
  
  -- Get reward details
  SELECT * INTO v_reward FROM public.rewards WHERE id = NEW.reward_id;
  
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Generate QR code URL (using API endpoint)
  v_qr_code_url := v_app_url || '/api/qr/' || NEW.qr_code;
  
  -- Calculate expiry days
  IF NEW.expires_at IS NOT NULL THEN
    v_expiry_days := EXTRACT(DAY FROM (NEW.expires_at - NOW()));
  ELSE
    v_expiry_days := 30; -- Default
  END IF;
  
  -- Queue reward earned email
  PERFORM public.queue_email_from_template(
    'reward_earned',
    v_user.email,
    v_user.id,
    jsonb_build_object(
      'name', v_user.name,
      'rewardName', v_reward.name,
      'rewardValue', v_reward.value,
      'qrCodeUrl', v_qr_code_url,
      'expiryDays', v_expiry_days,
      'appUrl', v_app_url
    ),
    0,
    (SELECT id FROM public.email_triggers WHERE name = 'reward_earned')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle reward redeemed emails
CREATE OR REPLACE FUNCTION public.trigger_reward_redeemed_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_reward RECORD;
  v_app_url TEXT;
BEGIN
  -- Only send when status changes to redeemed
  IF NEW.status != 'redeemed' OR OLD.status = 'redeemed' THEN
    RETURN NEW;
  END IF;
  
  -- Get user details
  SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
  
  -- Get reward details
  SELECT * INTO v_reward FROM public.rewards WHERE id = NEW.reward_id;
  
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Queue reward redeemed email
  PERFORM public.queue_email_from_template(
    'reward_redeemed',
    v_user.email,
    v_user.id,
    jsonb_build_object(
      'name', v_user.name,
      'rewardName', v_reward.name,
      'redeemedAt', TO_CHAR(NEW.redeemed_at, 'FMDay, FMMonth DD, YYYY'),
      'appUrl', v_app_url
    ),
    0,
    (SELECT id FROM public.email_triggers WHERE name = 'reward_redeemed')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle referral confirmed emails
CREATE OR REPLACE FUNCTION public.trigger_referral_confirmed_email()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer RECORD;
  v_referee RECORD;
  v_app_url TEXT;
  v_points_earned INTEGER;
BEGIN
  -- Only send when referral is newly confirmed
  IF NEW.confirmed != true OR OLD.confirmed = true THEN
    RETURN NEW;
  END IF;
  
  -- Get referrer details
  SELECT * INTO v_referrer FROM public.users WHERE id = NEW.referrer_id;
  
  -- Get referee details
  SELECT * INTO v_referee FROM public.users WHERE id = NEW.referee_id;
  
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Points earned for referral (typically 10-15 points)
  v_points_earned := 15;
  
  -- Queue referral confirmed email
  PERFORM public.queue_email_from_template(
    'referral_confirmed',
    v_referrer.email,
    v_referrer.id,
    jsonb_build_object(
      'name', v_referrer.name,
      'refereeName', v_referee.name,
      'pointsEarned', v_points_earned,
      'appUrl', v_app_url
    ),
    0,
    (SELECT id FROM public.email_triggers WHERE name = 'referral_confirmed')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. CREATE DATABASE TRIGGERS
-- =============================================

-- Trigger for welcome email
CREATE TRIGGER send_welcome_email
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();

-- Trigger for reward earned email
CREATE TRIGGER send_reward_earned_email
  AFTER INSERT ON public.user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_reward_earned_email();

-- Trigger for reward redeemed email
CREATE TRIGGER send_reward_redeemed_email
  AFTER UPDATE ON public.user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_reward_redeemed_email();

-- Trigger for referral confirmed email
CREATE TRIGGER send_referral_confirmed_email
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_referral_confirmed_email();

-- =============================================
-- 7. SCHEDULED EMAIL FUNCTION
-- =============================================

-- Function to check for expiring rewards and queue reminder emails
CREATE OR REPLACE FUNCTION public.send_expiring_reward_reminders()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_reward RECORD;
  v_user RECORD;
  v_app_url TEXT;
  v_qr_code_url TEXT;
  v_days_left INTEGER;
  v_days_plural TEXT;
  v_count INTEGER := 0;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find rewards expiring in 3 days
  FOR v_reward IN
    SELECT ur.*, r.name as reward_name, r.value as reward_value, u.id as user_id, u.email, u.name as user_name
    FROM public.user_rewards ur
    JOIN public.rewards r ON ur.reward_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE ur.status = 'active'
      AND ur.expires_at IS NOT NULL
      AND ur.expires_at > NOW()
      AND ur.expires_at <= NOW() + INTERVAL '3 days'
      -- Don't send if we already sent a reminder recently
      AND NOT EXISTS (
        SELECT 1 FROM public.email_logs el
        WHERE el.recipient_user_id = ur.user_id
          AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'reward_expiring')
          AND el.metadata->>'user_reward_id' = ur.id::text
          AND el.sent_at > NOW() - INTERVAL '2 days'
      )
  LOOP
    -- Calculate days left
    v_days_left := EXTRACT(DAY FROM (v_reward.expires_at - NOW()));
    v_days_plural := CASE WHEN v_days_left = 1 THEN '' ELSE 's' END;
    
    -- Generate QR code URL
    v_qr_code_url := v_app_url || '/api/qr/' || v_reward.qr_code;
    
    -- Check user preferences
    IF public.can_send_email(v_reward.user_id, 'marketing') THEN
      -- Queue expiring reward email
      PERFORM public.queue_email_from_template(
        'reward_expiring',
        v_reward.email,
        v_reward.user_id,
        jsonb_build_object(
          'name', v_reward.user_name,
          'rewardName', v_reward.reward_name,
          'daysLeft', v_days_left,
          'daysLeftPlural', v_days_plural,
          'qrCodeUrl', v_qr_code_url,
          'appUrl', v_app_url
        )
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send inactive user emails
CREATE OR REPLACE FUNCTION public.send_inactive_user_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_points_balance INTEGER;
  v_count INTEGER := 0;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find users who haven't checked in for 7 days
  FOR v_user IN
    SELECT u.id, u.email, u.name
    FROM public.users u
    WHERE NOT EXISTS (
      -- No recent check-ins
      SELECT 1 FROM public.transactions t
      WHERE t.user_id = u.id
        AND t.action = 'check_in'
        AND t.created_at > NOW() - INTERVAL '7 days'
    )
    -- Don't send if we already sent recently
    AND NOT EXISTS (
      SELECT 1 FROM public.email_logs el
      WHERE el.recipient_user_id = u.id
        AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'inactive_user')
        AND el.sent_at > NOW() - INTERVAL '7 days'
    )
    -- User created more than 7 days ago
    AND u.created_at < NOW() - INTERVAL '7 days'
  LOOP
    -- Get user's points balance
    SELECT COALESCE(SUM(amount), 0)::INTEGER INTO v_points_balance
    FROM public.points_transactions
    WHERE user_id = v_user.id;
    
    -- Check user preferences
    IF public.can_send_email(v_user.id, 'marketing') THEN
      -- Queue inactive user email
      PERFORM public.queue_email_from_template(
        'inactive_user',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'pointsBalance', v_points_balance,
          'appUrl', v_app_url
        )
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.trigger_welcome_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_reward_earned_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_reward_redeemed_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_referral_confirmed_email TO service_role;
GRANT EXECUTE ON FUNCTION public.send_expiring_reward_reminders TO service_role;
GRANT EXECUTE ON FUNCTION public.send_inactive_user_emails TO service_role;

-- =============================================
-- SUCCESS
-- =============================================

SELECT 'Email triggers created successfully!' as message;
SELECT COUNT(*) || ' triggers configured' as count FROM public.email_triggers;
