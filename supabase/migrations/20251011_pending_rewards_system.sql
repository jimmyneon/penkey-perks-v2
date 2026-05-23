-- =============================================
-- PENDING REWARDS SYSTEM - PHASE 1
-- =============================================
-- Makes rewards pending until user checks in at store
-- Includes second chance system for expired rewards
-- =============================================

-- =============================================
-- 1. PENDING REWARDS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.pending_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Reward type
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'points',           -- Penkey points
    'stamps',           -- Coffee stamps
    'voucher',          -- Free item/discount voucher
    'game_play',        -- Free game play
    'custom'            -- Custom reward
  )),
  
  -- Reward details
  amount INTEGER,                                    -- For points/stamps/game_plays
  reward_id UUID REFERENCES public.rewards(id),     -- For vouchers
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  
  -- Source tracking
  source TEXT NOT NULL CHECK (source IN (
    'referral',
    'game_win',
    'signup_bonus',
    'email_offer',
    'winback_offer',
    'birthday_bonus',
    'milestone_bonus',
    'streak_bonus',
    'manual_award',
    'second_chance',
    'combo_bonus',
    'daily_challenge'
  )),
  source_id UUID,                                    -- Link to source record
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Waiting to be claimed
    'claimed',          -- Successfully claimed
    'expired',          -- Expired without claiming
    'second_chance'     -- Converted to second chance offer
  )),
  
  -- Timestamps
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pending_rewards_user_id ON public.pending_rewards(user_id);
CREATE INDEX idx_pending_rewards_status ON public.pending_rewards(status) WHERE status = 'pending';
CREATE INDEX idx_pending_rewards_expires_at ON public.pending_rewards(expires_at) WHERE status = 'pending';
CREATE INDEX idx_pending_rewards_source ON public.pending_rewards(source);

COMMENT ON TABLE public.pending_rewards IS 'Rewards that are pending until user checks in at store';

-- =============================================
-- 2. ADD COLUMNS TO USERS TABLE
-- =============================================

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS pending_rewards_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS check_in_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS check_in_streak_multiplier DECIMAL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_check_ins INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_pending_rewards ON public.users(pending_rewards_count) 
  WHERE pending_rewards_count > 0;
CREATE INDEX IF NOT EXISTS idx_users_last_check_in ON public.users(last_check_in);

COMMENT ON COLUMN public.users.pending_rewards_count IS 'Count of unclaimed pending rewards';
COMMENT ON COLUMN public.users.check_in_streak IS 'Current consecutive days check-in streak';

-- =============================================
-- 3. FUNCTION: Claim Pending Rewards
-- =============================================

