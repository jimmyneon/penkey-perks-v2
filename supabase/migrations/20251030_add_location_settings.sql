-- =============================================
-- ADD: Location settings to app_settings table
-- =============================================
-- Store Penkey's GPS coordinates in app_settings for easy admin updates

-- Insert location settings
INSERT INTO app_settings (key, value, description) VALUES
  ('penkey_latitude', '50.7586', 'Penkey Deli latitude (Isle of Wight)'),
  ('penkey_longitude', '-1.5423', 'Penkey Deli longitude (Isle of Wight)'),
  ('location_radius_meters', '150', 'Radius in meters for location validation (GPS accuracy tolerance)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Update validate_location function to read from app_settings
CREATE OR REPLACE FUNCTION public.validate_location(
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_shop_lat DECIMAL;
  v_shop_lng DECIMAL;
  v_max_distance DECIMAL;
  v_distance DECIMAL;
BEGIN
  -- Get coordinates from app_settings
  SELECT CAST(value AS DECIMAL) INTO v_shop_lat
  FROM app_settings WHERE key = 'penkey_latitude';
  
  SELECT CAST(value AS DECIMAL) INTO v_shop_lng
  FROM app_settings WHERE key = 'penkey_longitude';
  
  SELECT CAST(value AS DECIMAL) / 111000 INTO v_max_distance
  FROM app_settings WHERE key = 'location_radius_meters';
  
  -- Fallback to hardcoded values if settings not found
  IF v_shop_lat IS NULL THEN
    v_shop_lat := 50.7586;
  END IF;
  
  IF v_shop_lng IS NULL THEN
    v_shop_lng := -1.5423;
  END IF;
  
  IF v_max_distance IS NULL THEN
    v_max_distance := 0.0015; -- ~150 meters in degrees
  END IF;
  
  -- Calculate distance using simplified Euclidean for small distances
  v_distance := SQRT(
    POWER(p_lat - v_shop_lat, 2) + 
    POWER(p_lng - v_shop_lng, 2)
  );
  
  -- Return true if within acceptable distance
  RETURN v_distance <= v_max_distance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_location IS 'Validate if user is within configured radius of Penkey location. Reads coordinates from app_settings.';

-- Verify the settings were added
SELECT 'Location settings added to app_settings!' as message;
