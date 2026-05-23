-- Penkey Perks V2 - Complete Schema
-- Premium loyalty system for Penkey Délicaf & Gifts
-- Created: May 23, 2026

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS & AUTH
-- ============================================================================

-- User profiles (extends Supabase auth.users)
-- Note: FK to auth.users will be added after auth is set up
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  preferences JSONB DEFAULT '{}',
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bean balances
CREATE TABLE public.bean_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_beans INTEGER DEFAULT 0 CHECK (current_beans >= 0),
  lifetime_beans INTEGER DEFAULT 0 CHECK (lifetime_beans >= 0),
  last_visit_at TIMESTAMPTZ,
  visit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BEAN TRANSACTIONS
-- ============================================================================

-- Bean earning/spending history
CREATE TABLE public.bean_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for earned, negative for spent
  source TEXT NOT NULL, -- 'visit', 'purchase', 'bonus', 'campaign', 'voucher_redeem', 'manual'
  source_id UUID, -- Reference to purchase, campaign, etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bean_transactions_user ON public.bean_transactions(user_id);
CREATE INDEX idx_bean_transactions_created ON public.bean_transactions(created_at DESC);

-- Daily visit tracking (to prevent abuse - 1 base bean per day)
CREATE TABLE public.daily_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  base_bean_awarded BOOLEAN DEFAULT false,
  purchase_count INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, visit_date)
);

CREATE INDEX idx_daily_visits_user_date ON public.daily_visits(user_id, visit_date);

-- ============================================================================
-- VOUCHER SYSTEM
-- ============================================================================

-- Voucher templates (reward tiers)
CREATE TABLE public.voucher_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'enhancer', 'coffee', 'major', 'wheel_spin'
  bean_threshold INTEGER NOT NULL,
  expiry_days INTEGER DEFAULT 30,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User vouchers (issued rewards)
CREATE TABLE public.user_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voucher_template_id UUID NOT NULL REFERENCES public.voucher_templates(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  qr_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES public.profiles(id), -- Staff who redeemed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_vouchers_user ON public.user_vouchers(user_id);
CREATE INDEX idx_user_vouchers_status ON public.user_vouchers(status);
CREATE INDEX idx_user_vouchers_expires ON public.user_vouchers(expires_at);

-- Prevent stacking vouchers in same category
CREATE UNIQUE INDEX idx_user_vouchers_category_active 
  ON public.user_vouchers(user_id, voucher_template_id) 
  WHERE status = 'active';

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

-- Marketing campaigns (email/push)
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'rainy_day', 'quiet_afternoon', 'lunch_club', 'lucky_duck', 'brownie_friday', 'win_back'
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  location_required BOOLEAN DEFAULT false,
  location_radius_meters INTEGER DEFAULT 100,
  bean_multiplier INTEGER DEFAULT 1, -- e.g., 2 for double beans
  target_audience JSONB DEFAULT '{}', -- Segment criteria
  email_template JSONB,
  push_template JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_dates ON public.campaigns(start_at, end_at);

-- Campaign participations
CREATE TABLE public.campaign_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  beans_earned INTEGER DEFAULT 0,
  location_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- ============================================================================
-- LUCKY DUCK WHEEL
-- ============================================================================

-- Wheel prizes
CREATE TABLE public.wheel_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'syrup', 'bonus_beans', 'double_beans', 'brownie', 'lunch_reward', 'secret_menu', 'duck_collectible', 'drink_voucher', 'golden_duck'
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  weight INTEGER DEFAULT 10, -- Higher = more likely
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wheel spins
CREATE TABLE public.wheel_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id), -- If spin from campaign
  prize_id UUID NOT NULL REFERENCES public.wheel_prizes(id),
  location_verified BOOLEAN DEFAULT false,
  voucher_id UUID REFERENCES public.user_vouchers(id), -- If prize is a voucher
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wheel_spins_user ON public.wheel_spins(user_id);
CREATE INDEX idx_wheel_spins_campaign ON public.wheel_spins(campaign_id);

