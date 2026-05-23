-- =============================================
-- CREATE PROPER CHECK-INS TABLE
-- =============================================
-- Problem: Currently using points_transactions to track check-ins
-- Solution: Create dedicated check_ins table for better tracking

-- 1. Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_verified BOOLEAN DEFAULT FALSE,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  streak_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  streak_count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_checked_in_at ON public.check_ins(checked_in_at);
CREATE INDEX idx_check_ins_user_date ON public.check_ins(user_id, checked_in_at DESC);

-- 3. Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own check-ins
CREATE POLICY "Users can view own check-ins"
  ON public.check_ins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage check-ins"
  ON public.check_ins
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Update can_check_in function to use new table
CREATE OR REPLACE FUNCTION public.can_check_in(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_check_in TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check last check-in from check_ins table
  SELECT MAX(checked_in_at) INTO last_check_in
  FROM public.check_ins
  WHERE user_id = p_user_id;
  
  -- If never checked in, allow it
  IF last_check_in IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if it's a new day (midnight-to-midnight)
  -- This is better than 24-hour cooldown for daily check-ins
  RETURN DATE(last_check_in AT TIME ZONE 'Europe/London') < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_check_in IS 'Check if user can check in today (resets at midnight UK time)';

-- 6. Create helper function to record check-in
CREATE OR REPLACE FUNCTION public.record_check_in(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_points_awarded INTEGER DEFAULT 50,
  p_streak_multiplier DECIMAL DEFAULT 1.0,
  p_streak_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_check_in_id UUID;
  v_location_verified BOOLEAN := FALSE;
BEGIN
  -- Verify location if coordinates provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location_verified := public.validate_location(p_latitude, p_longitude);
  END IF;
  
  -- Insert check-in record
  INSERT INTO public.check_ins (
    user_id,
    checked_in_at,
    latitude,
    longitude,
    location_verified,
    points_awarded,
    streak_multiplier,
    streak_count,
    metadata
  ) VALUES (
    p_user_id,
    NOW(),
    p_latitude,
    p_longitude,
    v_location_verified,
    p_points_awarded,
    p_streak_multiplier,
    p_streak_count,
    p_metadata
  )
  RETURNING id INTO v_check_in_id;
  
  RETURN v_check_in_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.record_check_in IS 'Records a check-in with location and streak info';

-- 7. Create function to get today's check-in
CREATE OR REPLACE FUNCTION public.get_todays_check_in(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  points_awarded INTEGER,
  streak_count INTEGER,
  streak_multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.checked_in_at,
    c.points_awarded,
    c.streak_count,
    c.streak_multiplier
  FROM public.check_ins c
  WHERE c.user_id = p_user_id
    AND DATE(c.checked_in_at AT TIME ZONE 'Europe/London') = CURRENT_DATE
  ORDER BY c.checked_in_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_todays_check_in IS 'Get user''s check-in for today if it exists';

-- 8. Create function to get check-in stats
CREATE OR REPLACE FUNCTION public.get_check_in_stats(p_user_id UUID)
RETURNS TABLE (
  total_check_ins BIGINT,
  current_streak INTEGER,
  longest_streak INTEGER,
  last_check_in TIMESTAMP WITH TIME ZONE,
  total_points_earned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_check_ins,
    COALESCE((SELECT check_in_streak FROM public.users WHERE id = p_user_id), 0) as current_streak,
    COALESCE((SELECT longest_streak FROM public.users WHERE id = p_user_id), 0) as longest_streak,
    MAX(c.checked_in_at) as last_check_in,
    COALESCE(SUM(c.points_awarded), 0)::BIGINT as total_points_earned
  FROM public.check_ins c
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_check_in_stats IS 'Get comprehensive check-in statistics for a user';

-- 9. Grant permissions
GRANT SELECT ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
GRANT EXECUTE ON FUNCTION public.can_check_in TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_check_in TO service_role;
GRANT EXECUTE ON FUNCTION public.get_todays_check_in TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_check_in_stats TO authenticated, service_role;

-- 10. Add comments
COMMENT ON TABLE public.check_ins IS 'Daily check-in records with location and streak tracking';
COMMENT ON COLUMN public.check_ins.checked_in_at IS 'When the user checked in';
COMMENT ON COLUMN public.check_ins.latitude IS 'GPS latitude (optional)';
COMMENT ON COLUMN public.check_ins.longitude IS 'GPS longitude (optional)';
COMMENT ON COLUMN public.check_ins.location_verified IS 'Whether location was verified at Penkey';
COMMENT ON COLUMN public.check_ins.points_awarded IS 'Beans/points awarded for this check-in';
COMMENT ON COLUMN public.check_ins.streak_multiplier IS 'Streak multiplier applied';
COMMENT ON COLUMN public.check_ins.streak_count IS 'Streak count at time of check-in';

-- Success message
SELECT 'Check-ins table created successfully! ✅' as message;
