-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS app_settings CASCADE;

-- Create app settings table for configuration
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write settings
CREATE POLICY "Service role can manage settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert initial settings
INSERT INTO app_settings (key, value, description) VALUES
  ('app_url', 'https://rewards.penkey.co.uk', 'Production app URL for cron jobs'),
  ('cron_secret', '3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=', 'Secret for authenticating cron job requests')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Helper function to get settings
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM app_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$;
