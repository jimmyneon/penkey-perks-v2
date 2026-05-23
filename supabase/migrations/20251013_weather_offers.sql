-- =============================================
-- WEATHER-BASED OFFERS
-- Date: 2025-10-13
-- =============================================
-- Dynamic offers based on weather conditions
-- =============================================

-- Add weather-based notifications to notifications table
-- =============================================
INSERT INTO public.notifications (
  type,
  priority,
  title,
  message,
  icon,
  conditions,
  variant,
  dismissible
) VALUES 
-- Rainy Day Offer
(
  'weather',
  20,
  '☔ Rainy Day Special',
  'Cozy up with us! Free upgrade to large coffee today. Perfect weather for our warm café - John & Amanda x',
  '☔',
  '{"weather": "rain", "hasCheckedInToday": false, "timeOfDay": ["morning", "afternoon"]}',
  'default',
  true
),

-- Sunny Day Offer
(
  'weather',
  20,
  '☀️ Beautiful Day Special',
  'Gorgeous weather! Perfect for our garden seating. Enjoy 20% off all iced coffees today! ☀️',
  '☀️',
  '{"weather": "clear", "temperature": {"min": 18}, "hasCheckedInToday": false}',
  'default',
  true
),

-- Cold Day Offer
(
  'weather',
  20,
  '🥶 Warm Up With Us',
  'Chilly out there! Come warm up with our hot chocolate with marshmallows - only £2.50 today!',
  '🥶',
  '{"temperature": {"max": 10}, "hasCheckedInToday": false, "timeOfDay": ["morning", "afternoon"]}',
  'default',
  true
),

-- Hot Day Offer
(
  'weather',
  20,
  '🌞 Beat the Heat!',
  'It''s a scorcher! Cool down with our iced coffee or homemade lemonade - 15% off today!',
  '🌞',
  '{"temperature": {"min": 25}, "hasCheckedInToday": false}',
  'default',
  true
),

-- Windy Day
(
  'weather',
  20,
  '💨 Blustery Day Comfort',
  'Windy out there! Take shelter with us. Fresh soup of the day with crusty bread - perfect comfort food!',
  '💨',
  '{"weather": "wind", "hasCheckedInToday": false, "timeOfDay": ["afternoon"]}',
  'default',
  true
),

-- Cloudy/Overcast
(
  'weather',
  25,
  '☁️ Cozy Café Weather',
  'Perfect day for a cozy café visit! Try our Victoria Sponge with your coffee - Amanda''s famous recipe!',
  '☁️',
  '{"weather": "clouds", "hasCheckedInToday": false}',
  'default',
  true
)
ON CONFLICT DO NOTHING;

-- =============================================
-- WEATHER OFFER REDEMPTION TRACKING
-- =============================================

-- Table to track weather offer redemptions
CREATE TABLE IF NOT EXISTS weather_offer_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL, -- 'rainy', 'sunny', 'cold', 'hot', etc.
  weather_condition TEXT NOT NULL,
  temperature DECIMAL(5,2),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weather_redemptions_user ON weather_offer_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_redemptions_date ON weather_offer_redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_weather_redemptions_type ON weather_offer_redemptions(offer_type);

-- RLS Policies
ALTER TABLE weather_offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view own weather redemptions"
  ON weather_offer_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can view all redemptions
CREATE POLICY "Staff can view all weather redemptions"
  ON weather_offer_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid()
    )
  );

-- Staff can insert redemptions
CREATE POLICY "Staff can insert weather redemptions"
  ON weather_offer_redemptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid()
    )
  );

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

-- Weather offer performance view
CREATE OR REPLACE VIEW weather_offer_stats AS
SELECT 
  offer_type,
  COUNT(*) as total_redemptions,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', redeemed_at) as redemption_date,
  AVG(temperature) as avg_temperature
FROM weather_offer_redemptions
GROUP BY offer_type, DATE_TRUNC('day', redeemed_at)
ORDER BY redemption_date DESC;

-- Grant access to view
GRANT SELECT ON weather_offer_stats TO authenticated;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if user has redeemed weather offer today
CREATE OR REPLACE FUNCTION has_redeemed_weather_offer_today(
  p_user_id UUID,
  p_offer_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM weather_offer_redemptions
    WHERE user_id = p_user_id
      AND offer_type = p_offer_type
      AND redeemed_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_redeemed_weather_offer_today(UUID, TEXT) TO authenticated;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Check weather offer redemptions today:
-- SELECT * FROM weather_offer_redemptions WHERE redeemed_at >= CURRENT_DATE;

-- View weather offer performance:
-- SELECT * FROM weather_offer_stats WHERE redemption_date >= CURRENT_DATE - INTERVAL '30 days';

-- Check if user redeemed rainy day offer:
-- SELECT has_redeemed_weather_offer_today('user-uuid', 'rainy');

-- Record a weather offer redemption (staff):
-- INSERT INTO weather_offer_redemptions (user_id, offer_type, weather_condition, temperature, staff_id)
-- VALUES ('user-uuid', 'rainy', 'rain', 12.5, 'staff-uuid');