CREATE OR REPLACE FUNCTION public.claim_pending_rewards(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_pending RECORD;
  v_claimed_count INTEGER := 0;
  v_total_points INTEGER := 0;
  v_total_stamps INTEGER := 0;
  v_total_game_plays INTEGER := 0;
  v_vouchers TEXT[] := ARRAY[]::TEXT[];
  v_location_valid BOOLEAN := true;
  v_app_url TEXT;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Validate location if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location_valid := public.validate_location(p_latitude, p_longitude);
    
    IF NOT v_location_valid THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You must be at Penkey to claim rewards'
      );
    END IF;
  END IF;
  
  -- Claim all pending rewards
  FOR v_pending IN
    SELECT * FROM public.pending_rewards
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY earned_at ASC
  LOOP
    -- Award based on type
    CASE v_pending.reward_type
      WHEN 'points' THEN
        -- Add points
        PERFORM public.add_points(
          p_user_id,
          v_pending.amount,
          v_pending.source,
          'Claimed: ' || v_pending.reward_name,
          v_pending.metadata
        );
        v_total_points := v_total_points + v_pending.amount;
        
      WHEN 'stamps' THEN
        -- Add stamps
        FOR i IN 1..v_pending.amount LOOP
          INSERT INTO public.coffee_stamps (user_id, notes)
          VALUES (p_user_id, 'Claimed: ' || v_pending.reward_name);
        END LOOP;
        v_total_stamps := v_total_stamps + v_pending.amount;
        
      WHEN 'voucher' THEN
        -- Activate voucher if it exists
        IF v_pending.reward_id IS NOT NULL THEN
          UPDATE public.user_rewards
          SET status = 'active'
          WHERE id = v_pending.reward_id;
          v_vouchers := array_append(v_vouchers, v_pending.reward_name);
        END IF;
        
      WHEN 'game_play' THEN
        -- Add game play credits (stored in metadata for now)
        v_total_game_plays := v_total_game_plays + v_pending.amount;
        
      ELSE
        -- Custom rewards handled separately
        NULL;
    END CASE;
    
    -- Mark as claimed
    UPDATE public.pending_rewards
    SET status = 'claimed',
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pending.id;
    
    v_claimed_count := v_claimed_count + 1;
  END LOOP;
  
  -- Update user's pending count
  UPDATE public.users
  SET pending_rewards_count = (
    SELECT COUNT(*) FROM public.pending_rewards
    WHERE user_id = p_user_id AND status = 'pending'
  ),
  updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Send notification if rewards were claimed
  IF v_claimed_count > 0 THEN
    -- Queue celebration email
    PERFORM public.queue_email_from_template(
      'rewards_claimed',
      (SELECT email FROM public.users WHERE id = p_user_id),
      p_user_id,
      jsonb_build_object(
        'name', (SELECT name FROM public.users WHERE id = p_user_id),
        'claimedCount', v_claimed_count,
        'totalPoints', v_total_points,
        'totalStamps', v_total_stamps,
        'totalGamePlays', v_total_game_plays,
        'vouchers', v_vouchers,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'claimed_count', v_claimed_count,
    'total_points', v_total_points,
    'total_stamps', v_total_stamps,
    'total_game_plays', v_total_game_plays,
    'vouchers', v_vouchers,
    'message', CASE 
      WHEN v_claimed_count = 0 THEN 'No pending rewards to claim'
      WHEN v_claimed_count = 1 THEN 'You claimed 1 reward!'
      ELSE 'You claimed ' || v_claimed_count || ' rewards!'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.claim_pending_rewards IS 'Claims all pending rewards for a user (called on check-in)';

-- =============================================
-- 4. FUNCTION: Expire Pending Rewards & Create Second Chance
-- =============================================

CREATE OR REPLACE FUNCTION public.expire_pending_rewards()
RETURNS TABLE(expired_count INTEGER, second_chance_count INTEGER) AS $$
DECLARE
  v_expired RECORD;
  v_user RECORD;
  v_expired_count INTEGER := 0;
  v_second_chance_count INTEGER := 0;
  v_app_url TEXT;
  v_second_chance_amount INTEGER;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find expired rewards
  FOR v_expired IN
    SELECT pr.*, u.email, u.name
    FROM public.pending_rewards pr
    JOIN public.users u ON pr.user_id = u.id
    WHERE pr.status = 'pending'
      AND pr.expires_at <= NOW()
  LOOP
    -- Mark as expired
    UPDATE public.pending_rewards
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = v_expired.id;
    
    v_expired_count := v_expired_count + 1;
    
    -- Calculate second chance amount (50% of original for points/stamps)
    v_second_chance_amount := CASE 
      WHEN v_expired.reward_type IN ('points', 'stamps') 
      THEN GREATEST(1, v_expired.amount / 2)
      ELSE v_expired.amount
    END;
    
    -- Create second chance offer
    INSERT INTO public.pending_rewards (
      user_id,
      reward_type,
      amount,
      reward_id,
      reward_name,
      reward_description,
      source,
      source_id,
      expires_at,
      metadata
    ) VALUES (
      v_expired.user_id,
      v_expired.reward_type,
      v_second_chance_amount,
      v_expired.reward_id,
      'Second Chance: ' || v_expired.reward_name,
      'We''re giving you another chance to claim this reward!',
      'second_chance',
      v_expired.id,
      NOW() + INTERVAL '3 days',
      jsonb_build_object(
        'original_amount', v_expired.amount,
        'original_id', v_expired.id,
        'bonus_stamps', 5,
        'is_second_chance', true
      )
    );
    
    v_second_chance_count := v_second_chance_count + 1;
    
    -- Update user's pending count
    UPDATE public.users
    SET pending_rewards_count = (
      SELECT COUNT(*) FROM public.pending_rewards
      WHERE user_id = v_expired.user_id AND status = 'pending'
    )
    WHERE id = v_expired.user_id;
    
    -- Send second chance email
    IF public.can_send_email(v_expired.user_id, 'reengagement') THEN
      PERFORM public.queue_email_from_template(
        'second_chance_offer',
        v_expired.email,
        v_expired.user_id,
        jsonb_build_object(
          'name', v_expired.name,
          'expiredReward', v_expired.reward_name,
          'expiredAmount', v_expired.amount,
          'secondChanceAmount', v_second_chance_amount,
          'bonusStamps', 5,
          'expiresIn', '3 days',
          'appUrl', v_app_url
        )
      );
    END IF;
  END LOOP;
  
  expired_count := v_expired_count;
  second_chance_count := v_second_chance_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.expire_pending_rewards IS 'Expires pending rewards and creates second chance offers';

-- =============================================
-- 5. FUNCTION: Send Pending Rewards Reminders
-- =============================================

CREATE OR REPLACE FUNCTION public.send_pending_rewards_reminders()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_pending_rewards JSONB;
  v_count INTEGER := 0;
  v_days_left INTEGER;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Find users with pending rewards
  FOR v_user IN
    SELECT DISTINCT u.id, u.email, u.name, u.pending_rewards_count
    FROM public.users u
    WHERE u.pending_rewards_count > 0
      -- Don't send if we sent a reminder in last 3 days
      AND NOT EXISTS (
        SELECT 1 FROM public.email_logs el
        WHERE el.recipient_user_id = u.id
          AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'pending_rewards_reminder')
          AND el.sent_at > NOW() - INTERVAL '3 days'
      )
  LOOP
    -- Get pending rewards details
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', reward_name,
        'type', reward_type,
        'amount', amount,
        'expires_at', expires_at,
        'days_left', EXTRACT(DAY FROM (expires_at - NOW()))
      )
    ) INTO v_pending_rewards
    FROM public.pending_rewards
    WHERE user_id = v_user.id
      AND status = 'pending'
      AND expires_at > NOW();
    
    -- Get minimum days left
    SELECT MIN(EXTRACT(DAY FROM (expires_at - NOW())))::INTEGER INTO v_days_left
    FROM public.pending_rewards
    WHERE user_id = v_user.id
      AND status = 'pending'
      AND expires_at > NOW();
    
    -- Check user preferences
    IF public.can_send_email(v_user.id, 'reminder') THEN
      -- Queue reminder email
      PERFORM public.queue_email_from_template(
        'pending_rewards_reminder',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'pendingCount', v_user.pending_rewards_count,
          'pendingRewards', v_pending_rewards,
          'daysLeft', v_days_left,
          'urgency', CASE 
            WHEN v_days_left <= 1 THEN 'urgent'
            WHEN v_days_left <= 3 THEN 'high'
            ELSE 'normal'
          END,
          'appUrl', v_app_url
        )
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.send_pending_rewards_reminders IS 'Sends reminder emails for pending rewards (run every 3 days)';

