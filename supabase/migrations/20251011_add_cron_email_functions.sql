-- =============================================
-- ADD CRON EMAIL FUNCTIONS
-- =============================================
-- Functions for scheduled emails (called by cron jobs)
-- =============================================

-- =============================================
-- 1. SEND GAME AVAILABLE REMINDERS
-- =============================================

CREATE OR REPLACE FUNCTION public.send_game_available_reminders()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_games_available TEXT;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find users who haven't played games today
  FOR v_user IN
    SELECT u.id, u.email, u.name
    FROM public.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.game_plays gp
      WHERE gp.user_id = u.id
        AND gp.created_at >= CURRENT_DATE
    )
    -- Don't send if already sent today
    AND NOT EXISTS (
      SELECT 1 FROM public.email_logs el
      WHERE el.recipient_user_id = u.id
        AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'game_available')
        AND el.sent_at >= CURRENT_DATE
    )
    -- Only active users (checked in within last 7 days)
    AND EXISTS (
      SELECT 1 FROM public.coffee_stamps cs
      WHERE cs.user_id = u.id
        AND cs.created_at > NOW() - INTERVAL '7 days'
    )
  LOOP
    -- Get available games
    SELECT string_agg(display_name, ', ') INTO v_games_available
    FROM public.mini_games
    WHERE enabled = true;
    
    IF public.can_send_email(v_user.id, 'marketing') THEN
      PERFORM public.queue_email_from_template(
        'game_available',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'gamesAvailable', v_games_available,
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
-- 2. SEND ANNIVERSARY EMAILS
-- =============================================

CREATE OR REPLACE FUNCTION public.send_anniversary_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_years INTEGER;
  v_total_stamps INTEGER;
  v_total_rewards INTEGER;
  v_anniversary_gift TEXT;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find users with anniversary today
  FOR v_user IN
    SELECT u.id, u.email, u.name, u.created_at
    FROM public.users u
    WHERE EXTRACT(MONTH FROM u.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM u.created_at) = EXTRACT(DAY FROM CURRENT_DATE)
      AND u.created_at < CURRENT_DATE
    -- Don't send if already sent this year
    AND NOT EXISTS (
      SELECT 1 FROM public.email_logs el
      WHERE el.recipient_user_id = u.id
        AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'anniversary')
        AND el.sent_at >= CURRENT_DATE - INTERVAL '350 days'
    )
  LOOP
    -- Calculate years
    v_years := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_user.created_at));
    
    -- Get stats
    SELECT COUNT(*) INTO v_total_stamps
    FROM public.coffee_stamps
    WHERE user_id = v_user.id;
    
    SELECT COUNT(*) INTO v_total_rewards
    FROM public.user_rewards
    WHERE user_id = v_user.id;
    
    -- Determine anniversary gift
    v_anniversary_gift := CASE 
      WHEN v_years = 1 THEN '5 Bonus Stamps'
      WHEN v_years = 2 THEN '10 Bonus Stamps + Free Coffee'
      WHEN v_years >= 3 THEN 'VIP Badge + Special Reward'
      ELSE '3 Bonus Stamps'
    END;
    
    IF public.can_send_email(v_user.id, 'marketing') THEN
      PERFORM public.queue_email_from_template(
        'anniversary',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'years', v_years,
          'yearsPlural', CASE WHEN v_years = 1 THEN '' ELSE 's' END,
          'totalStamps', v_total_stamps,
          'totalRewards', v_total_rewards,
          'anniversaryGift', v_anniversary_gift,
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
-- 3. SEND WEEKLY SUMMARY EMAILS
-- =============================================

CREATE OR REPLACE FUNCTION public.send_weekly_summary_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_stamps_this_week INTEGER;
  v_games_played INTEGER;
  v_rewards_earned INTEGER;
  v_referrals_confirmed INTEGER;
  v_total_stamps INTEGER;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Send to all active users
  FOR v_user IN
    SELECT u.id, u.email, u.name
    FROM public.users u
    WHERE EXISTS (
      SELECT 1 FROM public.coffee_stamps cs
      WHERE cs.user_id = u.id
        AND cs.created_at > NOW() - INTERVAL '30 days'
    )
  LOOP
    -- Get weekly stats
    SELECT COUNT(*) INTO v_stamps_this_week
    FROM public.coffee_stamps
    WHERE user_id = v_user.id
      AND created_at >= NOW() - INTERVAL '7 days';
    
    SELECT COUNT(*) INTO v_games_played
    FROM public.game_plays
    WHERE user_id = v_user.id
      AND created_at >= NOW() - INTERVAL '7 days';
    
    SELECT COUNT(*) INTO v_rewards_earned
    FROM public.user_rewards
    WHERE user_id = v_user.id
      AND created_at >= NOW() - INTERVAL '7 days';
    
    SELECT COUNT(*) INTO v_referrals_confirmed
    FROM public.referrals
    WHERE referrer_id = v_user.id
      AND confirmed = true
      AND confirmed_at >= NOW() - INTERVAL '7 days';
    
    SELECT COUNT(*) INTO v_total_stamps
    FROM public.coffee_stamps
    WHERE user_id = v_user.id;
    
    -- Only send if user had some activity
    IF v_stamps_this_week > 0 OR v_games_played > 0 THEN
      IF public.can_send_email(v_user.id, 'digest') THEN
        PERFORM public.queue_email_from_template(
          'weekly_summary',
          v_user.email,
          v_user.id,
          jsonb_build_object(
            'name', v_user.name,
            'stampsThisWeek', v_stamps_this_week,
            'gamesPlayed', v_games_played,
            'rewardsEarned', v_rewards_earned,
            'referralsConfirmed', v_referrals_confirmed,
            'totalStamps', v_total_stamps,
            'appUrl', v_app_url
          )
        );
        
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. SEND WEEKEND SPECIAL EMAILS
-- =============================================

CREATE OR REPLACE FUNCTION public.send_weekend_special_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_current_stamps INTEGER;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Send to active users
  FOR v_user IN
    SELECT u.id, u.email, u.name
    FROM public.users u
    WHERE EXISTS (
      SELECT 1 FROM public.coffee_stamps cs
      WHERE cs.user_id = u.id
        AND cs.created_at > NOW() - INTERVAL '14 days'
    )
  LOOP
    -- Get current stamps
    SELECT COUNT(*) INTO v_current_stamps
    FROM public.coffee_stamps
    WHERE user_id = v_user.id;
    
    IF public.can_send_email(v_user.id, 'marketing') THEN
      PERFORM public.queue_email_from_template(
        'weekend_special',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'weekendBonus', 'Double Stamps on Saturday!',
          'currentStamps', v_current_stamps,
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
-- 5. SEND MONTHLY REPORT EMAILS
-- =============================================

CREATE OR REPLACE FUNCTION public.send_monthly_report_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_month_name TEXT;
  v_stamps_month INTEGER;
  v_rewards_month INTEGER;
  v_badges_month INTEGER;
  v_rank INTEGER;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  v_month_name := TO_CHAR(NOW() - INTERVAL '1 month', 'FMMonth');
  
  -- Send to all users with activity last month
  FOR v_user IN
    SELECT u.id, u.email, u.name
    FROM public.users u
    WHERE EXISTS (
      SELECT 1 FROM public.coffee_stamps cs
      WHERE cs.user_id = u.id
        AND cs.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND cs.created_at < DATE_TRUNC('month', NOW())
    )
  LOOP
    -- Get monthly stats
    SELECT COUNT(*) INTO v_stamps_month
    FROM public.coffee_stamps
    WHERE user_id = v_user.id
      AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
      AND created_at < DATE_TRUNC('month', NOW());
    
    SELECT COUNT(*) INTO v_rewards_month
    FROM public.user_rewards
    WHERE user_id = v_user.id
      AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
      AND created_at < DATE_TRUNC('month', NOW());
    
    SELECT COUNT(*) INTO v_badges_month
    FROM public.user_badges
    WHERE user_id = v_user.id
      AND earned_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
      AND earned_at < DATE_TRUNC('month', NOW());
    
    -- Calculate rank (simplified - based on total stamps)
    SELECT COUNT(*) + 1 INTO v_rank
    FROM (
      SELECT user_id, COUNT(*) as stamp_count
      FROM public.coffee_stamps
      GROUP BY user_id
      HAVING COUNT(*) > (
        SELECT COUNT(*) FROM public.coffee_stamps WHERE user_id = v_user.id
      )
    ) ranked_users;
    
    IF public.can_send_email(v_user.id, 'digest') THEN
      PERFORM public.queue_email_from_template(
        'monthly_report',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'monthName', v_month_name,
          'totalStampsMonth', v_stamps_month,
          'rewardsEarnedMonth', v_rewards_month,
          'badgesEarned', v_badges_month,
          'rank', v_rank,
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
-- 6. SEND WIN-BACK EMAILS (30 days)
-- =============================================

CREATE OR REPLACE FUNCTION public.send_win_back_30_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_last_visit TEXT;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find users inactive for exactly 30 days
  FOR v_user IN
    SELECT u.id, u.email, u.name, MAX(cs.created_at) as last_stamp
    FROM public.users u
    LEFT JOIN public.coffee_stamps cs ON cs.user_id = u.id
    GROUP BY u.id, u.email, u.name
    HAVING MAX(cs.created_at) BETWEEN NOW() - INTERVAL '31 days' AND NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.email_logs el
      WHERE el.recipient_user_id = u.id
        AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'win_back_30')
        AND el.sent_at > NOW() - INTERVAL '30 days'
    )
  LOOP
    v_last_visit := TO_CHAR(v_user.last_stamp, 'FMMonth DD, YYYY');
    
    IF public.can_send_email(v_user.id, 'marketing') THEN
      PERFORM public.queue_email_from_template(
        'win_back_30',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'lastVisit', v_last_visit,
          'specialOffer', '3 Bonus Stamps on Your Return',
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
-- 7. SEND WIN-BACK EMAILS (60 days)
-- =============================================

CREATE OR REPLACE FUNCTION public.send_win_back_60_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find users inactive for exactly 60 days
  FOR v_user IN
    SELECT u.id, u.email, u.name
    FROM public.users u
    LEFT JOIN public.coffee_stamps cs ON cs.user_id = u.id
    GROUP BY u.id, u.email, u.name
    HAVING MAX(cs.created_at) BETWEEN NOW() - INTERVAL '61 days' AND NOW() - INTERVAL '60 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.email_logs el
      WHERE el.recipient_user_id = u.id
        AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'win_back_60')
        AND el.sent_at > NOW() - INTERVAL '60 days'
    )
  LOOP
    IF public.can_send_email(v_user.id, 'marketing') THEN
      PERFORM public.queue_email_from_template(
        'win_back_60',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'bonusStamps', '5 Bonus Stamps',
          'specialReward', 'Free Coffee on Your Return',
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
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.send_game_available_reminders TO service_role;
GRANT EXECUTE ON FUNCTION public.send_anniversary_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.send_weekly_summary_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.send_weekend_special_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.send_monthly_report_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.send_win_back_30_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.send_win_back_60_emails TO service_role;

-- Success message
SELECT '✅ All cron email functions created!' as message;
SELECT '7 scheduled email functions ready' as count;
