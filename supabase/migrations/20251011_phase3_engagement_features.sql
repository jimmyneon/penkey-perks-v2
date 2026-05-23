-- =============================================
-- PHASE 3: ENGAGEMENT FEATURES
-- =============================================
-- Check-In Combos, Lucky Times, Surprise Boxes
-- =============================================

-- =============================================
-- 1. CHECK-IN COMBOS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.check_in_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  required_check_ins INTEGER NOT NULL,  -- e.g., 3 for "3 times this week"
  time_window TEXT NOT NULL CHECK (time_window IN ('week', 'month', 'any')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'stamps', 'voucher', 'custom')),
  reward_amount INTEGER,
  reward_description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_check_in_combos_active ON public.check_in_combos(active) WHERE active = true;

COMMENT ON TABLE public.check_in_combos IS 'Check-in combo challenges (e.g., visit 3x this week for bonus)';

-- Seed check-in combos
INSERT INTO public.check_in_combos (name, description, required_check_ins, time_window, reward_type, reward_amount, reward_description) VALUES
  ('Weekly Warrior', 'Check in 3 times this week', 3, 'week', 'stamps', 5, '5 Bonus Stamps'),
  ('Perfect Week', 'Check in 5 times this week', 5, 'week', 'points', 25, '25 Bonus Points'),
  ('Weekend Warrior', 'Check in both Saturday and Sunday', 2, 'week', 'stamps', 10, '10 Bonus Stamps'),
  ('Monthly Champion', 'Check in 15 times this month', 15, 'month', 'points', 100, '100 Bonus Points')
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. USER COMBO PROGRESS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_combo_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  combo_id UUID NOT NULL REFERENCES public.check_in_combos(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,  -- Start of week/month
  check_in_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, combo_id, period_start)
);

CREATE INDEX idx_user_combo_progress_user_id ON public.user_combo_progress(user_id);
CREATE INDEX idx_user_combo_progress_completed ON public.user_combo_progress(completed) WHERE completed = true;

COMMENT ON TABLE public.user_combo_progress IS 'Tracks user progress on check-in combos';

-- =============================================
-- 3. LUCKY CHECK-IN TIMES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.lucky_check_in_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time_of_day TIME NOT NULL,  -- e.g., '11:11:00'
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'stamps')),
  reward_amount INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(time_of_day)
);

CREATE INDEX idx_lucky_times_active ON public.lucky_check_in_times(active) WHERE active = true;

COMMENT ON TABLE public.lucky_check_in_times IS 'Lucky times for bonus rewards (e.g., 11:11 = 11 stamps)';

-- Seed lucky times
INSERT INTO public.lucky_check_in_times (time_of_day, name, description, reward_type, reward_amount) VALUES
  ('11:11:00', 'Lucky 11:11', 'Check in at 11:11 for lucky bonus!', 'stamps', 11),
  ('14:22:00', 'Lucky 2:22', 'Check in at 2:22 for lucky bonus!', 'points', 22),
  ('15:33:00', 'Lucky 3:33', 'Check in at 3:33 for lucky bonus!', 'points', 33),
  ('16:44:00', 'Lucky 4:44', 'Check in at 4:44 for lucky bonus!', 'stamps', 4)
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. SURPRISE BOX PRIZES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.surprise_box_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('points', 'stamps', 'voucher', 'custom')),
  prize_amount INTEGER,
  prize_description TEXT,
  probability DECIMAL NOT NULL CHECK (probability >= 0 AND probability <= 1),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_surprise_prizes_active ON public.surprise_box_prizes(active) WHERE active = true;

COMMENT ON TABLE public.surprise_box_prizes IS 'Prize pool for surprise boxes (5% chance on check-in)';

-- Seed surprise box prizes
INSERT INTO public.surprise_box_prizes (name, prize_type, prize_amount, prize_description, probability) VALUES
  ('Small Bonus', 'stamps', 3, '3 Bonus Stamps', 0.50),
  ('Medium Bonus', 'stamps', 5, '5 Bonus Stamps', 0.30),
  ('Big Bonus', 'points', 20, '20 Bonus Points', 0.15),
  ('Mega Bonus', 'points', 50, '50 Bonus Points', 0.05)
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. USER SURPRISE BOX HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_surprise_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.surprise_box_prizes(id),
  prize_type TEXT NOT NULL,
  prize_amount INTEGER,
  prize_description TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_surprise_boxes_user_id ON public.user_surprise_boxes(user_id);