-- =============================================
-- 6. FUNCTION: Update Check-In Streak
-- =============================================

CREATE OR REPLACE FUNCTION public.update_check_in_streak(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_check_in TIMESTAMP;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_longest_streak INTEGER;
  v_hours_since_last INTEGER;
BEGIN
  -- Get user's last check-in and current streak
  SELECT last_check_in, check_in_streak, longest_streak
  INTO v_last_check_in, v_current_streak, v_longest_streak
  FROM public.users
  WHERE id = p_user_id;
  
  -- Calculate hours since last check-in
  IF v_last_check_in IS NOT NULL THEN
    v_hours_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_check_in)) / 3600;
  ELSE
    v_hours_since_last := 999; -- First check-in
  END IF;
  
  -- Update streak
  IF v_hours_since_last <= 48 THEN
    -- Within 48 hours = continue streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Broke streak, start over
    v_new_streak := 1;
  END IF;
  
  -- Update longest streak if needed
  IF v_new_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_new_streak;
  END IF;
  
  -- Update user
  UPDATE public.users
  SET last_check_in = NOW(),
      check_in_streak = v_new_streak,
      longest_streak = v_longest_streak,
      total_check_ins = COALESCE(total_check_ins, 0) + 1,
      check_in_streak_multiplier = CASE
        WHEN v_new_streak >= 7 THEN 2.0
        WHEN v_new_streak >= 5 THEN 1.5
        WHEN v_new_streak >= 3 THEN 1.25
        ELSE 1.0
      END,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'multiplier', CASE
      WHEN v_new_streak >= 7 THEN 2.0
      WHEN v_new_streak >= 5 THEN 1.5
      WHEN v_new_streak >= 3 THEN 1.25
      ELSE 1.0
    END,
    'streak_broken', v_hours_since_last > 48
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_check_in_streak IS 'Updates user check-in streak and multiplier';

-- =============================================
-- 7. RLS POLICIES
-- =============================================

ALTER TABLE public.pending_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending rewards
CREATE POLICY "Users can view own pending rewards"
  ON public.pending_rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to pending_rewards"
  ON public.pending_rewards FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.pending_rewards TO service_role;
GRANT SELECT ON public.pending_rewards TO authenticated;

GRANT EXECUTE ON FUNCTION public.claim_pending_rewards TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_pending_rewards TO service_role;
GRANT EXECUTE ON FUNCTION public.send_pending_rewards_reminders TO service_role;
GRANT EXECUTE ON FUNCTION public.update_check_in_streak TO service_role;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Pending rewards system created!' as message;
SELECT 'Rewards now pending until check-in' as feature1;
SELECT 'Second chance system for expired rewards' as feature2;
SELECT 'Streak tracking with multipliers' as feature3;
