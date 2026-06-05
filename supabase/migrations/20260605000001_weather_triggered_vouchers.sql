-- =============================================
-- WEATHER-TRIGGERED VOUCHER SYSTEM
-- Automatically creates rainy day vouchers when weather is bad
-- =============================================

-- Check if promotional_offers table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'promotional_offers'
  ) THEN
    -- Create minimal promotional_offers table structure
    CREATE TABLE public.promotional_offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      terms TEXT,
      reward_type TEXT NOT NULL CHECK (reward_type IN ('free_item', 'discount', 'bonus_beans', 'custom')),
      reward_value TEXT NOT NULL,
      reward_description TEXT,
      icon TEXT DEFAULT '🎁',
      image_url TEXT,
      button_text TEXT DEFAULT 'Redeem Now',
      redemption_limit INTEGER,
      total_redemption_limit INTEGER,
      redemptions_count INTEGER DEFAULT 0,
      voucher_expiry_hours INTEGER DEFAULT 48,
      auto_create_voucher BOOLEAN DEFAULT true,
      active BOOLEAN DEFAULT true,
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      target_audience TEXT DEFAULT 'all',
      min_beans INTEGER,
      max_beans INTEGER,
      priority INTEGER DEFAULT 10,
      show_as_modal BOOLEAN DEFAULT true,
      show_as_notification BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id),
      CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
    );
    
    -- Enable RLS
    ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies
    DROP POLICY IF EXISTS "Staff can manage promotional offers" ON public.promotional_offers;
    CREATE POLICY "Staff can manage promotional offers"
      ON public.promotional_offers
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'staff'
        )
      );
    
    DROP POLICY IF EXISTS "Users can view active promotional offers" ON public.promotional_offers;
    CREATE POLICY "Users can view active promotional offers"
      ON public.promotional_offers
      FOR SELECT
      USING (active = true);
    
    RAISE NOTICE 'Created promotional_offers table';
  END IF;
END $$;

-- Also check for user_promotional_offers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_promotional_offers'
  ) THEN
    CREATE TABLE public.user_promotional_offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      redeemed_at TIMESTAMP WITH TIME ZONE,
      voucher_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, offer_id)
    );
    
    ALTER TABLE public.user_promotional_offers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users manage own promotional offer interactions" ON public.user_promotional_offers;
    CREATE POLICY "Users manage own promotional offer interactions"
      ON public.user_promotional_offers
      FOR ALL
      USING (user_id = auth.uid());
    
    RAISE NOTICE 'Created user_promotional_offers table';
  END IF;
END $$;

-- Also check for promotional_offer_rewards table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'promotional_offer_rewards'
  ) THEN
    CREATE TABLE public.promotional_offer_rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
      reward_id UUID,
      custom_name TEXT,
      custom_description TEXT,
      custom_type TEXT CHECK (custom_type IN ('free_item', 'discount', 'bonus_beans')),
      custom_value TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT has_reward_or_custom CHECK (
        reward_id IS NOT NULL OR 
        (custom_name IS NOT NULL AND custom_type IS NOT NULL AND custom_value IS NOT NULL)
      )
    );
    
    ALTER TABLE public.promotional_offer_rewards ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Staff can manage promotional offer rewards" ON public.promotional_offer_rewards;
    CREATE POLICY "Staff can manage promotional offer rewards"
      ON public.promotional_offer_rewards
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.staff
          WHERE staff.user_id = auth.uid()
        )
      );
    
    DROP POLICY IF EXISTS "Users can view promotional offer rewards" ON public.promotional_offer_rewards;
    CREATE POLICY "Users can view promotional offer rewards"
      ON public.promotional_offer_rewards
      FOR SELECT
      USING (true);
    
    RAISE NOTICE 'Created promotional_offer_rewards table';
  END IF;
END $$;

-- 1. WEATHER TRIGGERED OFFERS TABLE
-- Stores weather conditions and linked promotional offers
CREATE TABLE IF NOT EXISTS public.weather_triggered_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Weather trigger conditions
  weather_condition TEXT NOT NULL, -- 'rainy', 'drizzle', 'storm', 'snow'
  min_temperature INTEGER, -- Optional temperature threshold
  max_temperature INTEGER, -- Optional temperature threshold
  
  -- Linked promotional offer
  promotional_offer_id UUID REFERENCES public.promotional_offers(id) ON DELETE SET NULL,
  
  -- Tracking
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weather_triggered_offers_condition ON public.weather_triggered_offers(weather_condition);
CREATE INDEX IF NOT EXISTS idx_weather_triggered_offers_active ON public.weather_triggered_offers(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.weather_triggered_offers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Staff can manage weather triggered offers" ON public.weather_triggered_offers;
CREATE POLICY "Staff can manage weather triggered offers"
  ON public.weather_triggered_offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'staff'
    )
  );

