-- =============================================
-- FIX: String matching in notification conditions
-- =============================================
-- The issue: JSONB strings include quotes when cast to text
-- "morning"::text becomes '"morning"' (with quotes!)
-- This causes mismatches

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
    
    -- String conditions (exact match) - FIX: Use ->> to get unquoted string
    ELSIF jsonb_typeof(v_condition) = 'string' THEN
      IF (p_user_state->>v_key) != (p_conditions->>v_key) THEN
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

-- Test the fix
DO $$
BEGIN
  -- Test 1: String matching (should work now)
  IF NOT match_notification_conditions(
    '{"timeOfDay": "morning"}'::jsonb,
    '{"timeOfDay": "morning"}'::jsonb
  ) THEN
    RAISE EXCEPTION 'Test 1 failed: morning should match morning';
  END IF;
  
  -- Test 2: String mismatch (should fail)
  IF match_notification_conditions(
    '{"timeOfDay": "morning"}'::jsonb,
    '{"timeOfDay": "evening"}'::jsonb
  ) THEN
    RAISE EXCEPTION 'Test 2 failed: morning should NOT match evening';
  END IF;
  
  -- Test 3: Boolean still works
  IF NOT match_notification_conditions(
    '{"hasCheckedInToday": false}'::jsonb,
    '{"hasCheckedInToday": false}'::jsonb
  ) THEN
    RAISE EXCEPTION 'Test 3 failed: boolean matching broken';
  END IF;
  
  RAISE NOTICE '✅ All tests passed! String matching fixed!';
END $$;
