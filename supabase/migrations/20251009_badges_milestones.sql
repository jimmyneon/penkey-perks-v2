-- =============================================
-- BADGES & MILESTONES SYSTEM
-- Fun achievements and lifetime rewards
-- =============================================

-- =============================================
-- 1. BADGES SYSTEM
-- =============================================

-- User badges (earned achievements)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_tier TEXT NOT NULL CHECK (badge_tier IN (
    'newbie', 'regular', 'vip', 'champion', 'legend', 'master'
  )),
  badge_name TEXT NOT NULL,
  fun_title TEXT, -- e.g., "Lord of the Ducks", "Penkey Privateer"
  lifetime_points INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_tier)
);

-- Badge definitions (what each tier requires)
CREATE TABLE IF NOT EXISTS public.badge_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL UNIQUE CHECK (tier IN (
    'newbie', 'regular', 'vip', 'champion', 'legend', 'master'
  )),
  name TEXT NOT NULL,
  fun_title TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  perks JSONB, -- e.g., {"birthday_bonus": 5, "priority_support": true}
  image_url TEXT,
  order_index INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. MILESTONES SYSTEM
-- =============================================

-- Milestone definitions (what customers can achieve)
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'visits', 'points', 'stamps', 'referrals', 'games_played'
  )),
  requirement_value INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'points', 'voucher', 'badge', 'free_item', 'custom'
  )),
  reward_value TEXT, -- JSON or text describing the reward
  one_time BOOLEAN DEFAULT TRUE, -- Can only be earned once
  active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User milestones (track what users have achieved)
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, milestone_id)
);

-- =============================================
-- 3. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_tier ON public.user_badges(badge_tier);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_milestone_id ON public.user_milestones(milestone_id);

-- =============================================
-- 4. FUNCTIONS
-- =============================================

-- Function: Get user's lifetime points
CREATE OR REPLACE FUNCTION public.get_lifetime_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  -- Sum all positive points (earnings, not redemptions)
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM public.points_transactions
  WHERE user_id = p_user_id AND amount > 0;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and award badge upgrades