-- 2. RAINY DAY RESCUE PROMOTIONAL OFFER (Pre-created)
-- This offer will be auto-activated when it rains
INSERT INTO public.promotional_offers (
  title,
  description,
  terms,
  reward_type,
  reward_value,
  reward_description,
  icon,
  button_text,
  redemption_limit,
  total_redemption_limit,
  voucher_expiry_hours,
  auto_create_voucher,
  active, -- Start inactive, will be activated by weather trigger
  start_date,
  end_date,
  target_audience,
  priority,
  show_as_modal, -- FALSE - shows on dashboard, not modal
  show_as_notification
) VALUES (
  '🌧️ Rainy Day Rescue - 20% Off',
  'It''s miserable out there! Warm up with 20% off any hot coffee, tea, or hot chocolate. You deserve it for braving the rain!',
  'Valid for 24 hours from issue. Cannot be combined with other offers.',
  'discount',
  '20% off any hot drink',
  'Get 20% off hot drinks to warm up on rainy days',
  '🌧️',
  'Claim Now',
  1, -- One per user per rainy day
  500, -- Total limit
  24, -- 24 hour expiry
  true, -- Auto-create voucher
  false, -- Inactive initially
  NULL, -- No start date
  NULL, -- No end date
  'all', -- All users
  5, -- High priority
  false, -- NO MODAL - dashboard only
  true -- Show as notification
) ON CONFLICT DO NOTHING;

-- Get the offer ID for the rainy day rescue
DO $$
DECLARE
  v_rainy_offer_id UUID;
