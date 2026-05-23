-- =============================================
-- Improved Notification Condition Matching
-- =============================================

-- Function to match notification conditions against user state
CREATE OR REPLACE FUNCTION public.match_notification_conditions(
  p_conditions JSONB,
  p_user_state JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_key TEXT;
  v_condition JSONB;
  v_user_value JSONB;
  v_user_value_num NUMERIC;
  v_condition_num NUMERIC;
BEGIN
  -- If no conditions, always match
  IF p_conditions IS NULL OR p_conditions = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Loop through each condition
  FOR v_key, v_condition IN SELECT * FROM jsonb_each(p_conditions)
  LOOP
    v_user_value := p_user_state->v_key;
    
    -- If user state doesn't have this key, condition fails
    IF v_user_value IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Boolean conditions (exact match)
    IF jsonb_typeof(v_condition) = 'boolean' THEN
      IF (v_user_value::text)::boolean != (v_condition::text)::boolean THEN
        RETURN FALSE;
      END IF;
    
    -- String conditions (exact match)
    ELSIF jsonb_typeof(v_condition) = 'string' THEN
      IF v_user_value::text != v_condition::text THEN
        RETURN FALSE;
      END IF;
    
    -- Number conditions (exact match)
    ELSIF jsonb_typeof(v_condition) = 'number' THEN
      IF (v_user_value::text)::numeric != (v_condition::text)::numeric THEN
        RETURN FALSE;
      END IF;
    
    -- Object conditions (range: min/max/equals)
    ELSIF jsonb_typeof(v_condition) = 'object' THEN
      -- Try to convert to number
      BEGIN
        v_user_value_num := (v_user_value::text)::numeric;
      EXCEPTION WHEN OTHERS THEN
        -- If not a number, fail the condition
        RETURN FALSE;
      END;
      
      -- Check 'equals' condition
      IF v_condition ? 'equals' THEN
        v_condition_num := (v_condition->>'equals')::numeric;
        IF v_user_value_num != v_condition_num THEN
          RETURN FALSE;
        END IF;
      END IF;
      
      -- Check 'min' condition (greater than or equal)
      IF v_condition ? 'min' THEN
        v_condition_num := (v_condition->>'min')::numeric;
        IF v_user_value_num < v_condition_num THEN
          RETURN FALSE;
        END IF;
      END IF;
      
      -- Check 'max' condition (less than or equal)
      IF v_condition ? 'max' THEN
        v_condition_num := (v_condition->>'max')::numeric;
        IF v_user_value_num > v_condition_num THEN
          RETURN FALSE;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  -- All conditions passed
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update get_user_notifications to use the new matching function
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
    -- Check conditions using new matching function
    AND public.match_notification_conditions(n.conditions, p_user_state)
  ORDER BY n.priority ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.match_notification_conditions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.match_notification_conditions IS 'Match notification conditions against user state. Supports boolean, string, number, and range (min/max/equals) conditions.';

-- Success message
SELECT 'Notification condition matching improved!' as message;
