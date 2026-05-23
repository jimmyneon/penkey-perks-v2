-- =============================================
-- CREATE POINTS CONFIGURATION TABLE
-- =============================================
-- This table stores all possible point awards so they can be:
-- 1. Managed from admin dashboard
-- 2. Applied consistently server-side
-- 3. Changed without code deployments
-- 4. Audited and tracked
-- =============================================

-- 1. Create points_config table
-- =============================================
CREATE TABLE IF NOT EXISTS public.points_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL UNIQUE, -- e.g., 'signup', 'daily_checkin', 'referral_complete'
  points_amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  min_interval_hours INTEGER, -- Cooldown period (NULL = no cooldown)
  max_per_day INTEGER, -- Max times per day (NULL = unlimited)
  requires_verification BOOLEAN DEFAULT FALSE, -- Requires staff approval
  metadata JSONB, -- Extra config (e.g., conditions, multipliers)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_points_config_action_type ON public.points_config(action_type);
CREATE INDEX IF NOT EXISTS idx_points_config_active ON public.points_config(active);

-- 3. Enable RLS
-- =============================================
ALTER TABLE public.points_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active configs (needed for client-side display)
CREATE POLICY "Anyone can view active point configs"
  ON public.points_config
  FOR SELECT
  USING (active = TRUE);

-- Only admins can modify
CREATE POLICY "Only admins can modify point configs"
  ON public.points_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- 4. Insert default point configurations
-- =============================================
INSERT INTO public.points_config (action_type, points_amount, description, min_interval_hours, max_per_day, requires_verification, metadata) VALUES

-- Core Actions
('signup', 10, 'Welcome bonus for new account registration', NULL, 1, FALSE, '{"auto_award": true}'::jsonb),
('daily_checkin', 5, 'Daily visit check-in at shop', 24, 1, FALSE, '{"requires_location": true}'::jsonb),
('profile_complete', 5, 'Complete profile with phone and birthday', NULL, 1, FALSE, '{"required_fields": ["phone", "date_of_birth"]}'::jsonb),

-- Social Actions
('referral_signup', 20, 'Friend signs up with your referral code', NULL, NULL, FALSE, '{"awarded_to": "referrer"}'::jsonb),
('referral_first_purchase', 10, 'Referred friend makes first purchase', NULL, NULL, FALSE, '{"awarded_to": "referrer"}'::jsonb),
('social_share', 2, 'Share Penkey on social media', 24, 1, FALSE, '{"platforms": ["facebook", "twitter", "instagram"]}'::jsonb),
('review_posted', 15, 'Post review on Google/Facebook', NULL, 1, TRUE, '{"requires_verification": true}'::jsonb),

-- Engagement Actions
('birthday_bonus', 25, 'Birthday bonus (awarded on birthday)', NULL, 1, FALSE, '{"auto_award": true, "award_on": "birthday"}'::jsonb),
('streak_7_days', 10, 'Check in 7 days in a row', NULL, NULL, FALSE, '{"streak_required": 7}'::jsonb),
('streak_30_days', 50, 'Check in 30 days in a row', NULL, NULL, FALSE, '{"streak_required": 30}'::jsonb),
('first_game_play', 5, 'Play your first mini-game', NULL, 1, FALSE, '{"one_time_only": true}'::jsonb),

-- Game Prizes (variable amounts)
('game_win_small', 5, 'Small game prize', NULL, NULL, FALSE, '{"prize_tier": "small"}'::jsonb),
('game_win_medium', 10, 'Medium game prize', NULL, NULL, FALSE, '{"prize_tier": "medium"}'::jsonb),
('game_win_large', 20, 'Large game prize', NULL, NULL, FALSE, '{"prize_tier": "large"}'::jsonb),
('game_win_jackpot', 50, 'Jackpot game prize', NULL, NULL, FALSE, '{"prize_tier": "jackpot"}'::jsonb),

-- Staff Actions
('manual_award', 0, 'Manual points award by staff (variable amount)', NULL, NULL, TRUE, '{"variable_amount": true}'::jsonb),
('compensation', 0, 'Compensation for issue (variable amount)', NULL, NULL, TRUE, '{"variable_amount": true}'::jsonb),
('event_participation', 10, 'Participate in special event', NULL, 1, FALSE, '{"event_specific": true}'::jsonb),

-- Purchase Actions (future)
('purchase_bonus', 1, 'Points per £1 spent (future feature)', NULL, NULL, FALSE, '{"multiplier": 1, "per_currency": "GBP"}'::jsonb),
('first_purchase', 20, 'First purchase bonus (future feature)', NULL, 1, FALSE, '{"one_time_only": true}'::jsonb);

