-- =============================================
-- AGGRESSIVE FIX - Drop and recreate with proper aliases
-- =============================================

-- Force drop everything
DROP FUNCTION IF EXISTS public.get_user_game_rotation(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_game_rotation(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_game_rotation CASCADE;

-- Recreate with fully qualified column names
CREATE OR REPLACE FUNCTION public.get_user_game_rotation(
  p_user_id UUID,
  p_rotation_hours INTEGER DEFAULT 4
)
RETURNS TABLE (
  game_id UUID,
  game_name TEXT,
  display_name TEXT,
  description TEXT,
  icon TEXT,
  has_played BOOLEAN,
  rotation_number INTEGER,
  refresh_at TIMESTAMPTZ
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_current_rotation public.game_rotations%ROWTYPE;
  v_available_games UUID[];
  v_selected_games UUID[];
  v_next_refresh TIMESTAMPTZ;
  v_rotation_num INTEGER;
  v_today_start TIMESTAMPTZ;
BEGIN
  v_today_start := DATE_TRUNC('day', NOW());
  v_rotation_num := FLOOR(EXTRACT(EPOCH FROM (NOW() - v_today_start)) / (p_rotation_hours * 3600))::INTEGER;
  v_next_refresh := v_today_start + ((v_rotation_num + 1) * p_rotation_hours || ' hours')::INTERVAL;
  
  IF v_next_refresh::DATE > NOW()::DATE THEN
    v_next_refresh := (NOW()::DATE + 1)::TIMESTAMPTZ;
  END IF;
  
  SELECT gr.* INTO v_current_rotation
  FROM public.game_rotations gr
  WHERE gr.user_id = p_user_id
    AND gr.created_at::DATE = NOW()::DATE
    AND gr.rotation_number = v_rotation_num
  ORDER BY gr.created_at DESC
  LIMIT 1;
  
  IF v_current_rotation.id IS NULL OR v_current_rotation.refresh_at < NOW() THEN
    SELECT ARRAY_AGG(id) INTO v_available_games
    FROM public.mini_games
    WHERE enabled = TRUE;
    
    IF ARRAY_LENGTH(v_available_games, 1) IS NULL OR ARRAY_LENGTH(v_available_games, 1) = 0 THEN
      RAISE EXCEPTION 'No enabled games available';
    END IF;
    
    v_selected_games := ARRAY(
      SELECT id 
      FROM public.mini_games 
      WHERE enabled = TRUE 
      ORDER BY MD5(p_user_id::TEXT || v_rotation_num::TEXT || id::TEXT)
      LIMIT LEAST(3, ARRAY_LENGTH(v_available_games, 1))
    );
    
    INSERT INTO public.game_rotations (user_id, game_ids, rotation_number, refresh_at)
    VALUES (p_user_id, v_selected_games, v_rotation_num, v_next_refresh)
    RETURNING * INTO v_current_rotation;
  END IF;
  
  -- Return with explicit column selection to avoid ambiguity
  RETURN QUERY
  SELECT 
    mg.id,
    mg.name,
    mg.display_name,
    mg.description,
    mg.icon,
    EXISTS(
      SELECT 1 
      FROM public.game_plays gp 
      WHERE gp.user_id = p_user_id 
        AND gp.game_id = mg.id 
        AND gp.created_at >= v_today_start
    ),
    v_current_rotation.rotation_number,
    v_current_rotation.refresh_at
  FROM public.mini_games mg
  WHERE mg.id = ANY(v_current_rotation.game_ids)
  ORDER BY ARRAY_POSITION(v_current_rotation.game_ids, mg.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_game_rotation(UUID, INTEGER) TO authenticated;

-- Test it
SELECT '✅ Function recreated!' as status;
SELECT 'Testing function...' as info;

-- Verify the function exists
SELECT 
  '✅ Function exists: ' || proname as status
FROM pg_proc 
WHERE proname = 'get_user_game_rotation';