CREATE OR REPLACE FUNCTION public.check_badge_upgrade(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lifetime_points INTEGER;
  v_current_badge RECORD;
  v_next_badge RECORD;
  v_upgraded BOOLEAN := FALSE;
BEGIN
  -- Get lifetime points
  v_lifetime_points := public.get_lifetime_points(p_user_id);
  
  -- Get current badge
  SELECT * INTO v_current_badge
  FROM public.user_badges
  WHERE user_id = p_user_id
  ORDER BY earned_at DESC
  LIMIT 1;
  
  -- Find highest eligible badge tier
  SELECT * INTO v_next_badge
  FROM public.badge_tiers
  WHERE points_required <= v_lifetime_points
    AND active = TRUE
  ORDER BY points_required DESC
  LIMIT 1;
  
  -- Check if upgrade needed
  IF v_next_badge.id IS NOT NULL AND 
     (v_current_badge.id IS NULL OR v_next_badge.points_required > v_current_badge.lifetime_points) THEN
    
    -- Award new badge
    INSERT INTO public.user_badges (
      user_id, badge_tier, badge_name, fun_title, lifetime_points
    ) VALUES (
      p_user_id, 
      v_next_badge.tier, 
      v_next_badge.name, 
      v_next_badge.fun_title,
      v_lifetime_points
    )
    ON CONFLICT (user_id, badge_tier) DO UPDATE
    SET lifetime_points = v_lifetime_points, earned_at = NOW();
    
    v_upgraded := TRUE;
  END IF;
  
  RETURN jsonb_build_object(
    'upgraded', v_upgraded,
    'badge', CASE WHEN v_upgraded THEN row_to_json(v_next_badge) ELSE NULL END,
    'lifetime_points', v_lifetime_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and award milestones
CREATE OR REPLACE FUNCTION public.check_milestones(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_milestone RECORD;
  v_user_value INTEGER;
  v_new_milestones JSONB := '[]'::jsonb;
BEGIN
  -- Loop through all active milestones
  FOR v_milestone IN 
    SELECT * FROM public.milestones 
    WHERE active = TRUE
  LOOP
    -- Check if already achieved
    IF EXISTS (
      SELECT 1 FROM public.user_milestones 
      WHERE user_id = p_user_id AND milestone_id = v_milestone.id
    ) THEN
      CONTINUE; -- Skip if already achieved
    END IF;
    
    -- Get user's current value for this requirement
    CASE v_milestone.requirement_type
      WHEN 'visits' THEN
        SELECT COUNT(*) INTO v_user_value
        FROM public.points_transactions
        WHERE user_id = p_user_id AND source = 'visit';
        
      WHEN 'points' THEN
        v_user_value := public.get_lifetime_points(p_user_id);
        
      WHEN 'stamps' THEN
        SELECT COUNT(*) INTO v_user_value
        FROM public.coffee_stamps
        WHERE user_id = p_user_id;
        
      WHEN 'referrals' THEN
        SELECT COUNT(*) INTO v_user_value
        FROM public.referrals
        WHERE referrer_id = p_user_id AND confirmed = TRUE;
        
      WHEN 'games_played' THEN
        SELECT COUNT(*) INTO v_user_value
        FROM public.game_plays
        WHERE user_id = p_user_id;
        
      ELSE
        v_user_value := 0;
    END CASE;
    
    -- Check if milestone achieved
    IF v_user_value >= v_milestone.requirement_value THEN
      -- Award milestone
      INSERT INTO public.user_milestones (user_id, milestone_id)
      VALUES (p_user_id, v_milestone.id)
      ON CONFLICT DO NOTHING;
      
      -- Add to result
      v_new_milestones := v_new_milestones || jsonb_build_object(
        'id', v_milestone.id,
        'name', v_milestone.name,
        'description', v_milestone.description,
        'reward_type', v_milestone.reward_type,
        'reward_value', v_milestone.reward_value
      );
      
      -- Award the reward
      CASE v_milestone.reward_type
        WHEN 'points' THEN
          PERFORM public.add_points(
            p_user_id,
            v_milestone.reward_value::INTEGER,
            'manual_add',
            'Milestone: ' || v_milestone.name
          );
          
        WHEN 'free_item' THEN
          -- Create reward voucher (if reward exists)
          INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
          SELECT 
            p_user_id,
            r.id,
            'MILESTONE-' || substr(md5(random()::text), 1, 12),
            NOW() + INTERVAL '30 days'
          FROM public.rewards r
          WHERE r.name = v_milestone.reward_value AND r.active = TRUE
          LIMIT 1;
          
        ELSE
          NULL; -- Other reward types handled manually
      END CASE;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'new_milestones', v_new_milestones,
    'count', jsonb_array_length(v_new_milestones)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger: Check badges and milestones after points added
CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for badge upgrades
  PERFORM public.check_badge_upgrade(NEW.user_id);
  
  -- Check for new milestones
  PERFORM public.check_milestones(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_points_added ON public.points_transactions;
CREATE TRIGGER after_points_added
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  WHEN (NEW.amount > 0) -- Only on earning points, not spending
  EXECUTE FUNCTION public.trigger_check_achievements();

-- =============================================
-- 6. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view badge tiers
DROP POLICY IF EXISTS "Anyone can view badge tiers" ON public.badge_tiers;
CREATE POLICY "Anyone can view badge tiers" ON public.badge_tiers
  FOR SELECT USING (active = TRUE);

-- Everyone can view active milestones
DROP POLICY IF EXISTS "Anyone can view milestones" ON public.milestones;
CREATE POLICY "Anyone can view milestones" ON public.milestones
  FOR SELECT USING (active = TRUE);

-- Users can view their own milestones
DROP POLICY IF EXISTS "Users can view own milestones" ON public.user_milestones;
CREATE POLICY "Users can view own milestones" ON public.user_milestones
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- 7. SEED DATA
-- =============================================

-- Insert badge tiers
INSERT INTO public.badge_tiers (tier, name, fun_title, points_required, perks, order_index) VALUES
('newbie', 'Penkey Newbie', 'Fresh Duck', 0, '{"welcome_bonus": true}'::jsonb, 1),
('regular', 'Penkey Regular', 'Quacking Customer', 50, '{"birthday_bonus": 5}'::jsonb, 2),
('vip', 'Penkey VIP', 'Duck Commander', 200, '{"priority_support": true, "birthday_bonus": 10}'::jsonb, 3),
('champion', 'Penkey Champion', 'Lord of the Ducks', 500, '{"exclusive_rewards": true, "birthday_bonus": 15}'::jsonb, 4),
('legend', 'Penkey Legend', 'Penkey Privateer', 1000, '{"vip_events": true, "birthday_bonus": 20}'::jsonb, 5),
('master', 'Penkey Master', 'Grand Duck Master', 2000, '{"lifetime_perks": true, "birthday_bonus": 50}'::jsonb, 6)
ON CONFLICT (tier) DO NOTHING;

-- Insert milestones
INSERT INTO public.milestones (name, description, requirement_type, requirement_value, reward_type, reward_value, one_time) VALUES
('First Visit', 'Welcome to Penkey Perks!', 'visits', 1, 'points', '10', TRUE),
('Coffee Lover', 'Collected 10 coffee stamps', 'stamps', 10, 'points', '20', FALSE),
('Game Master', 'Played 10 games', 'games_played', 10, 'points', '25', TRUE),
('Social Butterfly', 'Referred 5 friends', 'referrals', 5, 'points', '50', TRUE),
('Loyal Customer', 'Made 50 visits', 'visits', 50, 'free_item', 'Free Coffee', TRUE),
('Century Club', 'Made 100 visits', 'visits', 100, 'voucher', '£20 off', TRUE),
('Points Collector', 'Earned 500 lifetime points', 'points', 500, 'points', '100', TRUE),
('Points Master', 'Earned 1000 lifetime points', 'points', 1000, 'points', '200', TRUE)
ON CONFLICT DO NOTHING;

-- =============================================
-- COMPLETE
-- =============================================