-- 5. Create function to get points for action
-- =============================================
CREATE OR REPLACE FUNCTION public.get_points_for_action(
  p_action_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
BEGIN
  SELECT points_amount INTO v_points
  FROM public.points_config
  WHERE action_type = p_action_type
    AND active = TRUE;
  
  RETURN COALESCE(v_points, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_points_for_action IS 'Get points amount for a specific action type';

-- 6. Create function to check if action is allowed
-- =============================================
CREATE OR REPLACE FUNCTION public.can_perform_points_action(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_last_action TIMESTAMP WITH TIME ZONE;
  v_today_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get config for this action
  SELECT * INTO v_config
  FROM public.points_config
  WHERE action_type = p_action_type
    AND active = TRUE;
  
  -- Action not found or inactive
  IF v_config IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'Action not found or inactive'
    );
  END IF;
  
  -- Check cooldown (min_interval_hours)
  IF v_config.min_interval_hours IS NOT NULL THEN
    SELECT MAX(created_at) INTO v_last_action
    FROM public.points_transactions
    WHERE user_id = p_user_id
      AND source = p_action_type;
    
    IF v_last_action IS NOT NULL AND 
       (NOW() - v_last_action) < (v_config.min_interval_hours || ' hours')::INTERVAL THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'Cooldown period not elapsed',
        'next_available', v_last_action + (v_config.min_interval_hours || ' hours')::INTERVAL
      );
    END IF;
  END IF;
  
  -- Check max per day
  IF v_config.max_per_day IS NOT NULL THEN
    SELECT COUNT(*) INTO v_today_count
    FROM public.points_transactions
    WHERE user_id = p_user_id
      AND source = p_action_type
      AND created_at >= date_trunc('day', NOW());
    
    IF v_today_count >= v_config.max_per_day THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'Daily limit reached',
        'max_per_day', v_config.max_per_day
      );
    END IF;
  END IF;
  
  -- Action is allowed
  RETURN jsonb_build_object(
    'allowed', TRUE,
    'points_amount', v_config.points_amount,
    'requires_verification', v_config.requires_verification,
    'metadata', v_config.metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_perform_points_action IS 'Check if user can perform a points action (checks cooldowns and limits)';

-- 7. Update add_points to use config table
-- =============================================
-- This is an enhanced version that validates against points_config
CREATE OR REPLACE FUNCTION public.add_points_validated(
  p_user_id UUID,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_override_amount INTEGER DEFAULT NULL -- For variable amounts (staff awards)
)
RETURNS JSONB AS $$
DECLARE
  v_validation JSONB;
  v_points_amount INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check if action is allowed
  v_validation := public.can_perform_points_action(p_user_id, p_action_type);
  
  IF NOT (v_validation->>'allowed')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', v_validation->>'reason',
      'validation', v_validation
    );
  END IF;
  
  -- Get points amount (use override if provided, otherwise from config)
  v_points_amount := COALESCE(
    p_override_amount,
    (v_validation->>'points_amount')::INTEGER
  );
  
  -- Award points using existing add_points function
  v_new_balance := public.add_points(
    p_user_id,
    v_points_amount,
    p_action_type,
    COALESCE(p_description, (
      SELECT description FROM public.points_config 
      WHERE action_type = p_action_type
    )),
    p_metadata
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'points_awarded', v_points_amount,
    'new_balance', v_new_balance,
    'action_type', p_action_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_points_validated IS 'Award points with validation against points_config table';

-- 8. Create view for admin dashboard
-- =============================================
CREATE OR REPLACE VIEW public.points_config_with_usage AS
SELECT 
  pc.id,
  pc.action_type,
  pc.points_amount,
  pc.description,
  pc.active,
  pc.min_interval_hours,
  pc.max_per_day,
  pc.requires_verification,
  pc.metadata,
  COUNT(DISTINCT pt.user_id) as unique_users,
  COUNT(pt.id) as total_uses,
  SUM(pt.amount) as total_points_awarded,
  MAX(pt.created_at) as last_used,
  pc.created_at,
  pc.updated_at
FROM public.points_config pc
LEFT JOIN public.points_transactions pt ON pt.source = pc.action_type
GROUP BY pc.id, pc.action_type, pc.points_amount, pc.description, 
         pc.active, pc.min_interval_hours, pc.max_per_day, 
         pc.requires_verification, pc.metadata, pc.created_at, pc.updated_at;

COMMENT ON VIEW public.points_config_with_usage IS 'Points config with usage statistics for admin dashboard';

-- 9. Update existing source constraint to allow any action_type
-- =============================================
-- Remove the old constraint that limits sources
ALTER TABLE public.points_transactions 
DROP CONSTRAINT IF EXISTS points_transactions_source_check;

-- Don't add a new constraint - allow any source from points_config
-- This makes the system flexible

-- 10. Add trigger to update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_points_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_config_updated_at
  BEFORE UPDATE ON public.points_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_points_config_updated_at();

-- 11. Success message
-- =============================================
SELECT 
  '✅ Points configuration table created!' as message,
  COUNT(*) as total_configs,
  SUM(CASE WHEN active THEN 1 ELSE 0 END) as active_configs
FROM public.points_config;
