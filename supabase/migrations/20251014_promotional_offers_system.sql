-- =============================================
-- PROMOTIONAL OFFERS SYSTEM
-- Allows staff/admin to create offers that show as modal popups
-- Users can redeem offers to get vouchers
-- =============================================

-- 1. PROMOTIONAL OFFERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotional_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Offer details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  terms TEXT, -- Terms and conditions
  
  -- Reward details
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_item', 'discount', 'bonus_beans', 'custom')),
  reward_value TEXT NOT NULL, -- e.g., "Free Coffee", "20% off", "50 beans"
  reward_description TEXT,
  
  -- Visual
  icon TEXT DEFAULT '🎁',
  image_url TEXT,
  button_text TEXT DEFAULT 'Redeem Now',
  
  -- Redemption settings
  redemption_limit INTEGER, -- Max redemptions per user (NULL = unlimited)
  total_redemption_limit INTEGER, -- Total redemptions across all users
  redemptions_count INTEGER DEFAULT 0, -- Track total redemptions
  
  -- Voucher settings
  voucher_expiry_hours INTEGER DEFAULT 48, -- How long voucher is valid after redemption
  auto_create_voucher BOOLEAN DEFAULT true, -- Auto-create voucher on redemption
  
  -- Scheduling
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Targeting
  target_audience TEXT DEFAULT 'all', -- 'all', 'new', 'returning', 'vip', 'custom'
  min_beans INTEGER,
  max_beans INTEGER,
  
  -- Display settings
  priority INTEGER DEFAULT 10, -- Lower = higher priority
  show_as_modal BOOLEAN DEFAULT true, -- Show as modal popup
  show_as_notification BOOLEAN DEFAULT true, -- Also show as notification banner
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

-- Indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_promotional_offers_active ON public.promotional_offers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_promotional_offers_dates ON public.promotional_offers(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotional_offers_priority ON public.promotional_offers(priority);

-- Enable RLS
ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exists first)
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

-- 2. USER PROMOTIONAL OFFER INTERACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_promotional_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
  
  -- Interaction tracking
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  voucher_id UUID REFERENCES public.user_rewards(id), -- Link to created voucher
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, offer_id)
);

-- Indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_promo_offers_user ON public.user_promotional_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promo_offers_offer ON public.user_promotional_offers(offer_id);
CREATE INDEX IF NOT EXISTS idx_user_promo_offers_redeemed ON public.user_promotional_offers(redeemed_at) WHERE redeemed_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_promotional_offers ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exists first)
DROP POLICY IF EXISTS "Users manage own promotional offer interactions" ON public.user_promotional_offers;
CREATE POLICY "Users manage own promotional offer interactions"
  ON public.user_promotional_offers
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all promotional offer interactions" ON public.user_promotional_offers;
CREATE POLICY "Staff can view all promotional offer interactions"
  ON public.user_promotional_offers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'staff'
    )
  );

