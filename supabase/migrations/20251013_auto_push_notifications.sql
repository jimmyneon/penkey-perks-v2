-- =============================================
-- AUTOMATIC PUSH NOTIFICATIONS VIA DATABASE TRIGGERS
-- Date: 2025-10-13
-- =============================================
-- This sets up automatic push notifications for key events
-- =============================================

-- 1. Function to send notification via API
-- =============================================
CREATE OR REPLACE FUNCTION notify_user_event(
  p_user_id UUID,
  p_template_name TEXT,
  p_variables JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
  v_app_url TEXT;
  v_cron_secret TEXT;
BEGIN
  -- Get app settings
  SELECT value INTO v_app_url FROM app_settings WHERE key = 'app_url';
  SELECT value INTO v_cron_secret FROM app_settings WHERE key = 'cron_secret';
  
  -- Call notification API
  PERFORM net.http_post(
    url := v_app_url || '/api/notifications/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_cron_secret
    ),
    body := jsonb_build_object(
      'userId', p_user_id,
      'templateName', p_template_name,
      'variables', p_variables,
      'channels', jsonb_build_object(
        'push', true,
        'email', false,
        'inApp', true
      )
    )
  );
  
  RAISE NOTICE 'Notification queued: % for user %', p_template_name, p_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Game Won (Prize Earned)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_game_won_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when user wins something (not 'nothing')
  IF NEW.prize_type != 'nothing' THEN
    PERFORM notify_user_event(
      NEW.user_id,
      'game_won',
      jsonb_build_object(
        'beans', NEW.prize_value,
        'gameName', (SELECT name FROM mini_games WHERE id = NEW.game_id),
        'prizeType', NEW.prize_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_game_won ON game_plays;
CREATE TRIGGER on_game_won
  AFTER INSERT ON game_plays
  FOR EACH ROW
  WHEN (NEW.prize_type != 'nothing')
  EXECUTE FUNCTION trigger_game_won_notification();

-- 3. Trigger: Reward Earned
-- =============================================
CREATE OR REPLACE FUNCTION trigger_reward_earned_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when reward is first created
  IF TG_OP = 'INSERT' THEN
    PERFORM notify_user_event(
      NEW.user_id,
      'reward_earned',
      jsonb_build_object(
        'rewardName', (SELECT name FROM rewards WHERE id = NEW.reward_id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reward_earned ON user_rewards;
CREATE TRIGGER on_reward_earned
  AFTER INSERT ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reward_earned_notification();

-- 4. Trigger: Milestone Reached (every 100 beans)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_milestone_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_old_total INTEGER;
  v_new_total INTEGER;
  v_milestone INTEGER;
BEGIN
  -- Only for positive points
  IF NEW.amount > 0 THEN
    -- Get user's total points before and after
    SELECT COALESCE(SUM(amount), 0) INTO v_old_total
    FROM points_transactions
    WHERE user_id = NEW.user_id
      AND created_at < NEW.created_at;
    
    v_new_total := v_old_total + NEW.amount;
    
    -- Check if crossed a 100-bean milestone
    v_milestone := (v_new_total / 100) * 100;
    
    IF v_milestone > 0 AND v_old_total < v_milestone AND v_new_total >= v_milestone THEN
      PERFORM notify_user_event(
        NEW.user_id,
        'milestone_reached',
        jsonb_build_object(
          'milestone', v_milestone,
          'totalBeans', v_new_total
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_milestone_reached ON points_transactions;
CREATE TRIGGER on_milestone_reached
  AFTER INSERT ON points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_milestone_notification();

-- 5. Trigger: Free Coffee Ready (10 stamps)
-- =============================================
CREATE OR REPLACE FUNCTION trigger_coffee_ready_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_total_stamps INTEGER;
BEGIN
  -- Count user's total stamps
  SELECT COUNT(*) INTO v_total_stamps
  FROM coffee_stamps
  WHERE user_id = NEW.user_id;
  
  -- Notify when they hit 10 stamps
  IF v_total_stamps = 10 THEN
    PERFORM notify_user_event(
      NEW.user_id,
      'coffee_ready',
      jsonb_build_object(
        'stamps', v_total_stamps
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_coffee_ready ON coffee_stamps;
CREATE TRIGGER on_coffee_ready
  AFTER INSERT ON coffee_stamps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_coffee_ready_notification();

-- =============================================
-- Verification
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Automatic push notification triggers created!';
  RAISE NOTICE 'Triggers active for:';
  RAISE NOTICE '  - Game wins';
  RAISE NOTICE '  - Rewards earned';
  RAISE NOTICE '  - Milestones reached (every 100 beans)';
  RAISE NOTICE '  - Free coffee ready (10 stamps)';
END $$;

-- List all notification triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%notification%'
ORDER BY event_object_table;
