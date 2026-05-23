-- =============================================
-- DYNAMIC WIN-BACK REWARDS SYSTEM
-- =============================================
-- Makes win-back rewards configurable in database
-- =============================================

-- =============================================
-- 1. WIN-BACK REWARDS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.winback_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  days_inactive INTEGER NOT NULL,  -- 30, 60, 90, etc.
  reward_type TEXT NOT NULL CHECK (reward_type IN ('stamps', 'points', 'free_item', 'discount', 'voucher')),
  reward_value TEXT NOT NULL,      -- '3 Bonus Stamps', 'Free Coffee', '£5 off', etc.
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,  -- Link to actual reward
  auto_create_voucher BOOLEAN DEFAULT false,  -- Auto-create voucher when user returns
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winback_rewards_days ON public.winback_rewards(days_inactive) WHERE active = true;

COMMENT ON TABLE public.winback_rewards IS 'Configurable rewards for win-back campaigns';

-- =============================================
-- 2. SEED WIN-BACK REWARDS
-- =============================================

INSERT INTO public.winback_rewards (name, description, days_inactive, reward_type, reward_value, auto_create_voucher, active) VALUES
  ('30 Day Return Bonus', '3 bonus stamps when you return', 30, 'stamps', '3 Bonus Stamps', false, true),
  ('60 Day Welcome Back', 'Free coffee + 5 bonus stamps', 60, 'free_item', 'Free Coffee + 5 Bonus Stamps', true, true),
  ('90 Day VIP Return', '£10 off your next visit', 90, 'discount', '£10 Off', true, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. USER WIN-BACK TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_winback_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  winback_reward_id UUID NOT NULL REFERENCES public.winback_rewards(id) ON DELETE CASCADE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  user_reward_id UUID REFERENCES public.user_rewards(id) ON DELETE SET NULL,  -- Link to created voucher
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, winback_reward_id)
);

CREATE INDEX IF NOT EXISTS idx_user_winback_user_id ON public.user_winback_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_winback_claimed ON public.user_winback_rewards(claimed) WHERE claimed = false;

COMMENT ON TABLE public.user_winback_rewards IS 'Tracks which win-back rewards have been sent to users';

-- =============================================
-- 4. UPDATE WIN-BACK EMAIL FUNCTIONS
-- =============================================