-- 3. PROMOTIONAL OFFER REWARDS (Link to rewards catalog)
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotional_offer_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL, -- Optional link to existing reward
  
  -- Custom reward details (if not using existing reward)
  custom_name TEXT,
  custom_description TEXT,
  custom_type TEXT CHECK (custom_type IN ('free_item', 'discount', 'bonus_beans')),
  custom_value TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Either reward_id or custom fields must be set
  CONSTRAINT has_reward_or_custom CHECK (
    reward_id IS NOT NULL OR 
    (custom_name IS NOT NULL AND custom_type IS NOT NULL AND custom_value IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.promotional_offer_rewards ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exists first)
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

-- 4. FUNCTION: Get active promotional offers for user
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_promotional_offers(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  terms TEXT,
  reward_type TEXT,
  reward_value TEXT,
  reward_description TEXT,
  icon TEXT,
  image_url TEXT,
  button_text TEXT,
  priority INTEGER,
  show_as_modal BOOLEAN,
  show_as_notification BOOLEAN,
  has_redeemed BOOLEAN,
  redemptions_remaining INTEGER
) AS $$
DECLARE
  v_user_beans INTEGER;
  v_user_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user stats (using points_transactions for beans count)
  SELECT 
    COALESCE(SUM(pt.amount), 0),
    u.created_at
  INTO v_user_beans, v_user_created_at
  FROM public.users u
  LEFT JOIN public.points_transactions pt ON pt.user_id = u.id
  WHERE u.id = p_user_id
  GROUP BY u.created_at;

  RETURN QUERY
  SELECT 
    po.id,
    po.title,
    po.description,
    po.terms,
    po.reward_type,
    po.reward_value,
    po.reward_description,
    po.icon,
    po.image_url,
    po.button_text,
    po.priority,
    po.show_as_modal,
    po.show_as_notification,
    (upo.redeemed_at IS NOT NULL) as has_redeemed,
    CASE 
      WHEN po.redemption_limit IS NULL THEN NULL
      WHEN upo.id IS NULL THEN po.redemption_limit
      WHEN upo.redeemed_at IS NULL THEN po.redemption_limit
      ELSE 0
    END as redemptions_remaining
  FROM public.promotional_offers po
  LEFT JOIN public.user_promotional_offers upo ON upo.offer_id = po.id AND upo.user_id = p_user_id
  WHERE po.active = true
    -- Check date range
    AND (po.start_date IS NULL OR po.start_date <= NOW())
    AND (po.end_date IS NULL OR po.end_date >= NOW())
    -- Check total redemption limit
    AND (po.total_redemption_limit IS NULL OR po.redemptions_count < po.total_redemption_limit)
    -- Check user redemption limit
    AND (
      po.redemption_limit IS NULL 
      OR upo.redeemed_at IS NULL 
      OR upo.id IS NULL
    )
    -- Check targeting
    AND (
      po.target_audience = 'all'
      OR (po.target_audience = 'new' AND v_user_created_at > NOW() - INTERVAL '7 days')
      OR (po.target_audience = 'returning' AND v_user_created_at <= NOW() - INTERVAL '7 days')
      OR (po.target_audience = 'vip' AND v_user_beans >= 100)
    )
    -- Check beans range
    AND (po.min_beans IS NULL OR v_user_beans >= po.min_beans)
    AND (po.max_beans IS NULL OR v_user_beans <= po.max_beans)
  ORDER BY po.priority ASC, po.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION: Redeem promotional offer
-- =============================================
CREATE OR REPLACE FUNCTION public.redeem_promotional_offer(
  p_user_id UUID,
  p_offer_id UUID
)
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
BEGIN
  -- Get offer details
  SELECT * INTO v_offer
  FROM public.promotional_offers
  WHERE id = p_offer_id AND active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Offer not found or inactive'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Check date range
  IF (v_offer.start_date IS NOT NULL AND v_offer.start_date > NOW()) OR
     (v_offer.end_date IS NOT NULL AND v_offer.end_date < NOW()) THEN
    RETURN QUERY SELECT false, 'Offer is not currently active'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Check total redemption limit
  IF v_offer.total_redemption_limit IS NOT NULL AND 
     v_offer.redemptions_count >= v_offer.total_redemption_limit THEN
    RETURN QUERY SELECT false, 'Offer redemption limit reached'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Check user interaction
  SELECT * INTO v_user_interaction
  FROM public.user_promotional_offers
  WHERE user_id = p_user_id AND offer_id = p_offer_id;

  -- Check user redemption limit
  IF v_user_interaction.redeemed_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'You have already redeemed this offer'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Create or update user interaction
  IF v_user_interaction.id IS NULL THEN
    INSERT INTO public.user_promotional_offers (user_id, offer_id, viewed_at, redeemed_at)
    VALUES (p_user_id, p_offer_id, NOW(), NOW());
  ELSE
    UPDATE public.user_promotional_offers
    SET redeemed_at = NOW()
    WHERE id = v_user_interaction.id;
  END IF;

  -- Increment redemption count
  UPDATE public.promotional_offers
  SET redemptions_count = redemptions_count + 1
  WHERE id = p_offer_id;

  -- Create voucher if auto_create_voucher is true
  IF v_offer.auto_create_voucher THEN
    -- Calculate expiry
    v_expiry_date := NOW() + (v_offer.voucher_expiry_hours || ' hours')::INTERVAL;
    
    -- Generate QR code (simple UUID-based code)
    v_voucher_code := 'PROMO-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
    
    -- Check if we have a linked reward
    DECLARE
      v_reward_id UUID;
    BEGIN
      SELECT reward_id INTO v_reward_id
      FROM public.promotional_offer_rewards
      WHERE offer_id = p_offer_id
      LIMIT 1;

      -- If no linked reward, create a custom one (simplified - only required fields)
      IF v_reward_id IS NULL THEN
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
          CASE 
            WHEN v_offer.reward_type = 'bonus_beans' THEN 'bonus_ducks'
            ELSE v_offer.reward_type
          END,
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
      WHERE user_id = p_user_id AND offer_id = p_offer_id;

    END;
  END IF;

  -- Return success
  RETURN QUERY SELECT 
    true, 
    'Offer redeemed successfully!'::TEXT, 
    v_voucher_id, 
    v_voucher_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION: Mark offer as viewed
-- =============================================
CREATE OR REPLACE FUNCTION public.mark_promotional_offer_viewed(
  p_user_id UUID,
  p_offer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_promotional_offers (user_id, offer_id, viewed_at)
  VALUES (p_user_id, p_offer_id, NOW())
  ON CONFLICT (user_id, offer_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.promotional_offers TO authenticated;
GRANT ALL ON public.promotional_offers TO service_role;
GRANT ALL ON public.user_promotional_offers TO authenticated;
GRANT ALL ON public.promotional_offer_rewards TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_promotional_offers TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promotional_offer TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_promotional_offer_viewed TO authenticated;

-- Comments
COMMENT ON TABLE public.promotional_offers IS 'Promotional offers that show as modal popups';
COMMENT ON TABLE public.user_promotional_offers IS 'Track user interactions with promotional offers';
COMMENT ON TABLE public.promotional_offer_rewards IS 'Link promotional offers to rewards';
COMMENT ON FUNCTION public.get_user_promotional_offers IS 'Get active promotional offers for a user';
COMMENT ON FUNCTION public.redeem_promotional_offer IS 'Redeem a promotional offer and create voucher';
COMMENT ON FUNCTION public.mark_promotional_offer_viewed IS 'Mark promotional offer as viewed';

-- Success message
SELECT 'Promotional offers system created successfully!' as message;