-- ============================================================================
-- ACHIEVEMENTS & BADGES
-- ============================================================================

-- Badge definitions
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  requirement_type TEXT NOT NULL, -- 'lifetime_beans', 'visit_count', 'specific_action'
  requirement_value INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

-- ============================================================================
-- POS INTEGRATION
-- ============================================================================

-- Purchase records (from POS)
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL for guest
  pos_transaction_id TEXT UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL, -- Array of purchased items
  bean_rules_applied JSONB DEFAULT '{}',
  beans_awarded INTEGER DEFAULT 0,
  location_id TEXT,
  staff_id UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_pos_id ON public.purchases(pos_transaction_id);
CREATE INDEX idx_purchases_created ON public.purchases(created_at DESC);

-- ============================================================================
-- ANALYTICS
-- ============================================================================

-- Daily analytics summary
CREATE TABLE public.daily_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_visits INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  total_beans_earned INTEGER DEFAULT 0,
  total_beans_redeemed INTEGER DEFAULT 0,
  vouchers_issued INTEGER DEFAULT 0,
  vouchers_redeemed INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  campaign_participations INTEGER DEFAULT 0,
  wheel_spins INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu item analytics
CREATE TABLE public.menu_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  item_category TEXT,
  purchase_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  peak_hours JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notification queue
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'push', 'email', 'in_app'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);

-- ============================================================================
-- STAFF / ADMIN
-- ============================================================================

-- Staff roles
CREATE TABLE public.staff_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'admin')),
  location_id TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Award beans to user