-- Updated 30-day win-back function
CREATE OR REPLACE FUNCTION public.send_winback_30_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_last_visit_date TEXT;
  v_winback_reward RECORD;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Get active 30-day win-back reward
  SELECT * INTO v_winback_reward
  FROM public.winback_rewards
  WHERE days_inactive = 30 AND active = true
  LIMIT 1;
  
  IF v_winback_reward IS NULL THEN
    RAISE NOTICE 'No active 30-day win-back reward configured';
    emails_queued := 0;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Find users inactive for exactly 30 days
  FOR v_user IN
    SELECT DISTINCT u.id, u.email, u.name,
           MAX(t.created_at) as last_visit
    FROM public.users u
    LEFT JOIN public.transactions t ON u.id = t.user_id AND t.action = 'check_in'
    GROUP BY u.id, u.email, u.name
    HAVING MAX(t.created_at) BETWEEN NOW() - INTERVAL '31 days' AND NOW() - INTERVAL '30 days'
       AND NOT EXISTS (
         SELECT 1 FROM public.user_winback_rewards uwr
         WHERE uwr.user_id = u.id
           AND uwr.winback_reward_id = v_winback_reward.id
       )
  LOOP
    v_last_visit_date := TO_CHAR(v_user.last_visit, 'FMMonth DD, YYYY');
    
    IF public.can_send_email(v_user.id, 'reengagement') THEN
      -- Queue win-back email
      PERFORM public.queue_email_from_template(
        'win_back_30',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'lastVisit', v_last_visit_date,
          'specialOffer', v_winback_reward.reward_value,
          'appUrl', v_app_url
        )
      );
      
      -- Track that we sent this
      INSERT INTO public.user_winback_rewards (
        user_id,
        winback_reward_id,
        email_sent_at,
        expires_at
      ) VALUES (
        v_user.id,
        v_winback_reward.id,
        NOW(),
        NOW() + INTERVAL '14 days'
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated 60-day win-back function
CREATE OR REPLACE FUNCTION public.send_winback_60_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_winback_reward RECORD;
  v_qr_code TEXT;
  v_user_reward_id UUID;
  v_count INTEGER := 0;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Get active 60-day win-back reward
  SELECT * INTO v_winback_reward
  FROM public.winback_rewards
  WHERE days_inactive = 60 AND active = true
  LIMIT 1;
  
  IF v_winback_reward IS NULL THEN
    emails_queued := 0;
    RETURN NEXT;
    RETURN;
  END IF;
  
  FOR v_user IN
    SELECT DISTINCT u.id, u.email, u.name
    FROM public.users u
    LEFT JOIN public.transactions t ON u.id = t.user_id AND t.action = 'check_in'
    GROUP BY u.id, u.email, u.name
    HAVING MAX(t.created_at) BETWEEN NOW() - INTERVAL '61 days' AND NOW() - INTERVAL '60 days'
       AND NOT EXISTS (
         SELECT 1 FROM public.user_winback_rewards uwr
         WHERE uwr.user_id = u.id
           AND uwr.winback_reward_id = v_winback_reward.id
       )
  LOOP
    -- Create voucher if configured
    IF v_winback_reward.auto_create_voucher AND v_winback_reward.reward_id IS NOT NULL THEN
      v_qr_code := 'WINBACK60-' || SUBSTRING(MD5(v_user.id::TEXT || NOW()::TEXT), 1, 10);
      
      INSERT INTO public.user_rewards (
        user_id,
        reward_id,
        qr_code,
        expires_at,
        status
      ) VALUES (
        v_user.id,
        v_winback_reward.reward_id,
        v_qr_code,
        NOW() + INTERVAL '14 days',
        'active'
      )
      RETURNING id INTO v_user_reward_id;
    END IF;
    
    IF public.can_send_email(v_user.id, 'reengagement') THEN
      PERFORM public.queue_email_from_template(
        'win_back_60',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'bonusStamps', v_winback_reward.reward_value,
          'specialReward', v_winback_reward.reward_value,
          'appUrl', v_app_url
        )
      );
      
      -- Track win-back reward
      INSERT INTO public.user_winback_rewards (
        user_id,
        winback_reward_id,
        email_sent_at,
        user_reward_id,
        expires_at
      ) VALUES (
        v_user.id,
        v_winback_reward.id,
        NOW(),
        v_user_reward_id,
        NOW() + INTERVAL '14 days'
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. FUNCTION: Claim Win-Back Reward on Check-In
-- =============================================

CREATE OR REPLACE FUNCTION public.claim_winback_reward_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_winback RECORD;
BEGIN
  -- Only process check-ins
  IF NEW.action != 'check_in' THEN
    RETURN NEW;
  END IF;
  
  -- Find unclaimed win-back rewards for this user
  FOR v_winback IN
    SELECT uwr.*, wr.reward_type, wr.reward_value
    FROM public.user_winback_rewards uwr
    JOIN public.winback_rewards wr ON uwr.winback_reward_id = wr.id
    WHERE uwr.user_id = NEW.user_id
      AND uwr.claimed = false
      AND uwr.expires_at > NOW()
  LOOP
    -- Mark as claimed
    UPDATE public.user_winback_rewards
    SET claimed = true,
        claimed_at = NOW()
    WHERE id = v_winback.id;
    
    -- Award the reward based on type
    CASE v_winback.reward_type
      WHEN 'stamps' THEN
        -- Add bonus stamps (extract number from reward_value)
        DECLARE
          v_stamps INTEGER;
        BEGIN
          v_stamps := SUBSTRING(v_winback.reward_value FROM '[0-9]+')::INTEGER;
          FOR i IN 1..v_stamps LOOP
            INSERT INTO public.coffee_stamps (user_id, awarded_by, notes)
            VALUES (NEW.user_id, 'system', 'Win-back bonus: ' || v_winback.reward_value);
          END LOOP;
        END;
        
      WHEN 'points' THEN
        -- Add bonus points
        DECLARE
          v_points INTEGER;
        BEGIN
          v_points := SUBSTRING(v_winback.reward_value FROM '[0-9]+')::INTEGER;
          PERFORM public.add_points(
            NEW.user_id,
            v_points,
            'winback_bonus',
            'Win-back bonus: ' || v_winback.reward_value
          );
        END;
        
      ELSE
        -- Voucher already created, just mark as claimed
        NULL;
    END CASE;
    
    RAISE NOTICE 'Win-back reward claimed: % for user %', v_winback.reward_value, NEW.user_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS claim_winback_on_checkin ON public.transactions;
CREATE TRIGGER claim_winback_on_checkin
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_winback_reward_on_checkin();

-- =============================================
-- 6. RLS POLICIES
-- =============================================

ALTER TABLE public.winback_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_winback_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active winback rewards"
  ON public.winback_rewards FOR SELECT
  USING (active = true);

CREATE POLICY "Users can view own winback rewards"
  ON public.user_winback_rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access to winback_rewards"
  ON public.winback_rewards FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to user_winback_rewards"
  ON public.user_winback_rewards FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.winback_rewards TO service_role;
GRANT SELECT ON public.winback_rewards TO authenticated;
GRANT ALL ON public.user_winback_rewards TO service_role;
GRANT SELECT ON public.user_winback_rewards TO authenticated;

GRANT EXECUTE ON FUNCTION public.send_winback_30_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.send_winback_60_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_winback_reward_on_checkin TO service_role;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Dynamic win-back rewards system created!' as message;
SELECT 'Change rewards in winback_rewards table' as feature1;
SELECT 'Rewards auto-claimed on check-in' as feature2;
SELECT 'Fully configurable via database' as feature3;
