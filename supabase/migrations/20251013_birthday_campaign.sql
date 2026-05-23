-- =============================================
-- BIRTHDAY MONTH CAMPAIGN
-- Date: 2025-10-13
-- =============================================
-- Automatically awards beans and sends notifications for birthdays
-- =============================================

-- 1. Function to check if user's birthday month
-- =============================================
CREATE OR REPLACE FUNCTION is_birthday_month(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_dob DATE;
BEGIN
  SELECT date_of_birth INTO v_dob
  FROM users
  WHERE id = p_user_id;
  
  IF v_dob IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXTRACT(MONTH FROM v_dob) = EXTRACT(MONTH FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to check if user's actual birthday
-- =============================================
CREATE OR REPLACE FUNCTION is_birthday_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_dob DATE;
BEGIN
  SELECT date_of_birth INTO v_dob
  FROM users
  WHERE id = p_user_id;
  
  IF v_dob IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXTRACT(MONTH FROM v_dob) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM v_dob) = EXTRACT(DAY FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to award birthday beans (50 beans)
-- =============================================
CREATE OR REPLACE FUNCTION award_birthday_beans()
RETURNS TABLE(user_id UUID, awarded BOOLEAN, message TEXT) AS $$
BEGIN
  RETURN QUERY
  WITH birthday_users AS (
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE EXTRACT(MONTH FROM u.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM u.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
      AND u.date_of_birth IS NOT NULL
  ),
  already_awarded AS (
    SELECT pt.user_id
    FROM points_transactions pt
    WHERE pt.transaction_type = 'birthday_bonus'
      AND EXTRACT(YEAR FROM pt.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  ),
  users_to_award AS (
    SELECT bu.*
    FROM birthday_users bu
    LEFT JOIN already_awarded aa ON bu.id = aa.user_id
    WHERE aa.user_id IS NULL
  ),
  awarded_beans AS (
    INSERT INTO points_transactions (user_id, points_amount, transaction_type, description)
    SELECT 
      id,
      50,
      'birthday_bonus',
      'Happy Birthday from John & Amanda! 🎉🎂'
    FROM users_to_award
    RETURNING user_id AS awarded_user_id
  )
  SELECT 
    uta.id AS user_id,
    TRUE AS awarded,
    'Awarded 50 birthday beans to ' || uta.name AS message
  FROM users_to_award uta
  JOIN awarded_beans ab ON uta.id = ab.awarded_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Cron job to run daily at 9am (award birthday beans)
-- =============================================
SELECT cron.schedule(
  'award-birthday-beans-daily',
  '0 9 * * *', -- Every day at 9am
  $$
  SELECT award_birthday_beans();
  $$
);

-- 5. Insert birthday notifications into notifications table
-- =============================================
INSERT INTO public.notifications (
  type,
  priority,
  title,
  message,
  icon,
  conditions,
  variant,
  dismissible
) VALUES
(
  'birthday',
  2,
  '🎂 Happy Birthday Month!',
  'It''s your birthday month! Enjoy a free pastry with any coffee purchase! 🎉',
  '🎂',
  '{"isBirthdayMonth": true}',
  'reward',
  false
),
(
  'birthday',
  1,
  '🎉 HAPPY BIRTHDAY!',
  'Happy Birthday from John & Amanda! We''ve added 50 bonus beans to your account! Enjoy a special treat on us today! 🎂💕',
  '🎉',
  '{"isBirthdayToday": true}',
  'success',
  false
)
ON CONFLICT DO NOTHING;

-- 6. Function to send birthday notifications
-- =============================================
CREATE OR REPLACE FUNCTION send_birthday_notifications()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
BEGIN
  -- Get app URL
  SELECT value INTO v_app_url FROM app_settings WHERE key = 'app_url';
  
  -- Send notifications to birthday users
  FOR v_user IN 
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE EXTRACT(MONTH FROM u.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM u.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
      AND u.date_of_birth IS NOT NULL
  LOOP
    -- Send birthday notification
    PERFORM notify_user_event(
      v_user.id,
      'birthday_today',
      jsonb_build_object('userName', v_user.name)
    );
    
    RAISE NOTICE 'Sent birthday notification to: %', v_user.name;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Cron job to send birthday notifications (runs at 8am)
-- =============================================
SELECT cron.schedule(
  'send-birthday-notifications-daily',
  '0 8 * * *', -- Every day at 8am
  $$
  SELECT send_birthday_notifications();
  $$
);

-- 8. Grant permissions
-- =============================================
GRANT EXECUTE ON FUNCTION is_birthday_month(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_birthday_today(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_birthday_beans() TO postgres;
GRANT EXECUTE ON FUNCTION send_birthday_notifications() TO postgres;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Check if user's birthday month:
-- SELECT is_birthday_month('user-uuid-here');

-- Check if user's birthday today:
-- SELECT is_birthday_today('user-uuid-here');

-- Manually award birthday beans (for testing):
-- SELECT * FROM award_birthday_beans();

-- Manually send birthday notifications (for testing):
-- SELECT send_birthday_notifications();

-- View birthday users this month:
-- SELECT id, name, email, date_of_birth
-- FROM users
-- WHERE EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE);

-- Check if birthday beans already awarded this year:
-- SELECT * FROM points_transactions
-- WHERE transaction_type = 'birthday_bonus'
--   AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
