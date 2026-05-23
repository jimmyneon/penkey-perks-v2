  -- =============================================
  -- PENKEY PERKS - 3-TIER REWARDS SYSTEM
  -- Migration: Separate Points, Coffee Stamps, and Games
  -- =============================================

  -- =============================================
  -- 1. POINTS SYSTEM
  -- =============================================

  -- Points transactions ledger
  CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Can be positive (earn) or negative (spend)
    balance_after INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN (
      'visit', 'referral', 'share', 'birthday', 
      'game_bonus', 'manual_add', 'manual_remove', 'redemption'
    )),
    description TEXT,
    metadata JSONB, -- Extra data (e.g., referral_id, reward_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Points rewards catalog (what users can redeem)
  CREATE TABLE IF NOT EXISTS public.points_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('fixed_discount', 'percentage_discount', 'free_item')),
    discount_value DECIMAL, -- e.g., 5.00 for £5 off, or 20 for 20%
    expiry_days INTEGER DEFAULT 30,
    stock INTEGER, -- NULL = unlimited
    active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Indexes for points
  CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.points_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON public.points_transactions(created_at);

  -- View: User's current points balance
  CREATE OR REPLACE VIEW public.user_points_balance AS
  SELECT 
    user_id,
    COALESCE(SUM(amount), 0) as total_points,
    MAX(created_at) as last_transaction
  FROM public.points_transactions
  GROUP BY user_id;

  -- Function: Get user's current points
  CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id UUID)
  RETURNS INTEGER AS $$
  BEGIN
    RETURN COALESCE(
      (SELECT total_points FROM public.user_points_balance WHERE user_id = p_user_id),
      0
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function: Add points to user account
  CREATE OR REPLACE FUNCTION public.add_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_source TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
  )
  RETURNS INTEGER AS $$
  DECLARE
    v_new_balance INTEGER;
  BEGIN
    -- Get current balance
    v_new_balance := public.get_user_points(p_user_id) + p_amount;
    
    -- Insert transaction
    INSERT INTO public.points_transactions (
      user_id, amount, balance_after, source, description, metadata
    ) VALUES (
      p_user_id, p_amount, v_new_balance, p_source, p_description, p_metadata
    );
    
    RETURN v_new_balance;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- =============================================
  -- 2. COFFEE STAMPS SYSTEM
  -- =============================================

  -- Rename ducks to coffee_stamps (if not already done)
  DO $$ 
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ducks') THEN
      ALTER TABLE public.ducks RENAME TO coffee_stamps;
    END IF;
  END $$;

  -- Add geolocation columns to coffee_stamps
  ALTER TABLE public.coffee_stamps 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE;

  -- Function: Validate location (within 50m of shop)
  CREATE OR REPLACE FUNCTION public.validate_location(
    p_lat DECIMAL,
    p_lng DECIMAL
  )
  RETURNS BOOLEAN AS $$
  DECLARE
    v_shop_lat DECIMAL := 51.5074; -- TODO: Replace with actual Penkey coordinates
    v_shop_lng DECIMAL := -0.1278; -- TODO: Replace with actual Penkey coordinates
    v_distance DECIMAL;
    v_max_distance DECIMAL := 0.0005; -- ~50 meters in degrees
  BEGIN
    -- Calculate distance (simplified Euclidean for small distances)
    v_distance := SQRT(
      POWER(p_lat - v_shop_lat, 2) + 
      POWER(p_lng - v_shop_lng, 2)
    );
    
    RETURN v_distance <= v_max_distance;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function: Add coffee stamp with validation
  CREATE OR REPLACE FUNCTION public.add_coffee_stamp(
    p_user_id UUID,
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL
  )
  RETURNS JSONB AS $$
  DECLARE
    v_location_valid BOOLEAN := FALSE;
    v_stamp_count INTEGER;
    v_last_stamp TIMESTAMP;
  BEGIN
    -- Check rate limiting (max 1 stamp per hour)
    SELECT MAX(created_at) INTO v_last_stamp
    FROM public.coffee_stamps
    WHERE user_id = p_user_id;
    
    IF v_last_stamp IS NOT NULL AND (NOW() - v_last_stamp) < INTERVAL '1 hour' THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'You can only add one coffee stamp per hour'
      );
    END IF;
    
    -- Validate location if provided
    IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
      v_location_valid := public.validate_location(p_latitude, p_longitude);
      
      IF NOT v_location_valid THEN
        RETURN jsonb_build_object(
          'success', FALSE,
          'error', 'You must be at Penkey to add a coffee stamp'
        );
      END IF;
    END IF;
    
    -- Add stamp
    INSERT INTO public.coffee_stamps (user_id, latitude, longitude, location_verified)
    VALUES (p_user_id, p_latitude, p_longitude, v_location_valid);
    
    -- Get new count
    SELECT COUNT(*) INTO v_stamp_count
    FROM public.coffee_stamps
    WHERE user_id = p_user_id;
    
    -- Check if reached 10 stamps milestone
    IF v_stamp_count % 10 = 0 THEN
      -- Auto-issue free coffee reward
      INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
      SELECT 
        p_user_id,
        id,
        'COFFEE-' || substr(md5(random()::text), 1, 12),
        NOW() + INTERVAL '30 days'
      FROM public.rewards
      WHERE name = 'Free Coffee' AND active = TRUE
      LIMIT 1;
    END IF;
    
    RETURN jsonb_build_object(
      'success', TRUE,
      'stamp_count', v_stamp_count,
      'milestone_reached', v_stamp_count % 10 = 0,
      'message', CASE 
        WHEN v_stamp_count % 10 = 0 THEN 'Congratulations! You earned a free coffee!'
        ELSE 'Coffee stamp added! ' || (10 - (v_stamp_count % 10)) || ' more for a free coffee.'
      END
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- =============================================
  -- 3. GAMES SYSTEM ENHANCEMENTS
  -- =============================================

  -- Add columns to game_prizes
  ALTER TABLE public.game_prizes
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS stock_limit INTEGER, -- Daily stock limit
  ADD COLUMN IF NOT EXISTS stock_used INTEGER DEFAULT 0, -- How many won today
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS prize_category TEXT CHECK (prize_category IN ('food', 'drink', 'discount', 'points', 'stamps', 'nothing'));

  -- Function: Reset daily game stock (run via cron at midnight)
  CREATE OR REPLACE FUNCTION public.reset_daily_game_stock()
  RETURNS VOID AS $$
  BEGIN
    UPDATE public.game_prizes SET stock_used = 0;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Function: Play game with enhanced logic
  CREATE OR REPLACE FUNCTION public.play_game_enhanced(
    p_user_id UUID,
    p_game_id UUID
  )
  RETURNS JSONB AS $$
  DECLARE
    v_can_play BOOLEAN;
    v_prize RECORD;
    v_random DECIMAL;
    v_cumulative_prob DECIMAL := 0;
    v_total_prob DECIMAL := 0;
  BEGIN
    -- Check if user can play
    SELECT public.can_play_game(p_user_id, p_game_id) INTO v_can_play;
    
    IF NOT v_can_play THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'You have already played today'
      );
    END IF;
    
    -- Calculate total probability of available prizes
    SELECT SUM(probability) INTO v_total_prob
    FROM public.game_prizes 
    WHERE game_id = p_game_id 
      AND active = TRUE
      AND (stock_limit IS NULL OR stock_used < stock_limit);
    
    IF v_total_prob = 0 THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'No prizes available today'
      );
    END IF;
    
    -- Get random number
    v_random := random() * v_total_prob;
    
    -- Select prize based on probability and stock
    FOR v_prize IN 
      SELECT * FROM public.game_prizes 
      WHERE game_id = p_game_id 
        AND active = TRUE
        AND (stock_limit IS NULL OR stock_used < stock_limit)
      ORDER BY probability DESC
    LOOP
      v_cumulative_prob := v_cumulative_prob + v_prize.probability;
      
      IF v_random <= v_cumulative_prob THEN
        -- Winner!
        
        -- Update stock
        IF v_prize.stock_limit IS NOT NULL THEN
          UPDATE public.game_prizes 
          SET stock_used = stock_used + 1 
          WHERE id = v_prize.id;
        END IF;
        
        -- Log game play
        INSERT INTO public.game_plays (user_id, game_id, prize_type, prize_value)
        VALUES (p_user_id, p_game_id, v_prize.prize_type, v_prize.prize_value);
        
        -- Award prize based on category
        IF v_prize.prize_category = 'stamps' THEN
          -- Add coffee stamps
          FOR i IN 1..COALESCE(v_prize.prize_value, 1) LOOP
            INSERT INTO public.coffee_stamps (user_id, location_verified)
            VALUES (p_user_id, FALSE);
          END LOOP;
          
        ELSIF v_prize.prize_category = 'points' THEN
          -- Add points
          PERFORM public.add_points(
            p_user_id, 
            v_prize.prize_value, 
            'game_bonus', 
            'Won from ' || v_prize.label
          );
          
        ELSIF v_prize.prize_category IN ('food', 'drink') THEN
          -- Create instant reward voucher
          INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
          SELECT 
            p_user_id,
            r.id,
            'GAME-' || substr(md5(random()::text), 1, 12),
            NOW() + INTERVAL '7 days'
          FROM public.rewards r
          WHERE r.name = v_prize.label AND r.active = TRUE
          LIMIT 1;
        END IF;
        
        -- Log transaction
        INSERT INTO public.transactions (user_id, action, details)
        VALUES (p_user_id, 'game_play', jsonb_build_object(
          'game_id', p_game_id,
          'prize_label', v_prize.label,
          'prize_type', v_prize.prize_type
        ));
        
        RETURN jsonb_build_object(
          'success', TRUE,
          'prize', row_to_json(v_prize)
        );
      END IF;
    END LOOP;
    
    -- Shouldn't reach here if probabilities are correct
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Prize selection error'
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- =============================================
  -- 4. ROW LEVEL SECURITY POLICIES
  -- =============================================

  -- Enable RLS on new tables
  ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.points_rewards ENABLE ROW LEVEL SECURITY;

  -- Points transactions policies
  DROP POLICY IF EXISTS "Users can view own points transactions" ON public.points_transactions;
  CREATE POLICY "Users can view own points transactions" ON public.points_transactions
    FOR SELECT USING (auth.uid() = user_id);

  -- Points rewards policies (everyone can view active rewards)
  DROP POLICY IF EXISTS "Anyone can view active points rewards" ON public.points_rewards;
  CREATE POLICY "Anyone can view active points rewards" ON public.points_rewards
    FOR SELECT USING (active = TRUE);

  -- Coffee stamps policies (add INSERT if not exists)
  DROP POLICY IF EXISTS "Users can insert own coffee stamps" ON public.coffee_stamps;
  CREATE POLICY "Users can insert own coffee stamps" ON public.coffee_stamps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- =============================================
  -- 5. SEED DATA
  -- =============================================

  -- Insert default points rewards
  INSERT INTO public.points_rewards (name, description, reward_type, discount_value, points_required, expiry_days, active) VALUES
  ('£5 Off Voucher', 'Get £5 off your order', 'fixed_discount', 5.00, 50, 30, TRUE),
  ('£10 Off Voucher', 'Get £10 off your order', 'percentage_discount', 10.00, 90, 30, TRUE),
  ('20% Off Voucher', 'Get 20% off your entire order', 'percentage_discount', 20, 75, 14, TRUE),
  ('Free Pastry', 'Enjoy a free pastry of your choice', 'free_item', NULL, 30, 30, TRUE)
  ON CONFLICT DO NOTHING;

  -- Update game prizes with categories
  UPDATE public.game_prizes 
  SET prize_category = CASE 
    WHEN prize_type = 'ducks' THEN 'stamps'
    WHEN prize_type = 'nothing' THEN 'nothing'
    WHEN prize_type = 'reward' THEN 'food'
    ELSE 'points'
  END
  WHERE prize_category IS NULL;

  -- =============================================
  -- 6. PERFORMANCE OPTIMIZATION
  -- =============================================

  -- Combined dashboard query (single RPC call instead of multiple)
  CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id UUID)
  RETURNS JSONB AS $$
  DECLARE
    v_result JSONB;
    v_points INTEGER;
    v_stamps INTEGER;
    v_can_check_in BOOLEAN;
    v_last_visit TIMESTAMP;
  BEGIN
    -- Get points balance
    v_points := public.get_user_points(p_user_id);
    
    -- Get coffee stamps count
    SELECT COUNT(*), MAX(created_at) 
    INTO v_stamps, v_last_visit
    FROM public.coffee_stamps 
    WHERE user_id = p_user_id;
    
    -- Check if can check in
    v_can_check_in := public.can_check_in(p_user_id);
    
    -- Build result
    SELECT jsonb_build_object(
      'points', COALESCE(v_points, 0),
      'stamps', COALESCE(v_stamps, 0),
      'last_visit', v_last_visit,
      'can_check_in', v_can_check_in,
      'rewards', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', ur.id,
            'status', ur.status,
            'qr_code', ur.qr_code,
            'expires_at', ur.expires_at,
            'reward', jsonb_build_object(
              'id', r.id,
              'name', r.name,
              'description', r.description,
              'type', r.type,
              'value', r.value
            )
          )
        ), '[]'::jsonb)
        FROM public.user_rewards ur
        JOIN public.rewards r ON ur.reward_id = r.id
        WHERE ur.user_id = p_user_id AND ur.status = 'active'
      ),
      'games', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', mg.id,
            'name', mg.name,
            'display_name', mg.display_name,
            'description', mg.description,
            'icon', mg.icon
          )
        ), '[]'::jsonb)
        FROM public.mini_games mg
        WHERE mg.enabled = TRUE
      ),
      'played_today', (
        SELECT COALESCE(jsonb_agg(game_id), '[]'::jsonb)
        FROM public.game_plays
        WHERE user_id = p_user_id 
          AND created_at >= CURRENT_DATE
      )
    ) INTO v_result;
    
    RETURN v_result;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- =============================================
  -- COMPLETE
  -- =============================================
