-- =============================================
-- RESTRICT PROMOTIONAL OFFERS FOR NEW CUSTOMERS
-- Date: 2025-10-15
-- =============================================
-- Issue: New customers can redeem promotional offers immediately
-- Solution: Add check to prevent redemption within first 24 hours
-- =============================================

-- Update the redeem_promotional_offer function to check account age
-- Drop existing function first
DROP FUNCTION IF EXISTS public.redeem_promotional_offer(UUID, UUID);

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
  v_user_created_at TIMESTAMP WITH TIME ZONE;
  v_voucher_id UUID;
  v_voucher_code TEXT;
  v_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is a new customer (created within last 24 hours)
  SELECT created_at INTO v_user_created_at
  FROM public.users
  WHERE id = p_user_id;
  
  IF v_user_created_at > NOW() - INTERVAL '24 hours' THEN
    RETURN QUERY SELECT 
      false, 
      'Promotional offers are only available to existing customers. Please check back tomorrow!'::TEXT, 
      NULL::UUID, 
      NULL::TEXT;
    RETURN;
  END IF;

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
          cost,
          active
        )
        VALUES (
          v_offer.title,
          v_offer.description,
          'voucher',
          0,
          true
        )
        RETURNING id INTO v_reward_id;
      END IF;

      -- Create user reward (voucher)
      INSERT INTO public.user_rewards (
        user_id,
        reward_id,
        reward_name,
        status,
        qr_code,
        expires_at
      )
      VALUES (
        p_user_id,
        v_reward_id,
        v_offer.title,
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

COMMENT ON FUNCTION public.redeem_promotional_offer IS 'Redeems a promotional offer - restricted to customers older than 24 hours';

-- =============================================
-- ALSO UPDATE get_user_promotional_offers TO HIDE FROM NEW CUSTOMERS
-- =============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_user_promotional_offers(UUID);

CREATE OR REPLACE FUNCTION public.get_user_promotional_offers(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  reward_type TEXT,
  reward_value INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  redemption_limit INTEGER,
  redemptions_count INTEGER,
  priority INTEGER,
  auto_create_voucher BOOLEAN,
  voucher_expiry_hours INTEGER,
  viewed BOOLEAN,
  redeemed BOOLEAN,
  redemptions_remaining INTEGER
) AS $$
DECLARE
  v_user_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is new (created within last 24 hours)
  SELECT created_at INTO v_user_created_at
  FROM public.users
  WHERE id = p_user_id;
  
  -- If new customer, return empty result
  IF v_user_created_at > NOW() - INTERVAL '24 hours' THEN
    RETURN;
  END IF;

  -- Return active offers for existing customers
  RETURN QUERY
  SELECT 
    po.id,
    po.title,
    po.description,
    po.image_url,
    po.reward_type,
    po.reward_value,
    po.start_date,
    po.end_date,
    po.redemption_limit,
    po.redemptions_count,
    po.priority,
    po.auto_create_voucher,
    po.voucher_expiry_hours,
    (upo.viewed_at IS NOT NULL) as viewed,
    (upo.redeemed_at IS NOT NULL) as redeemed,
    CASE 
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
    -- Check user hasn't already redeemed
    AND (upo.redeemed_at IS NULL OR upo.redeemed_at IS NOT NULL) -- Include all for tracking
  ORDER BY po.priority DESC, po.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_promotional_offers IS 'Gets active promotional offers - hidden for customers newer than 24 hours';

-- =============================================
-- VERIFICATION
-- =============================================

SELECT '✅ Promotional offers now restricted for new customers!' as message;
SELECT '⏰ New customers must wait 24 hours before seeing/redeeming offers' as rule;
SELECT '🎁 Signup bonus (250 beans + free coffee) still applies to everyone' as note;
