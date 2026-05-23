-- =============================================
-- ONE GAME AT A TIME - Random System
-- =============================================
-- One game at a time, refreshes randomly 1-3 times per day
-- Resets at midnight
-- No timers, no schedules!

-- Drop old system
DROP FUNCTION IF EXISTS public.get_user_game_rotation(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_games(UUID) CASCADE;
DROP TABLE IF EXISTS public.game_rotations CASCADE;
DROP TABLE IF EXISTS public.game_availability CASCADE;

-- Create simple daily game table
CREATE TABLE IF NOT EXISTS public.daily_game_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.mini_games(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL DEFAULT 1, -- Which session today (1, 2, or 3)
  available_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_game_user_id ON public.daily_game_availability(user_id);
CREATE INDEX idx_daily_game_expires ON public.daily_game_availability(available_until);
-- Uniqueness is enforced in the function logic

ALTER TABLE public.daily_game_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily game"
  ON public.daily_game_availability FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily game"
  ON public.daily_game_availability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get current available game
CREATE OR REPLACE FUNCTION public.get_available_game(p_user_id UUID)
RETURNS TABLE (
  game_id UUID,
  game_name TEXT,
  display_name TEXT,
  description TEXT,
  icon TEXT,
  has_played BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_current_game public.daily_game_availability%ROWTYPE;
  v_random_seed FLOAT;
  v_session_number INTEGER;
  v_available_until TIMESTAMPTZ;
  v_random_game_id UUID;
  v_plays_today INTEGER;
BEGIN
  v_today_start := DATE_TRUNC('day', NOW());
  
  -- Count how many times user has played today
  SELECT COUNT(*) INTO v_plays_today
  FROM public.game_plays
  WHERE user_id = p_user_id
    AND created_at >= v_today_start;
  
  -- Clean up expired games
  DELETE FROM public.daily_game_availability
  WHERE user_id = p_user_id 
    AND (available_until < NOW() OR created_at < v_today_start);
  
  -- Check if user has a current available game
  SELECT * INTO v_current_game
  FROM public.daily_game_availability
  WHERE user_id = p_user_id
    AND available_until > NOW()
    AND created_at >= v_today_start
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no game available and haven't played 3 times yet, create new one
  IF v_current_game.id IS NULL AND v_plays_today < 3 THEN
    -- Determine session number
    v_session_number := v_plays_today + 1;
    
    -- Random seed based on user + session + date
    v_random_seed := (
      ('x' || substring(md5(p_user_id::TEXT || v_session_number::TEXT || CURRENT_DATE::TEXT), 1, 8))::bit(32)::bigint::float / 4294967295.0
    );
    
    -- First game of the day is always available immediately
    -- Subsequent games have random availability window (3-8 hours from now)
    IF v_session_number = 1 THEN
      -- First game available until midnight
      v_available_until := (CURRENT_DATE + 1)::TIMESTAMPTZ;
    ELSE
      -- Random availability window for games 2 and 3
      v_available_until := NOW() + (3 + FLOOR(v_random_seed * 5))::TEXT || ' hours'::INTERVAL;
      
      -- Cap at midnight
      IF v_available_until::DATE > CURRENT_DATE THEN
        v_available_until := (CURRENT_DATE + 1)::TIMESTAMPTZ;
      END IF;
    END IF;
    
    -- Pick a random game
    SELECT id INTO v_random_game_id
    FROM public.mini_games
    WHERE enabled = TRUE
    ORDER BY MD5(p_user_id::TEXT || v_session_number::TEXT || CURRENT_DATE::TEXT || id::TEXT)
    LIMIT 1;
    
    -- Insert new game availability
    IF v_random_game_id IS NOT NULL THEN
      INSERT INTO public.daily_game_availability (user_id, game_id, session_number, available_until)
      VALUES (p_user_id, v_random_game_id, v_session_number, v_available_until)
      RETURNING * INTO v_current_game;
    END IF;
  END IF;
  
  -- Return the current game if available
  IF v_current_game.id IS NOT NULL THEN
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
          AND gp.created_at >= v_current_game.created_at
      )
    FROM public.mini_games mg
    WHERE mg.id = v_current_game.game_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_game(UUID) TO authenticated;

-- Function to get today's beans total
CREATE OR REPLACE FUNCTION public.get_todays_beans(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_beans INTEGER;
BEGIN
  SELECT COALESCE(SUM(prize_value), 0)::INTEGER INTO v_total_beans
  FROM public.game_plays
  WHERE user_id = p_user_id
    AND prize_type = 'beans'
    AND created_at >= DATE_TRUNC('day', NOW());
  
  RETURN v_total_beans;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_todays_beans(UUID) TO authenticated;

-- Function to get last game result
CREATE OR REPLACE FUNCTION public.get_last_game_result(p_user_id UUID)
RETURNS TABLE (
  game_name TEXT,
  prize_type TEXT,
  prize_value INTEGER,
  played_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mg.display_name,
    gp.prize_type,
    gp.prize_value,
    gp.created_at
  FROM public.game_plays gp
  INNER JOIN public.mini_games mg ON mg.id = gp.game_id
  WHERE gp.user_id = p_user_id
    AND gp.created_at >= DATE_TRUNC('day', NOW())
  ORDER BY gp.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_last_game_result(UUID) TO authenticated;

-- Cleanup old records
CREATE OR REPLACE FUNCTION public.cleanup_old_daily_games()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.daily_game_availability
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_old_daily_games() TO authenticated;

SELECT '✅ One game random system installed!' as status;
SELECT 'One game at a time, up to 3 per day, random intervals!' as info;