BEGIN
  SELECT id INTO v_rainy_offer_id
  FROM public.promotional_offers
  WHERE title = '🌧️ Rainy Day Rescue - 20% Off'
  LIMIT 1;
  
  IF v_rainy_offer_id IS NOT NULL THEN
    -- Link weather trigger to the offer
    INSERT INTO public.weather_triggered_offers (weather_condition, promotional_offer_id, is_active)
    VALUES ('rainy', v_rainy_offer_id, true)
    ON CONFLICT DO NOTHING;
    
    -- Also link for drizzle
    INSERT INTO public.weather_triggered_offers (weather_condition, promotional_offer_id, is_active)
    VALUES ('drizzle', v_rainy_offer_id, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. FUNCTION: Check weather and activate offers
CREATE OR REPLACE FUNCTION public.check_and_activate_weather_offers()
RETURNS TABLE (
  weather_condition TEXT,
  temperature INTEGER,
  offer_activated BOOLEAN,
  offer_id UUID,
  message TEXT
) AS $$
DECLARE
  v_weather_response JSONB;
  v_weather_condition TEXT;
  v_temperature INTEGER;
  v_trigger_record RECORD;
  v_offer RECORD;
  v_already_active BOOLEAN;
BEGIN
  -- Fetch current weather from OpenWeatherMap API
  -- Note: This uses net.http_post which requires pg_net extension
  -- For now, we'll use a simpler approach with app settings
  
  -- Get current weather condition from app settings (updated by external cron)
  SELECT COALESCE(
    (SELECT value::JSONB FROM app_settings WHERE key = 'current_weather'),
    '{"weather": "unknown", "temperature": null}'::JSONB
  ) INTO v_weather_response;
  
  v_weather_condition := v_weather_response->>'weather';
  v_temperature := (v_weather_response->>'temperature')::INTEGER;
  
  -- Find matching weather trigger
  FOR v_trigger_record IN 
    SELECT * FROM public.weather_triggered_offers
    WHERE is_active = true
      AND weather_condition = v_weather_condition
  LOOP
    -- Check if offer exists and is currently inactive
    SELECT * INTO v_offer
    FROM public.promotional_offers
    WHERE id = v_trigger_record.promotional_offer_id
    LIMIT 1;
    
    IF v_offer.id IS NOT NULL THEN
      v_already_active := v_offer.active;
      
      -- If offer is inactive and weather matches, activate it
      IF NOT v_already_active THEN
        UPDATE public.promotional_offers
        SET active = true,
            start_date = NOW(),
            end_date = NOW() + INTERVAL '24 hours',
            updated_at = NOW()
        WHERE id = v_offer.id;
        
        -- Update trigger timestamp
        UPDATE public.weather_triggered_offers
        SET last_triggered_at = NOW()
        WHERE id = v_trigger_record.id;
        
        RETURN QUERY SELECT
          v_weather_condition,
          v_temperature,
          true::BOOLEAN,
          v_offer.id,
          'Offer activated due to weather'::TEXT;
      ELSE
        RETURN QUERY SELECT
          v_weather_condition,
          v_temperature,
          false::BOOLEAN,
          v_offer.id,
          'Offer already active'::TEXT;
      END IF;
    END IF;
  END LOOP;
  
  -- If no weather trigger found, deactivate any rainy day offers
  IF NOT FOUND THEN
    UPDATE public.promotional_offers
    SET active = false,
        end_date = NOW(),
        updated_at = NOW()
    WHERE id IN (
      SELECT promotional_offer_id FROM public.weather_triggered_offers
    )
    AND active = true;
    
    RETURN QUERY SELECT
      v_weather_condition,
      v_temperature,
      false::BOOLEAN,
      NULL::UUID,
      'No weather trigger - offers deactivated'::TEXT;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCTION: Create rainy day voucher for user
CREATE OR REPLACE FUNCTION public.create_rainy_day_voucher(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  voucher_id UUID,
  voucher_code TEXT
) AS $$
DECLARE
  v_offer RECORD;
  v_user_interaction RECORD;
  v_voucher_id UUID;
  v_voucher_code TEXT;
  v_expiry_date TIMESTAMP WITH TIME ZONE;
  v_reward_id UUID;
BEGIN
  -- Find active rainy day offer
  SELECT * INTO v_offer
  FROM public.promotional_offers
  WHERE title = '🌧️ Rainy Day Rescue - 20% Off'
    AND active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No active rainy day offer'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user already redeemed today
  SELECT * INTO v_user_interaction
  FROM public.user_promotional_offers
  WHERE user_id = p_user_id
    AND offer_id = v_offer.id
    AND redeemed_at >= NOW() - INTERVAL '24 hours';
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'You already claimed today''s rainy day voucher'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Create or update user interaction
  INSERT INTO public.user_promotional_offers (user_id, offer_id, viewed_at, redeemed_at)
  VALUES (p_user_id, v_offer.id, NOW(), NOW())
  ON CONFLICT (user_id, offer_id) 
  DO UPDATE SET redeemed_at = NOW();
  
  -- Increment redemption count
  UPDATE public.promotional_offers
  SET redemptions_count = redemptions_count + 1
  WHERE id = v_offer.id;
  
  -- Calculate expiry
  v_expiry_date := NOW() + (v_offer.voucher_expiry_hours || ' hours')::INTERVAL;
  
  -- Generate voucher code
  v_voucher_code := 'RAIN-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
  
  -- Find or create reward
  SELECT reward_id INTO v_reward_id
  FROM public.promotional_offer_rewards
  WHERE offer_id = v_offer.id
  LIMIT 1;
  
  IF v_reward_id IS NULL THEN
    -- Create reward
    INSERT INTO public.rewards (
      name,
      description,
      type,
      value,
      active
    )
    VALUES (
      v_offer.title,
      v_offer.description,
      'discount',
      v_offer.reward_value,
      true
    )
    RETURNING id INTO v_reward_id;
  END IF;
  
  -- Create user reward (voucher)
  INSERT INTO public.user_rewards (
    user_id,
    reward_id,
    status,
    qr_code,
    expires_at
  )
  VALUES (
    p_user_id,
    v_reward_id,
    'active',
    v_voucher_code,
    v_expiry_date
  )
  RETURNING id INTO v_voucher_id;
  
  -- Update user interaction with voucher
  UPDATE public.user_promotional_offers
  SET voucher_id = v_voucher_id
  WHERE user_id = p_user_id AND offer_id = v_offer.id;
  
  -- Return success
  RETURN QUERY SELECT 
    true, 
    'Rainy day voucher created!'::TEXT, 
    v_voucher_id, 
    v_voucher_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.weather_triggered_offers TO service_role;
GRANT SELECT ON public.weather_triggered_offers TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_activate_weather_offers TO service_role;
GRANT EXECUTE ON FUNCTION public.create_rainy_day_voucher TO authenticated;

-- Comments
COMMENT ON TABLE public.weather_triggered_offers IS 'Links weather conditions to promotional offers for auto-activation';
COMMENT ON FUNCTION public.check_and_activate_weather_offers IS 'Checks weather and activates/deactivates offers accordingly';
COMMENT ON FUNCTION public.create_rainy_day_voucher IS 'Creates a rainy day voucher for a user';

SELECT 'Weather-triggered voucher system created successfully!' as message;
