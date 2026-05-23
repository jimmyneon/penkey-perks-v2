-- =============================================
-- FIX NOTIFICATION DISMISSAL TIMEOUT
-- Date: 2025-10-14
-- =============================================
-- Changes dismissal timeout from 1 day to 7 days
-- Prevents dismissed notifications from reappearing too quickly
-- =============================================

-- 1. Add dismissal_duration column to notifications table
-- This allows per-notification control of dismissal timeout
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS dismissal_duration INTERVAL DEFAULT INTERVAL '7 days';

-- 2. Update the get_user_notifications function to use new column
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id UUID,
  p_user_state JSONB
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  priority INTEGER,
  title TEXT,
  message TEXT,
  icon TEXT,
  variant TEXT,
  dismissible BOOLEAN,
  show_badge BOOLEAN,
  badge_text TEXT,
  badge_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.priority,
    n.title,
    n.message,
    n.icon,
    n.variant,
    n.dismissible,
    n.show_badge,
    n.badge_text,
    n.badge_color
  FROM public.notifications n
  WHERE n.active = true
    -- Not dismissed by user (or dismissal expired)
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id
      AND nd.notification_id = n.id
      -- Use per-notification duration, default to 7 days
      AND nd.dismissed_at > NOW() - COALESCE(n.dismissal_duration, INTERVAL '7 days')
    )
    -- Check date range
    AND (n.start_date IS NULL OR n.start_date <= NOW())
    AND (n.end_date IS NULL OR n.end_date >= NOW())
    -- Check day of week
    AND (n.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(n.days_of_week))
    -- Check time of day
    AND (n.time_of_day_start IS NULL OR CURRENT_TIME >= n.time_of_day_start)
    AND (n.time_of_day_end IS NULL OR CURRENT_TIME <= n.time_of_day_end)
  ORDER BY n.priority ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update existing notifications to use 7-day default
UPDATE public.notifications 
SET dismissal_duration = INTERVAL '7 days'
WHERE dismissal_duration IS NULL;

-- 4. Set specific durations for different notification types
-- Urgent notifications: shorter timeout (3 days)
UPDATE public.notifications 
SET dismissal_duration = INTERVAL '3 days'
WHERE type IN ('reward', 'stamp') AND dismissible = true;

-- Informational notifications: longer timeout (14 days)
UPDATE public.notifications 
SET dismissal_duration = INTERVAL '14 days'
WHERE type IN ('custom', 'milestone') AND dismissible = true;

-- Streak notifications: medium timeout (5 days)
UPDATE public.notifications 
SET dismissal_duration = INTERVAL '5 days'
WHERE type = 'streak' AND dismissible = true;

-- 5. Add comment
COMMENT ON COLUMN public.notifications.dismissal_duration IS 'How long a dismissal lasts before notification shows again';

-- Success message
SELECT 'Dismissal timeout updated to 7 days (configurable per notification)' as message;
