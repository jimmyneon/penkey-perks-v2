-- =============================================
-- WEATHER REWARDS SYSTEM
-- Date: 2025-10-14
-- =============================================
-- Track visits in different weather conditions
-- Award bonus points for visiting in challenging weather
-- Create weather-based achievements
-- =============================================

-- 1. Weather Visit Tracking Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.weather_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE SET NULL,
  
  -- Weather data at time of visit
  weather_condition TEXT NOT NULL, -- 'clear', 'rain', 'snow', 'clouds', 'fog', etc.
  temperature DECIMAL(5,2), -- In Celsius
  feels_like DECIMAL(5,2),
  humidity INTEGER,
  wind_speed DECIMAL(5,2),
  
  -- Bonus points awarded
  bonus_points INTEGER DEFAULT 0,
  bonus_reason TEXT,
  
  -- Timestamps
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_weather_visits_user ON public.weather_visits(user_id);
CREATE INDEX idx_weather_visits_condition ON public.weather_visits(weather_condition);
CREATE INDEX idx_weather_visits_date ON public.weather_visits(visited_at);

-- RLS
ALTER TABLE public.weather_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weather visits"
  ON public.weather_visits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weather visits"
  ON public.weather_visits FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 2. Weather Bonus Points Configuration
-- =============================================
CREATE TABLE IF NOT EXISTS public.weather_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_condition TEXT NOT NULL UNIQUE,
  bonus_points INTEGER NOT NULL,
  bonus_message TEXT NOT NULL,
  emoji TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed weather bonuses
INSERT INTO public.weather_bonuses (weather_condition, bonus_points, bonus_message, emoji, active) VALUES
('rain', 5, 'Rainy day bonus! Thanks for braving the weather!', '🌧️', true),
('snow', 10, 'Snow day bonus! You''re a winter warrior!', '❄️', true),
('thunderstorm', 8, 'Thunderstorm bonus! You''re fearless!', '⛈️', true),
('drizzle', 3, 'Drizzle bonus! A little rain won''t stop you!', '🌦️', true),
('fog', 4, 'Foggy day bonus! Thanks for finding us!', '🌫️', true),
('extreme_cold', 7, 'Extreme cold bonus! You braved the freeze!', '🥶', true),
('extreme_heat', 5, 'Heatwave bonus! You beat the heat!', '🔥', true)
ON CONFLICT (weather_condition) DO NOTHING;

-- RLS
ALTER TABLE public.weather_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weather bonuses"
  ON public.weather_bonuses FOR SELECT
  USING (active = true);

-- 3. Weather Achievements/Badges
-- =============================================
CREATE TABLE IF NOT EXISTS public.weather_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  weather_condition TEXT NOT NULL,
  visits_required INTEGER NOT NULL,
  badge_emoji TEXT,
  reward_points INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed weather achievements
INSERT INTO public.weather_achievements (name, description, weather_condition, visits_required, badge_emoji, reward_points, active) VALUES
('Rain Warrior', 'Visit 5 times on rainy days', 'rain', 5, '🌧️', 25, true),
('Rain Champion', 'Visit 10 times on rainy days', 'rain', 10, '☔', 50, true),
('Rain Legend', 'Visit 20 times on rainy days', 'rain', 20, '⛈️', 100, true),
('Snow Angel', 'Visit 3 times on snowy days', 'snow', 3, '❄️', 50, true),
('Snow Hero', 'Visit 5 times on snowy days', 'snow', 5, '⛄', 100, true),
('Heat Seeker', 'Visit 10 times when temperature > 25°C', 'extreme_heat', 10, '🔥', 50, true),
('Ice Breaker', 'Visit 10 times when temperature < 5°C', 'extreme_cold', 10, '🧊', 50, true),
('All Weather Friend', 'Visit in 5 different weather conditions', 'all', 5, '🌈', 100, true),
('Storm Chaser', 'Visit 3 times during thunderstorms', 'thunderstorm', 3, '⚡', 75, true)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.weather_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weather achievements"
  ON public.weather_achievements FOR SELECT
  USING (active = true);

-- 4. User Weather Achievements (earned badges)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_weather_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.weather_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_weather_achievements_user ON public.user_weather_achievements(user_id);

-- RLS
ALTER TABLE public.user_weather_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weather achievements"
  ON public.user_weather_achievements FOR SELECT
  USING (user_id = auth.uid());

-- 5. Function to Calculate Weather Bonus
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_weather_bonus(
  p_weather_condition TEXT,
  p_temperature DECIMAL
)
RETURNS TABLE(
  bonus_points INTEGER,
  bonus_message TEXT,
  bonus_emoji TEXT
) AS $$
DECLARE
  v_condition TEXT;
BEGIN
  -- Determine condition category
  v_condition := p_weather_condition;
  
  -- Check for extreme temperatures
  IF p_temperature IS NOT NULL THEN
    IF p_temperature < 5 THEN
      v_condition := 'extreme_cold';
    ELSIF p_temperature > 30 THEN
      v_condition := 'extreme_heat';
    END IF;
  END IF;
  
  -- Get bonus from configuration
  RETURN QUERY
  SELECT 
    wb.bonus_points,
    wb.bonus_message,
    wb.emoji
  FROM public.weather_bonuses wb
  WHERE wb.weather_condition = v_condition
    AND wb.active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to Check and Award Weather Achievements
