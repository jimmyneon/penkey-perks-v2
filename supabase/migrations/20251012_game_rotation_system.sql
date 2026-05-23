-- =============================================
-- Game Rotation System
-- =============================================
-- Allows users to get 3 random games that refresh every few hours
-- Resets daily at midnight
-- Created: 2025-10-12

-- =============================================
-- Create game_rotations table
-- =============================================
CREATE TABLE IF NOT EXISTS public.game_rotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_ids UUID[] NOT NULL, -- Array of 3 game IDs
  rotation_number INTEGER NOT NULL DEFAULT 0, -- Which rotation of the day (0, 1, 2, etc.)
  refresh_at TIMESTAMPTZ NOT NULL, -- When this rotation expires
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one active rotation per user
  UNIQUE(user_id, rotation_number, created_at::DATE)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_rotations_user_id ON public.game_rotations(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rotations_refresh_at ON public.game_rotations(refresh_at);

-- Enable RLS
ALTER TABLE public.game_rotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own game rotations"
  ON public.game_rotations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game rotations"
  ON public.game_rotations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Function: Get or create user's current game rotation
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_game_rotation(
  p_user_id UUID,
  p_rotation_hours INTEGER DEFAULT 4 -- How many hours between rotations
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
) AS $$
DECLARE
  v_current_rotation public.game_rotations%ROWTYPE;
  v_available_games UUID[];
  v_selected_games UUID[];
  v_next_refresh TIMESTAMPTZ;
  v_rotation_num INTEGER;
  v_today_start TIMESTAMPTZ;
BEGIN
  -- Get start of today
  v_today_start := DATE_TRUNC('day', NOW());
  
  -- Calculate which rotation number we're in today
  v_rotation_num := FLOOR(EXTRACT(EPOCH FROM (NOW() - v_today_start)) / (p_rotation_hours * 3600))::INTEGER;
  
  -- Calculate next refresh time
  v_next_refresh := v_today_start + ((v_rotation_num + 1) * p_rotation_hours || ' hours')::INTERVAL;
  
  -- If next refresh is tomorrow, cap it at midnight
  IF v_next_refresh::DATE > NOW()::DATE THEN
    v_next_refresh := (NOW()::DATE + 1)::TIMESTAMPTZ;
  END IF;
  
  -- Try to get existing rotation for this period
  SELECT * INTO v_current_rotation
  FROM public.game_rotations
  WHERE user_id = p_user_id
    AND created_at::DATE = NOW()::DATE
    AND rotation_number = v_rotation_num
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no rotation exists or it's expired, create a new one
  IF v_current_rotation.id IS NULL OR v_current_rotation.refresh_at < NOW() THEN
    -- Get all enabled games
    SELECT ARRAY_AGG(id) INTO v_available_games
    FROM public.mini_games
    WHERE enabled = TRUE;
    
    -- If we have fewer than 3 games, use what we have
    IF ARRAY_LENGTH(v_available_games, 1) IS NULL OR ARRAY_LENGTH(v_available_games, 1) = 0 THEN
      RAISE EXCEPTION 'No enabled games available';
    END IF;
    
    -- Randomly select up to 3 games
    -- Use user_id and rotation_num as seed for consistent randomness within the rotation
    v_selected_games := ARRAY(
      SELECT id 
      FROM public.mini_games 
      WHERE enabled = TRUE 
      ORDER BY MD5(p_user_id::TEXT || v_rotation_num::TEXT || id::TEXT)
      LIMIT LEAST(3, ARRAY_LENGTH(v_available_games, 1))
    );
    
    -- Insert new rotation
    INSERT INTO public.game_rotations (user_id, game_ids, rotation_number, refresh_at)
    VALUES (p_user_id, v_selected_games, v_rotation_num, v_next_refresh)
    RETURNING * INTO v_current_rotation;
  END IF;
  
  -- Return the games with play status
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
    ) as has_played,
    v_current_rotation.rotation_number,
    v_current_rotation.refresh_at
  FROM public.mini_games mg
  WHERE mg.id = ANY(v_current_rotation.game_ids)
  ORDER BY ARRAY_POSITION(v_current_rotation.game_ids, mg.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_game_rotation(UUID, INTEGER) TO authenticated;

-- =============================================
-- Function: Clean up old rotations (for maintenance)
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_game_rotations()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete rotations older than 7 days
  DELETE FROM public.game_rotations
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_old_game_rotations() TO authenticated;

-- =============================================
-- Update mini_games table to support multiple plays per day
-- =============================================
-- The play_limit_per_day column already exists, but let's ensure it's flexible
-- We'll update it to allow multiple plays (one per game in rotation)
UPDATE public.mini_games
SET play_limit_per_day = 1
WHERE play_limit_per_day IS NULL OR play_limit_per_day = 0;

-- =============================================
-- Verification Queries
-- =============================================

-- Test the rotation function (commented out - uncomment to test)
-- SELECT * FROM public.get_user_game_rotation('your-user-id-here'::UUID, 4);

-- Success message
SELECT '✅ Game rotation system created successfully!' as message;
SELECT '🎮 Users will now get 3 random games that refresh every 4 hours' as info;
SELECT '🌙 All rotations reset at midnight' as info;
