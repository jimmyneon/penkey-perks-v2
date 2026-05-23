-- =============================================
-- FIX: Notification Condition Matching
-- =============================================
-- This migration fixes the critical blocker where notifications
-- don't match user state conditions.

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.match_notification_conditions(JSONB, JSONB);

-- Create condition matching function
CREATE OR REPLACE FUNCTION public.match_notification_conditions(
  conditions JSONB,
  user_state JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  key TEXT;
  condition_value JSONB;
  user_value JSONB;
  min_val NUMERIC;
  max_val NUMERIC;
  equals_val NUMERIC;
  user_num NUMERIC;
BEGIN
  -- If no conditions, always match
  IF conditions IS NULL OR conditions = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;

  -- Special case: allComplete condition
  IF conditions ? 'allComplete' AND (conditions->>'allComplete')::boolean = true THEN
    -- Check if all daily tasks are complete
    IF (user_state->>'hasCheckedInToday')::boolean = true 
       AND (user_state->>'hasCoffeeStampToday')::boolean = true 
       AND (user_state->>'hasPlayedGameToday')::boolean = true THEN
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  -- Check each condition
  FOR key, condition_value IN SELECT * FROM jsonb_each(conditions)
  LOOP
    user_value := user_state -> key;
    
    -- Skip if user_value is null (condition can't be met)
    IF user_value IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Boolean conditions (exact match)
    IF jsonb_typeof(condition_value) = 'boolean' THEN
      IF (user_value)::boolean != (condition_value)::boolean THEN
        RETURN FALSE;
      END IF;
    
    -- Number conditions (exact match)
    ELSIF jsonb_typeof(condition_value) = 'number' THEN
      BEGIN
        IF (user_value)::numeric != (condition_value)::numeric THEN
          RETURN FALSE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
    
    -- String conditions (exact match)
    ELSIF jsonb_typeof(condition_value) = 'string' THEN
      IF (user_value)::text != (condition_value)::text THEN
        RETURN FALSE;
      END IF;
    
    -- Object conditions (min/max/equals for ranges)
    ELSIF jsonb_typeof(condition_value) = 'object' THEN
      BEGIN
        user_num := (user_value)::numeric;
        
        -- Check min
        IF condition_value ? 'min' THEN
          min_val := (condition_value->>'min')::numeric;
          IF user_num < min_val THEN
            RETURN FALSE;
          END IF;
        END IF;
        
        -- Check max
        IF condition_value ? 'max' THEN
          max_val := (condition_value->>'max')::numeric;
          IF user_num > max_val THEN
            RETURN FALSE;
          END IF;
        END IF;
        
        -- Check equals
        IF condition_value ? 'equals' THEN
          equals_val := (condition_value->>'equals')::numeric;
          IF user_num != equals_val THEN
            RETURN FALSE;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
    END IF;
  END LOOP;

  -- All conditions matched
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update get_user_notifications to use condition matching
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
    -- Not dismissed by user (reset after 24 hours)
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id
      AND nd.notification_id = n.id
      AND nd.dismissed_at > NOW() - INTERVAL '24 hours'
    )
    -- Check date range
    AND (n.start_date IS NULL OR n.start_date <= NOW())
    AND (n.end_date IS NULL OR n.end_date >= NOW())
    -- Check day of week (0=Sunday, 6=Saturday)
    AND (n.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(n.days_of_week))
    -- Check time of day
    AND (n.time_of_day_start IS NULL OR CURRENT_TIME >= n.time_of_day_start)
    AND (n.time_of_day_end IS NULL OR CURRENT_TIME <= n.time_of_day_end)
    -- Check target audience points range
    AND (n.min_points IS NULL OR (p_user_state->>'currentPoints')::INTEGER >= n.min_points)
    AND (n.max_points IS NULL OR (p_user_state->>'currentPoints')::INTEGER <= n.max_points)
    -- ✅ NEW: Check conditions match user state
    AND match_notification_conditions(n.conditions, p_user_state) = true
  ORDER BY n.priority ASC
  LIMIT 1; -- Return highest priority notification only
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.match_notification_conditions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.match_notification_conditions IS 'Match notification conditions against user state. Supports boolean, string, number, and range (min/max/equals) conditions.';
COMMENT ON FUNCTION public.get_user_notifications IS 'Get the highest priority notification for a user based on their state and conditions.';

-- Test the function with sample data
DO $$
DECLARE
  test_user_state JSONB;
  test_result BOOLEAN;
BEGIN
  -- Test 1: Boolean condition
  test_user_state := '{"hasCheckedInToday": false}'::jsonb;
  test_result := match_notification_conditions('{"hasCheckedInToday": false}'::jsonb, test_user_state);
  IF test_result = true THEN
    RAISE NOTICE 'Test 1 PASSED: Boolean condition matching';
  ELSE
    RAISE EXCEPTION 'Test 1 FAILED: Boolean condition not matching';
  END IF;

  -- Test 2: Number range (min)
  test_user_state := '{"currentStreak": 10}'::jsonb;
  test_result := match_notification_conditions('{"currentStreak": {"min": 7}}'::jsonb, test_user_state);
  IF test_result = true THEN
    RAISE NOTICE 'Test 2 PASSED: Min range condition matching';
  ELSE
    RAISE EXCEPTION 'Test 2 FAILED: Min range condition not matching';
  END IF;

  -- Test 3: Number exact match
  test_user_state := '{"stampsUntilReward": 1}'::jsonb;
  test_result := match_notification_conditions('{"stampsUntilReward": 1}'::jsonb, test_user_state);
  IF test_result = true THEN
    RAISE NOTICE 'Test 3 PASSED: Exact number matching';
  ELSE
    RAISE EXCEPTION 'Test 3 FAILED: Exact number not matching';
  END IF;

  -- Test 4: Multiple conditions
  test_user_state := '{"hasCheckedInToday": true, "hasCoffeeStampToday": false}'::jsonb;
  test_result := match_notification_conditions('{"hasCheckedInToday": true, "hasCoffeeStampToday": false}'::jsonb, test_user_state);
  IF test_result = true THEN
    RAISE NOTICE 'Test 4 PASSED: Multiple conditions matching';
  ELSE
    RAISE EXCEPTION 'Test 4 FAILED: Multiple conditions not matching';
  END IF;

  -- Test 5: Empty conditions (should always match)
  test_user_state := '{"anything": true}'::jsonb;
  test_result := match_notification_conditions('{}'::jsonb, test_user_state);
  IF test_result = true THEN
    RAISE NOTICE 'Test 5 PASSED: Empty conditions always match';
  ELSE
    RAISE EXCEPTION 'Test 5 FAILED: Empty conditions should match';
  END IF;

  RAISE NOTICE 'All tests passed! Condition matching is working correctly.';
END $$;

-- Success message
SELECT '✅ Condition matching function created and tested successfully!' as message;