-- =============================================
CREATE OR REPLACE FUNCTION public.check_weather_achievements(
  p_user_id UUID
)
RETURNS TABLE(
  achievement_name TEXT,
  achievement_description TEXT,
  reward_points INTEGER,
  badge_emoji TEXT
) AS $$
DECLARE
  v_achievement RECORD;
  v_visit_count INTEGER;
  v_unique_conditions INTEGER;
BEGIN
  -- Check each achievement
  FOR v_achievement IN 
    SELECT * FROM public.weather_achievements 
    WHERE active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_weather_achievements
      WHERE user_id = p_user_id
      AND achievement_id = v_achievement.id
    )
  LOOP
    -- Check if user qualifies
    IF v_achievement.weather_condition = 'all' THEN
      -- Count unique weather conditions
      SELECT COUNT(DISTINCT weather_condition)
      INTO v_unique_conditions
      FROM public.weather_visits
      WHERE user_id = p_user_id;
      
      IF v_unique_conditions >= v_achievement.visits_required THEN
        -- Award achievement
        INSERT INTO public.user_weather_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id)
        ON CONFLICT DO NOTHING;
        
        -- Return achievement details
        RETURN QUERY
        SELECT 
          v_achievement.name,
          v_achievement.description,
          v_achievement.reward_points,
          v_achievement.badge_emoji;
      END IF;
    ELSIF v_achievement.weather_condition = 'extreme_heat' THEN
      -- Count visits when hot
      SELECT COUNT(*)
      INTO v_visit_count
      FROM public.weather_visits
      WHERE user_id = p_user_id
      AND temperature > 25;
      
      IF v_visit_count >= v_achievement.visits_required THEN
        INSERT INTO public.user_weather_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id)
        ON CONFLICT DO NOTHING;
        
        RETURN QUERY
        SELECT 
          v_achievement.name,
          v_achievement.description,
          v_achievement.reward_points,
          v_achievement.badge_emoji;
      END IF;
    ELSIF v_achievement.weather_condition = 'extreme_cold' THEN
      -- Count visits when cold
      SELECT COUNT(*)
      INTO v_visit_count
      FROM public.weather_visits
      WHERE user_id = p_user_id
      AND temperature < 5;
      
      IF v_visit_count >= v_achievement.visits_required THEN
        INSERT INTO public.user_weather_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id)
        ON CONFLICT DO NOTHING;
        
        RETURN QUERY
        SELECT 
          v_achievement.name,
          v_achievement.description,
          v_achievement.reward_points,
          v_achievement.badge_emoji;
      END IF;
    ELSE
      -- Count visits for specific weather condition
      SELECT COUNT(*)
      INTO v_visit_count
      FROM public.weather_visits
      WHERE user_id = p_user_id
      AND weather_condition = v_achievement.weather_condition;
      
      IF v_visit_count >= v_achievement.visits_required THEN
        INSERT INTO public.user_weather_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id)
        ON CONFLICT DO NOTHING;
        
        RETURN QUERY
        SELECT 
          v_achievement.name,
          v_achievement.description,
          v_achievement.reward_points,
          v_achievement.badge_emoji;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. View for User Weather Stats
-- =============================================
CREATE OR REPLACE VIEW public.user_weather_stats AS
SELECT 
  user_id,
  COUNT(*) as total_weather_visits,
  COUNT(DISTINCT weather_condition) as unique_conditions_visited,
  SUM(bonus_points) as total_weather_bonus_points,
  COUNT(*) FILTER (WHERE weather_condition = 'rain') as rainy_day_visits,
  COUNT(*) FILTER (WHERE weather_condition = 'snow') as snowy_day_visits,
  COUNT(*) FILTER (WHERE temperature > 25) as hot_day_visits,
  COUNT(*) FILTER (WHERE temperature < 5) as cold_day_visits,
  MAX(visited_at) as last_weather_visit
FROM public.weather_visits
GROUP BY user_id;

GRANT SELECT ON public.user_weather_stats TO authenticated;

-- 8. Grant Permissions
-- =============================================
GRANT SELECT ON public.weather_bonuses TO authenticated;
GRANT SELECT ON public.weather_achievements TO authenticated;
GRANT SELECT, INSERT ON public.weather_visits TO authenticated;
GRANT SELECT ON public.user_weather_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_weather_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_weather_achievements TO authenticated;

-- 9. Comments
-- =============================================
COMMENT ON TABLE public.weather_visits IS 'Track user visits with weather conditions';
COMMENT ON TABLE public.weather_bonuses IS 'Configuration for weather-based bonus points';
COMMENT ON TABLE public.weather_achievements IS 'Weather-based achievement definitions';
COMMENT ON TABLE public.user_weather_achievements IS 'Earned weather achievements per user';
COMMENT ON FUNCTION public.calculate_weather_bonus IS 'Calculate bonus points for weather conditions';
COMMENT ON FUNCTION public.check_weather_achievements IS 'Check and award weather achievements to user';

-- Success message
SELECT 'Weather rewards system created successfully!' as message;