CREATE OR REPLACE FUNCTION award_beans(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Update bean balance
  INSERT INTO public.bean_balances (user_id, current_beans, lifetime_beans, updated_at)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_beans = current_beans + p_amount,
    lifetime_beans = lifetime_beans + p_amount,
    updated_at = NOW();
  
  -- Record transaction
  INSERT INTO public.bean_transactions (user_id, amount, source, source_id, description, metadata)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;
  
  -- Check for voucher thresholds
  PERFORM check_voucher_thresholds(p_user_id);
  
  -- Check for badge unlocks
  PERFORM check_badge_unlocks(p_user_id);
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Check and issue vouchers based on bean thresholds
CREATE OR REPLACE FUNCTION check_voucher_thresholds(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  v_balance RECORD;
  v_template RECORD;
BEGIN
  -- Get current balance
  SELECT * INTO v_balance FROM public.bean_balances WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  -- Check each active voucher template
  FOR v_template IN 
    SELECT * FROM public.voucher_templates 
    WHERE bean_threshold <= v_balance.current_beans
  LOOP
    -- Check if user already has active voucher in this category
    IF NOT EXISTS (
      SELECT 1 FROM public.user_vouchers uv
      JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
      WHERE uv.user_id = p_user_id
      AND uv.status = 'active'
      AND vt.category = v_template.category
    ) THEN
      -- Issue voucher
      INSERT INTO public.user_vouchers (
        user_id,
        voucher_template_id,
        qr_code,
        expires_at,
        metadata
      ) VALUES (
        p_user_id,
        v_template.id,
        encode(gen_random_bytes(16), 'hex'),
        NOW() + (v_template.expiry_days || ' days')::INTERVAL,
        jsonb_build_object('auto_issued', true, 'threshold', v_template.bean_threshold)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Check and unlock badges based on lifetime beans
CREATE OR REPLACE FUNCTION check_badge_unlocks(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  v_balance RECORD;
  v_badge RECORD;
BEGIN
  -- Get lifetime balance
  SELECT * INTO v_balance FROM public.bean_balances WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  -- Check each active badge
  FOR v_badge IN 
    SELECT * FROM public.badges 
    WHERE requirement_type = 'lifetime_beans'
    AND requirement_value <= v_balance.lifetime_beans
  LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) THEN
      -- Award badge
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Record daily visit
CREATE OR REPLACE FUNCTION record_visit(
  p_user_id UUID,
  p_purchase_count INTEGER DEFAULT 0,
  p_total_spend DECIMAL DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_visit_id UUID;
  v_base_bean_awarded BOOLEAN;
BEGIN
  -- Insert or update daily visit
  INSERT INTO public.daily_visits (user_id, visit_date, purchase_count, total_spend, metadata)
  VALUES (p_user_id, CURRENT_DATE, p_purchase_count, p_total_spend, p_metadata)
  ON CONFLICT (user_id, visit_date)
  DO UPDATE SET
    purchase_count = daily_visits.purchase_count + p_purchase_count,
    total_spend = daily_visits.total_spend + p_total_spend,
    metadata = daily_visits.metadata || p_metadata
  RETURNING id, base_bean_awarded INTO v_visit_id, v_base_bean_awarded;
  
  -- Award base bean if not already awarded today
  IF NOT v_base_bean_awarded THEN
    PERFORM award_beans(p_user_id, 1, 'visit', v_visit_id, 'Daily visit bean');
    
    -- Update daily_visits to mark base bean as awarded
    UPDATE public.daily_visits 
    SET base_bean_awarded = true 
    WHERE id = v_visit_id;
    
    -- Update bean_balances visit count
    UPDATE public.bean_balances 
    SET visit_count = visit_count + 1,
        last_visit_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_visit_id;
END;
$$ LANGUAGE plpgsql;

-- Redeem voucher
CREATE OR REPLACE FUNCTION redeem_voucher(
  p_qr_code TEXT,
  p_staff_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_result JSONB;
BEGIN
  -- Find voucher
  SELECT * INTO v_voucher 
  FROM public.user_vouchers 
  WHERE qr_code = p_qr_code AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voucher not found or already used');
  END IF;
  
  -- Check expiry
  IF v_voucher.expires_at < NOW() THEN
    UPDATE public.user_vouchers SET status = 'expired' WHERE id = v_voucher.id;
    RETURN jsonb_build_object('success', false, 'error', 'Voucher expired');
  END IF;
  
  -- Redeem voucher
  UPDATE public.user_vouchers 
  SET status = 'redeemed',
      redeemed_at = NOW(),
      redeemed_by = p_staff_id
  WHERE id = v_voucher.id;
  
  -- Get voucher template to determine bean cost
  DECLARE
    v_template RECORD;
  BEGIN
    SELECT * INTO v_template 
    FROM public.voucher_templates 
    WHERE id = v_voucher.voucher_template_id;
    
    -- Deduct beans if applicable
    IF v_template.bean_threshold > 0 THEN
      UPDATE public.bean_balances
      SET current_beans = current_beans - v_template.bean_threshold
      WHERE user_id = v_voucher.user_id;
      
      -- Record transaction
      INSERT INTO public.bean_transactions (user_id, amount, source, source_id, description)
      VALUES (v_voucher.user_id, -v_template.bean_threshold, 'voucher_redeem', v_voucher.id, 'Redeemed: ' || v_template.name);
    END IF;
  END;
  
  RETURN jsonb_build_object('success', true, 'voucher_id', v_voucher.id, 'user_id', v_voucher.user_id);
END;
$$ LANGUAGE plpgsql;

-- Spin lucky duck wheel
CREATE OR REPLACE FUNCTION spin_wheel(
  p_user_id UUID,
  p_campaign_id UUID DEFAULT NULL,
  p_location_verified BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_prize RECORD;
  v_spin_id UUID;
  v_voucher_id UUID;
  v_total_weight INTEGER;
  v_random_weight INTEGER;
  v_cumulative_weight INTEGER;
BEGIN
  -- Check if wheel is available (active campaign or user has spin voucher)
  IF p_campaign_id IS NULL THEN
    -- Check for spin voucher
    IF NOT EXISTS (
      SELECT 1 FROM public.user_vouchers uv
      JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
      WHERE uv.user_id = p_user_id
      AND uv.status = 'active'
      AND vt.category = 'wheel_spin'
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'No spin available');
    END IF;
  ELSE
    -- Check campaign is active
    IF NOT EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = p_campaign_id AND status = 'active'
      AND start_at <= NOW() AND end_at >= NOW()
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Campaign not active');
    END IF;
  END IF;
  
  -- Calculate total weight of active prizes
  SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
  FROM public.wheel_prizes;
  
  -- Select random prize
  v_random_weight := (random() * v_total_weight)::INTEGER;
  v_cumulative_weight := 0;
  
  FOR v_prize IN 
    SELECT * FROM public.wheel_prizes 
    ORDER BY id
  LOOP
    v_cumulative_weight := v_cumulative_weight + v_prize.weight;
    IF v_random_weight <= v_cumulative_weight THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- If prize is a voucher type, issue voucher
  IF v_prize.type IN ('drink_voucher', 'lunch_reward', 'golden_duck') THEN
    -- Find appropriate voucher template
    DECLARE
      v_voucher_template RECORD;
    BEGIN
      SELECT * INTO v_voucher_template
      FROM public.voucher_templates
      WHERE category = CASE 
        WHEN v_prize.type = 'drink_voucher' THEN 'coffee'
        WHEN v_prize.type = 'lunch_reward' THEN 'major'
        WHEN v_prize.type = 'golden_duck' THEN 'major'
      END
      LIMIT 1;
      
      IF v_voucher_template IS NOT NULL THEN
        INSERT INTO public.user_vouchers (user_id, voucher_template_id, qr_code, expires_at, metadata)
        VALUES (p_user_id, v_voucher_template.id, encode(gen_random_bytes(16), 'hex'), NOW() + '30 days'::INTERVAL, jsonb_build_object('from_wheel', true, 'prize_name', v_prize.name))
        RETURNING id INTO v_voucher_id;
      END IF;
    END;
  END IF;
  
  -- Record spin
  INSERT INTO public.wheel_spins (user_id, campaign_id, prize_id, location_verified, voucher_id, metadata)
  VALUES (p_user_id, p_campaign_id, v_prize.id, p_location_verified, v_voucher_id, jsonb_build_object('prize_name', v_prize.name, 'prize_rarity', v_prize.rarity))
  RETURNING id INTO v_spin_id;
  
  -- Consume spin voucher if used
  IF p_campaign_id IS NULL THEN
    UPDATE public.user_vouchers
    SET status = 'redeemed', redeemed_at = NOW()
    WHERE user_id = p_user_id
    AND id = (
      SELECT uv.id FROM public.user_vouchers uv
      JOIN public.voucher_templates vt ON uv.voucher_template_id = vt.id
      WHERE uv.user_id = p_user_id
      AND uv.status = 'active'
      AND vt.category = 'wheel_spin'
      LIMIT 1
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'spin_id', v_spin_id,
    'prize_id', v_prize.id,
    'prize_name', v_prize.name,
    'prize_type', v_prize.type,
    'prize_rarity', v_prize.rarity,
    'voucher_id', v_voucher_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bean_balances_updated_at BEFORE UPDATE ON public.bean_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voucher_templates_updated_at BEFORE UPDATE ON public.voucher_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_analytics_updated_at BEFORE UPDATE ON public.menu_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_analytics_updated_at BEFORE UPDATE ON public.daily_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bean_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bean_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view/edit their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Bean balances: Users can view their own balance
CREATE POLICY "Users can view own bean balance"
  ON public.bean_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all bean balances"
  ON public.bean_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Bean transactions: Users can view their own transactions
CREATE POLICY "Users can view own bean transactions"
  ON public.bean_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all bean transactions"
  ON public.bean_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Daily visits: Users can view their own visits
CREATE POLICY "Users can view own daily visits"
  ON public.daily_visits FOR SELECT
  USING (auth.uid() = user_id);

-- Voucher templates: Everyone can view active templates
CREATE POLICY "Anyone can view active voucher templates"
  ON public.voucher_templates FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage voucher templates"
  ON public.voucher_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- User vouchers: Users can view their own vouchers
CREATE POLICY "Users can view own vouchers"
  ON public.user_vouchers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all vouchers"
  ON public.user_vouchers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can redeem vouchers"
  ON public.user_vouchers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Campaigns: Everyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON public.campaigns FOR SELECT
  USING (status = 'active');

CREATE POLICY "Staff can manage campaigns"
  ON public.campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- Campaign participations: Users can view their own participations
CREATE POLICY "Users can view own campaign participations"
  ON public.campaign_participations FOR SELECT
  USING (auth.uid() = user_id);

-- Wheel prizes: Everyone can view active prizes
CREATE POLICY "Anyone can view active wheel prizes"
  ON public.wheel_prizes FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage wheel prizes"
  ON public.wheel_prizes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- Wheel spins: Users can view their own spins
CREATE POLICY "Users can view own wheel spins"
  ON public.wheel_spins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all wheel spins"
  ON public.wheel_spins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Badges: Everyone can view active badges
CREATE POLICY "Anyone can view active badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage badges"
  ON public.badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- User badges: Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Purchases: Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all purchases"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Analytics: Staff can view analytics
CREATE POLICY "Staff can view analytics"
  ON public.daily_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view menu analytics"
  ON public.menu_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage notifications"
  ON public.notifications FOR ALL
  USING (true); -- Service role will manage this

-- Staff roles: Admins can manage staff roles
CREATE POLICY "Admins can manage staff roles"
  ON public.staff_roles FOR ALL
  USING (
    -- Use profiles table to check admin status to avoid recursion
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (preferences->>'role')::text = 'admin'
    )
  );

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default voucher templates
INSERT INTO public.voucher_templates (name, description, category, bean_threshold, expiry_days) VALUES
('Enhancer Voucher', 'Free syrup, crisps, or mini brownie', 'enhancer', 5, 30),
('Free Coffee', 'Any standard coffee or drink', 'coffee', 8, 30),
('Golden Duck Reward', 'Sandwich, toastie, or lunch combo', 'major', 20, 30),
('Wheel Spin', 'Spin the Lucky Duck Wheel', 'wheel_spin', 5, 7);

-- Insert default badges
INSERT INTO public.badges (name, description, tier, requirement_type, requirement_value) VALUES
('Founding Duck', 'Early member of Penkey Perks', 'legendary', 'specific_action', 1),
('100 Bean Club', 'Earned 100 lifetime beans', 'gold', 'lifetime_beans', 100),
('Local Legend', 'Earned 500 lifetime beans', 'platinum', 'lifetime_beans', 500),
('Lunch Club', 'Visited 50 times', 'silver', 'visit_count', 50),
('Brownie Addict', 'Visited 100 times', 'gold', 'visit_count', 100),
('Rainy Day Regular', 'Visited 25 times', 'bronze', 'visit_count', 25);

-- Insert default wheel prizes
INSERT INTO public.wheel_prizes (name, type, rarity, weight) VALUES
('Free Syrup', 'syrup', 'common', 15),
('Bonus Beans', 'bonus_beans', 'common', 20),
('Double Beans', 'double_beans', 'common', 15),
('Mini Brownie', 'brownie', 'rare', 10),
('£1 Lunch Reward', 'lunch_reward', 'rare', 8),
('Secret Menu Unlock', 'secret_menu', 'epic', 5),
('Duck Collectible', 'duck_collectible', 'epic', 3),
('Free Drink Voucher', 'drink_voucher', 'legendary', 2),
('Golden Duck', 'golden_duck', 'legendary', 1);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  bb.current_beans,
  bb.lifetime_beans,
  bb.visit_count,
  bb.last_visit_at,
  (SELECT COUNT(*) FROM public.user_vouchers WHERE user_id = p.id AND status = 'active') AS active_vouchers,
  (SELECT COUNT(*) FROM public.user_badges WHERE user_id = p.id) AS total_badges
FROM public.profiles p
LEFT JOIN public.bean_balances bb ON p.id = bb.user_id;

-- Active campaigns view
CREATE OR REPLACE VIEW active_campaigns AS
SELECT *
FROM public.campaigns
WHERE status = 'active'
AND start_at <= NOW()
AND end_at >= NOW();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
