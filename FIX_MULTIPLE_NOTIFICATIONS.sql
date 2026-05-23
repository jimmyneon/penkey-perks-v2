-- =============================================
-- FIX: Return Multiple Notifications for Rotation
-- =============================================
-- Change LIMIT 1 to LIMIT 5 to allow rotation

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
    -- Not dismissed by user
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id
      AND nd.notification_id = n.id
      AND nd.dismissed_at > NOW() - INTERVAL '1 day'
    )
    -- Check date range
    AND (n.start_date IS NULL OR n.start_date <= NOW())
    AND (n.end_date IS NULL OR n.end_date >= NOW())
    -- Check day of week
    AND (n.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(n.days_of_week))
    -- Check time of day
    AND (n.time_of_day_start IS NULL OR CURRENT_TIME >= n.time_of_day_start)
    AND (n.time_of_day_end IS NULL OR CURRENT_TIME <= n.time_of_day_end)
    -- Check conditions using match_notification_conditions function
    AND match_notification_conditions(n.conditions, p_user_state)
  ORDER BY n.priority ASC
  LIMIT 5; -- Return top 5 matching notifications for rotation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test it
SELECT 'Function updated to return up to 5 notifications!' as message;
