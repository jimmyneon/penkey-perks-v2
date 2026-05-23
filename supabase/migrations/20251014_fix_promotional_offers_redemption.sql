-- =============================================
-- FIX PROMOTIONAL OFFERS REDEMPTION
-- =============================================
-- Fix the redeem function to work with actual rewards table structure
-- Instead of creating rewards, just create user_rewards directly

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
  v_voucher_id UUID;
  v_voucher_code TEXT;
  v_expiry_date TIMESTAMP WITH TIME ZONE;
  v_reward_id UUID;
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
    SELECT reward_id INTO v_reward_id
    FROM public.promotional_offer_rewards
    WHERE offer_id = p_offer_id
    LIMIT 1;

    -- If we have a linked reward, use it. Otherwise, we'll create a user_reward without a reward_id
    -- This allows the voucher to exist independently
    IF v_reward_id IS NOT NULL THEN
      -- Create user reward with existing reward
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
    ELSE
      -- Create standalone voucher (user_reward without reward_id if allowed)
      -- Check if user_rewards allows NULL reward_id
      BEGIN
        INSERT INTO public.user_rewards (
          user_id,
          reward_id,
          status,
          qr_code,
          expires_at
        )
        VALUES (
          p_user_id,
          NULL, -- Try NULL first
          'active',
          v_voucher_code,
          v_expiry_date
        )
        RETURNING id INTO v_voucher_id;
      EXCEPTION WHEN OTHERS THEN
        -- If NULL not allowed, we need to create a reward first
        -- Use a simpler INSERT that matches actual table structure
        INSERT INTO public.rewards (name, description, type, value, active)
        VALUES (
          v_offer.title,
          v_offer.description,
          CASE 
            WHEN v_offer.reward_type = 'bonus_beans' THEN 'bonus_ducks'::TEXT
            ELSE v_offer.reward_type::TEXT
          END,
          v_offer.reward_value,
          true
        )
        RETURNING id INTO v_reward_id;
        
        -- Now create user reward
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
      END;
    END IF;

    -- Update user interaction with voucher
    UPDATE public.user_promotional_offers
    SET voucher_id = v_voucher_id
    WHERE user_id = p_user_id AND offer_id = p_offer_id;
  END IF;

  -- Return success
  RETURN QUERY SELECT 
    true, 
    'Offer redeemed successfully!'::TEXT, 
    v_voucher_id, 
    v_voucher_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.redeem_promotional_offer TO authenticated;

-- Success message
SELECT 'Promotional offers redemption function fixed!' as message;