CREATE INDEX idx_user_surprise_boxes_opened_at ON public.user_surprise_boxes(opened_at);

COMMENT ON TABLE public.user_surprise_boxes IS 'History of surprise boxes opened by users';

-- =============================================
-- 6. FUNCTION: Check Combo Progress
-- =============================================

CREATE OR REPLACE FUNCTION public.check_combo_progress(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_combo RECORD;
  v_progress RECORD;
  v_period_start DATE;
  v_check_in_count INTEGER;
  v_completed_combos JSONB := '[]'::jsonb;
BEGIN
  -- Check each active combo
  FOR v_combo IN
    SELECT * FROM public.check_in_combos WHERE active = true
  LOOP
    -- Determine period start
    IF v_combo.time_window = 'week' THEN
      v_period_start := date_trunc('week', CURRENT_DATE)::DATE;
    ELSIF v_combo.time_window = 'month' THEN
      v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
    ELSE
      v_period_start := '2000-01-01'::DATE; -- All time
    END IF;
    
    -- Count check-ins in this period
    SELECT COUNT(*) INTO v_check_in_count
    FROM public.transactions
    WHERE user_id = p_user_id
      AND action = 'check_in'
      AND created_at >= v_period_start::TIMESTAMP;
    
    -- Get or create progress record
    INSERT INTO public.user_combo_progress (
      user_id, combo_id, period_start, check_in_count
    ) VALUES (
      p_user_id, v_combo.id, v_period_start, v_check_in_count
    )
    ON CONFLICT (user_id, combo_id, period_start) 
    DO UPDATE SET 
      check_in_count = v_check_in_count,
      updated_at = NOW();
    
    -- Check if combo completed
    IF v_check_in_count >= v_combo.required_check_ins THEN
      -- Get progress record
      SELECT * INTO v_progress
      FROM public.user_combo_progress
      WHERE user_id = p_user_id
        AND combo_id = v_combo.id
        AND period_start = v_period_start;
      
      -- If not already completed, mark as complete and award reward
      IF NOT v_progress.completed THEN
        -- Mark as completed
        UPDATE public.user_combo_progress
        SET completed = true,
            completed_at = NOW(),
            reward_claimed = true,
            updated_at = NOW()
        WHERE id = v_progress.id;
        
        -- Award reward as pending
        INSERT INTO public.pending_rewards (
          user_id,
          reward_type,
          amount,
          reward_name,
          reward_description,
          source,
          source_id,
          metadata
        ) VALUES (
          p_user_id,
          v_combo.reward_type,
          v_combo.reward_amount,
          'Combo Bonus: ' || v_combo.name,
          v_combo.reward_description,
          'combo_bonus',
          v_combo.id,
          jsonb_build_object(
            'combo_name', v_combo.name,
            'required_check_ins', v_combo.required_check_ins,
            'time_window', v_combo.time_window
          )
        );
        
        -- Add to completed list
        v_completed_combos := v_completed_combos || jsonb_build_object(
          'combo_name', v_combo.name,
          'reward', v_combo.reward_description
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'completed_combos', v_completed_combos,
    'count', jsonb_array_length(v_completed_combos)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_combo_progress IS 'Checks and awards check-in combo bonuses';

-- =============================================
-- 7. FUNCTION: Check Lucky Time
-- =============================================

CREATE OR REPLACE FUNCTION public.check_lucky_time()
RETURNS JSONB AS $$
DECLARE
  v_current_time TIME;
  v_lucky_time RECORD;
BEGIN
  v_current_time := CURRENT_TIME;
  
  -- Check if current time matches any lucky time (within 1 minute)
  SELECT * INTO v_lucky_time
  FROM public.lucky_check_in_times
  WHERE active = true
    AND ABS(EXTRACT(EPOCH FROM (time_of_day - v_current_time))) <= 60
  LIMIT 1;
  
  IF v_lucky_time IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_lucky', true,
      'lucky_time', v_lucky_time.name,
      'reward_type', v_lucky_time.reward_type,
      'reward_amount', v_lucky_time.reward_amount,
      'description', v_lucky_time.description
    );
  ELSE
    RETURN jsonb_build_object('is_lucky', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_lucky_time IS 'Checks if current time is a lucky time for bonus';

-- =============================================
-- 8. FUNCTION: Open Surprise Box
-- =============================================

CREATE OR REPLACE FUNCTION public.open_surprise_box(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_random DECIMAL;
  v_cumulative DECIMAL := 0;
  v_prize RECORD;
BEGIN
  -- 5% chance to get a surprise box
  IF random() > 0.05 THEN
    RETURN jsonb_build_object('has_surprise', false);
  END IF;
  
  -- Select a prize based on probability
  v_random := random();
  
  FOR v_prize IN
    SELECT * FROM public.surprise_box_prizes
    WHERE active = true
    ORDER BY probability DESC
  LOOP
    v_cumulative := v_cumulative + v_prize.probability;
    IF v_random <= v_cumulative THEN
      -- Log the surprise box
      INSERT INTO public.user_surprise_boxes (
        user_id, prize_id, prize_type, prize_amount, prize_description
      ) VALUES (
        p_user_id, v_prize.id, v_prize.prize_type, 
        v_prize.prize_amount, v_prize.prize_description
      );
      
      -- Award as pending reward
      INSERT INTO public.pending_rewards (
        user_id,
        reward_type,
        amount,
        reward_name,
        reward_description,
        source,
        source_id
      ) VALUES (
        p_user_id,
        v_prize.prize_type,
        v_prize.prize_amount,
        'Surprise Box: ' || v_prize.name,
        v_prize.prize_description,
        'combo_bonus',
        v_prize.id
      );
      
      RETURN jsonb_build_object(
        'has_surprise', true,
        'prize_name', v_prize.name,
        'prize_type', v_prize.prize_type,
        'prize_amount', v_prize.prize_amount,
        'prize_description', v_prize.prize_description
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('has_surprise', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.open_surprise_box IS 'Opens a surprise box (5% chance) and awards random prize';

-- =============================================
-- 9. RLS POLICIES
-- =============================================

ALTER TABLE public.check_in_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_combo_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_check_in_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_box_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_surprise_boxes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active combos
CREATE POLICY "Anyone can view active combos"
  ON public.check_in_combos FOR SELECT
  USING (active = true);

-- Users can view own progress
CREATE POLICY "Users can view own combo progress"
  ON public.user_combo_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can view lucky times
CREATE POLICY "Anyone can view lucky times"
  ON public.lucky_check_in_times FOR SELECT
  USING (active = true);

-- Anyone can view surprise prizes
CREATE POLICY "Anyone can view surprise prizes"
  ON public.surprise_box_prizes FOR SELECT
  USING (active = true);

-- Users can view own surprise history
CREATE POLICY "Users can view own surprise boxes"
  ON public.user_surprise_boxes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to combos"
  ON public.check_in_combos FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to combo progress"
  ON public.user_combo_progress FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to lucky times"
  ON public.lucky_check_in_times FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to surprise prizes"
  ON public.surprise_box_prizes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to surprise history"
  ON public.user_surprise_boxes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- 10. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.check_in_combos TO service_role;
GRANT SELECT ON public.check_in_combos TO authenticated;

GRANT ALL ON public.user_combo_progress TO service_role;
GRANT SELECT ON public.user_combo_progress TO authenticated;

GRANT ALL ON public.lucky_check_in_times TO service_role;
GRANT SELECT ON public.lucky_check_in_times TO authenticated;

GRANT ALL ON public.surprise_box_prizes TO service_role;
GRANT SELECT ON public.surprise_box_prizes TO authenticated;

GRANT ALL ON public.user_surprise_boxes TO service_role;
GRANT SELECT ON public.user_surprise_boxes TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_combo_progress TO service_role;
GRANT EXECUTE ON FUNCTION public.check_lucky_time TO service_role;
GRANT EXECUTE ON FUNCTION public.open_surprise_box TO service_role;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Phase 3: Engagement features created!' as message;
SELECT 'Check-in combos, lucky times, surprise boxes ready!' as features;
