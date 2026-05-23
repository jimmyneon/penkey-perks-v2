-- =============================================
-- ADD ALL EMAIL TRIGGERS
-- =============================================
-- Automates all 15 new email templates
-- =============================================

-- =============================================
-- 1. BADGE EARNED TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_badge_earned_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_badge RECORD;
  v_app_url TEXT;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
  SELECT * INTO v_badge FROM public.badge_tiers WHERE tier = NEW.badge_tier;
  
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  PERFORM public.queue_email_from_template(
    'badge_earned',
    v_user.email,
    v_user.id,
    jsonb_build_object(
      'name', v_user.name,
      'badgeName', v_badge.name,
      'badgeTitle', v_badge.fun_title,
      'lifetimePoints', NEW.lifetime_points,
      'perks', COALESCE(v_badge.perks::text, 'Exclusive member benefits'),
      'appUrl', v_app_url
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_badge_earned_email ON public.user_badges;
CREATE TRIGGER send_badge_earned_email
  AFTER INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_badge_earned_email();

-- =============================================
-- 2. FIRST STAMP TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_first_stamp_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_stamp_count INTEGER;
BEGIN
  -- Count total stamps for this user
  SELECT COUNT(*) INTO v_stamp_count
  FROM public.coffee_stamps
  WHERE user_id = NEW.user_id;
  
  -- Only send if this is their first stamp
  IF v_stamp_count = 1 THEN
    SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
    v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
    
    PERFORM public.queue_email_from_template(
      'first_stamp',
      v_user.email,
      v_user.id,
      jsonb_build_object(
        'name', v_user.name,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_first_stamp_email ON public.coffee_stamps;
CREATE TRIGGER send_first_stamp_email
  AFTER INSERT ON public.coffee_stamps
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_first_stamp_email();

-- =============================================
-- 3. HALFWAY THERE TRIGGER (5 stamps)
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_halfway_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_stamp_count INTEGER;
BEGIN
  -- Count total stamps for this user
  SELECT COUNT(*) INTO v_stamp_count
  FROM public.coffee_stamps
  WHERE user_id = NEW.user_id;
  
  -- Only send if they just hit exactly 5 stamps
  IF v_stamp_count = 5 THEN
    SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
    v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
    
    PERFORM public.queue_email_from_template(
      'halfway_there',
      v_user.email,
      v_user.id,
      jsonb_build_object(
        'name', v_user.name,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_halfway_email ON public.coffee_stamps;
CREATE TRIGGER send_halfway_email
  AFTER INSERT ON public.coffee_stamps
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_halfway_email();

-- =============================================
-- 4. BIG WIN TRIGGER (3+ stamps from game)
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_big_win_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_game RECORD;
  v_app_url TEXT;
  v_total_stamps INTEGER;
BEGIN
  -- Only send for big wins (3+ stamps or reward)
  IF NEW.prize_value >= 3 OR NEW.prize_type = 'reward' THEN
    SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
    SELECT * INTO v_game FROM public.mini_games WHERE id = NEW.game_id;
    
    -- Get total stamps
    SELECT COUNT(*) INTO v_total_stamps
    FROM public.coffee_stamps
    WHERE user_id = NEW.user_id;
    
    v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
    
    PERFORM public.queue_email_from_template(
      'big_win',
      v_user.email,
      v_user.id,
      jsonb_build_object(
        'name', v_user.name,
        'gameName', v_game.display_name,
        'prizeWon', CASE 
          WHEN NEW.prize_type = 'reward' THEN 'Instant Reward!'
          ELSE NEW.prize_value || ' Bonus Stamps!'
        END,
        'totalStamps', v_total_stamps,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_big_win_email ON public.game_plays;
CREATE TRIGGER send_big_win_email
  AFTER INSERT ON public.game_plays
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_big_win_email();

-- =============================================
-- 5. STAMP STREAK TRIGGER (7 days)
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_stamp_streak_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_streak_days INTEGER;
  v_recent_stamps RECORD;
BEGIN
  -- Check if user has stamps for the last 7 consecutive days
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_streak_days
  FROM public.coffee_stamps
  WHERE user_id = NEW.user_id
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Only send if they just completed a 7-day streak
  IF v_streak_days = 7 THEN
    -- Check if we haven't already sent this email recently
    IF NOT EXISTS (
      SELECT 1 FROM public.email_logs
      WHERE recipient_user_id = NEW.user_id
        AND template_id = (SELECT id FROM public.email_templates WHERE name = 'stamp_streak')
        AND sent_at > NOW() - INTERVAL '7 days'
    ) THEN
      SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
      v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
      
      PERFORM public.queue_email_from_template(
        'stamp_streak',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'streakDays', v_streak_days,
          'bonusReward', '2 Bonus Stamps',
          'appUrl', v_app_url
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_stamp_streak_email ON public.coffee_stamps;
CREATE TRIGGER send_stamp_streak_email
  AFTER INSERT ON public.coffee_stamps
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_stamp_streak_email();

-- =============================================
-- 6. NEW REWARD AVAILABLE TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_new_reward_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
BEGIN
  -- Only send for new active rewards
  IF NEW.active = true THEN
    v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
    
    -- Send to all active users
    FOR v_user IN SELECT * FROM public.users LOOP
      PERFORM public.queue_email_from_template(
        'new_reward_available',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'rewardName', NEW.name,
          'rewardDescription', COALESCE(NEW.description, 'A new reward is available!'),
          'rewardValue', NEW.value,
          'stampsRequired', NEW.duck_threshold,
          'appUrl', v_app_url
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_new_reward_email ON public.rewards;
CREATE TRIGGER send_new_reward_email
  AFTER INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_reward_email();

-- =============================================
-- 7. REWARD EXPIRED TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_reward_expired_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_reward RECORD;
  v_app_url TEXT;
BEGIN
  -- Only send when status changes to expired
  IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
    SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
    SELECT * INTO v_reward FROM public.rewards WHERE id = NEW.reward_id;
    
    v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
    
    PERFORM public.queue_email_from_template(
      'reward_expired',
      v_user.email,
      v_user.id,
      jsonb_build_object(
        'name', v_user.name,
        'rewardName', v_reward.name,
        'expiredDate', TO_CHAR(NEW.expires_at, 'FMDay, FMMonth DD, YYYY'),
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_reward_expired_email ON public.user_rewards;
CREATE TRIGGER send_reward_expired_email
  AFTER UPDATE ON public.user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_reward_expired_email();

-- =============================================
-- 8. REFERRAL MILESTONE TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_referral_milestone_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_total_referrals INTEGER;
  v_bonus_reward TEXT;
BEGIN
  -- Only check when referral is confirmed
  IF NEW.confirmed = true AND OLD.confirmed = false THEN
    -- Count total confirmed referrals
    SELECT COUNT(*) INTO v_total_referrals
    FROM public.referrals
    WHERE referrer_id = NEW.referrer_id AND confirmed = true;
    
    -- Check if hit a milestone (5, 10, 25, 50)
    IF v_total_referrals IN (5, 10, 25, 50) THEN
      SELECT * INTO v_user FROM public.users WHERE id = NEW.referrer_id;
      v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
      
      -- Determine bonus reward
      v_bonus_reward := CASE v_total_referrals
        WHEN 5 THEN '5 Bonus Stamps'
        WHEN 10 THEN '10 Bonus Stamps'
        WHEN 25 THEN 'Free Coffee Reward'
        WHEN 50 THEN 'VIP Badge + Free Coffee'
        ELSE 'Special Reward'
      END;
      
      PERFORM public.queue_email_from_template(
        'referral_milestone',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'totalReferrals', v_total_referrals,
          'bonusReward', v_bonus_reward,
          'appUrl', v_app_url
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS send_referral_milestone_email ON public.referrals;
CREATE TRIGGER send_referral_milestone_email
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_referral_milestone_email();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.trigger_badge_earned_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_first_stamp_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_halfway_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_big_win_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_stamp_streak_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_new_reward_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_reward_expired_email TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_referral_milestone_email TO service_role;

-- Success message
SELECT '✅ All email triggers created!' as message;
SELECT '8 database triggers configured' as count;
