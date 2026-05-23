-- =============================================
-- RANDOM GAME SYSTEM - No predictable schedule
-- =============================================
-- Games appear randomly throughout the day
-- No timers, no progress bars, just mystery!

-- Drop old system
DROP FUNCTION IF EXISTS public.get_user_game_rotation(UUID, INTEGER) CASCADE;
DROP TABLE IF EXISTS public.game_rotations CASCADE;

-- Create simple game availability table
CREATE TABLE IF NOT EXISTS public.game_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.mini_games(id) ON DELETE CASCADE,
  available_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, game_id, DATE(created_at))
);

CREATE INDEX idx_game_availability_user_id ON public.game_availability(user_id);
CREATE INDEX idx_game_availability_expires ON public.game_availability(available_until);

ALTER TABLE public.game_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game availability"
  ON public.game_availability FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game availability"
  ON public.game_availability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get available games (random, unpredictable)
CREATE OR REPLACE FUNCTION public.get_available_games(p_user_id UUID)
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
  v_random_seed FLOAT;
  v_num_games INTEGER;
  v_min_hours INTEGER;
  v_max_hours INTEGER;
  v_available_until TIMESTAMPTZ;
BEGIN
  v_today_start := DATE_TRUNC('day', NOW());
  
  -- Random seed based on user + current hour (changes every hour but unpredictable)
  v_random_seed := (
    ('x' || substring(md5(p_user_id::TEXT || EXTRACT(HOUR FROM NOW())::TEXT || CURRENT_DATE::TEXT), 1, 8))::bit(32)::bigint::float / 4294967295.0
  );
  
  -- Randomly decide how many games (1-3)
  v_num_games := FLOOR(v_random_seed * 3)::INTEGER + 1;
  
  -- Random availability window (3-12 hours)
  v_min_hours := 3;
  v_max_hours := 12;
  v_available_until := NOW() + (v_min_hours + FLOOR(v_random_seed * (v_max_hours - v_min_hours)))::TEXT || ' hours'::INTERVAL;
  
  -- Clean up expired availability
  DELETE FROM public.game_availability
  WHERE user_id = p_user_id 
    AND available_until < NOW();
  
  -- Check if user has any available games
  IF NOT EXISTS (
    SELECT 1 FROM public.game_availability
    WHERE user_id = p_user_id
      AND available_until > NOW()
      AND created_at >= v_today_start
  ) THEN
    -- Create new random game availability
    INSERT INTO public.game_availability (user_id, game_id, available_until)
    SELECT 
      p_user_id,
      id,
      v_available_until
    FROM public.mini_games
    WHERE enabled = TRUE
    ORDER BY MD5(p_user_id::TEXT || id::TEXT || NOW()::TEXT)
    LIMIT v_num_games;
  END IF;
  
  -- Return available games with play status
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
    )
  FROM public.mini_games mg
  INNER JOIN public.game_availability ga ON ga.game_id = mg.id
  WHERE ga.user_id = p_user_id
    AND ga.available_until > NOW()
    AND ga.created_at >= v_today_start
  ORDER BY ga.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_games(UUID) TO authenticated;

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

-- Cleanup old availability records
CREATE OR REPLACE FUNCTION public.cleanup_old_game_availability()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.game_availability
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_old_game_availability() TO authenticated;

SELECT '✅ Random game system installed!' as status;
SELECT 'Games will appear randomly - no timers, no schedules!' as info;
