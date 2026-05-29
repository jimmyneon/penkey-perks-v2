-- Manual voucher conversion system
-- Users can now manually convert beans to vouchers instead of automatic issuance
-- Bean cap of 25, vouchers expire in 14 days

-- Add bean cap constraint to bean_balances
ALTER TABLE public.bean_balances 
DROP CONSTRAINT IF EXISTS bean_balances_current_beans_check;

ALTER TABLE public.bean_balances 
ADD CONSTRAINT bean_balances_current_beans_check 
CHECK (current_beans >= 0 AND current_beans <= 25);

-- Update award_beans function to respect cap and remove auto voucher issuance
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
  v_current_beans INTEGER;
BEGIN
  -- Get current balance
  SELECT current_beans INTO v_current_beans
  FROM public.bean_balances
  WHERE user_id = p_user_id;

  -- Check if user is at cap (25 beans)
  IF v_current_beans >= 25 THEN
    RAISE EXCEPTION 'User has reached maximum bean cap of 25. Convert beans to vouchers first.';
  END IF;

  -- Calculate new balance (respect cap)
  v_current_beans := LEAST(v_current_beans + p_amount, 25);

  -- Update bean balance
  INSERT INTO public.bean_balances (user_id, current_beans, lifetime_beans, updated_at)
  VALUES (p_user_id, v_current_beans, COALESCE((SELECT lifetime_beans FROM public.bean_balances WHERE user_id = p_user_id), 0) + p_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_beans = LEAST(bean_balances.current_beans + p_amount, 25),
    lifetime_beans = bean_balances.lifetime_beans + p_amount,
    updated_at = NOW();

  -- Record transaction
  INSERT INTO public.bean_transactions (user_id, amount, source, source_id, description, metadata)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Check for badge unlocks (but NOT automatic voucher issuance)
  PERFORM check_badge_unlocks(p_user_id);

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create manual bean-to-voucher conversion function
CREATE OR REPLACE FUNCTION convert_beans_to_voucher(
  p_user_id UUID,
  p_voucher_template_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_balance RECORD;
  v_template RECORD;
  v_voucher_id UUID;
  v_qr_code TEXT;
BEGIN
  -- Get current balance
  SELECT * INTO v_balance FROM public.bean_balances WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bean balance not found');
  END IF;

  -- Get voucher template
  SELECT * INTO v_template FROM public.voucher_templates WHERE id = p_voucher_template_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voucher template not found or inactive');
  END IF;

  -- Check if user has enough beans
  IF v_balance.current_beans < v_template.bean_threshold THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough beans', 'required', v_template.bean_threshold, 'available', v_balance.current_beans);
  END IF;

  -- Check if user already has an active voucher of this type
  IF EXISTS (
    SELECT 1 FROM public.user_vouchers
    WHERE user_id = p_user_id
    AND voucher_template_id = p_voucher_template_id
    AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have an active voucher of this type');
  END IF;

  -- Deduct beans from balance
  UPDATE public.bean_balances
  SET current_beans = current_beans - v_template.bean_threshold,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Generate unique QR code
  v_qr_code := 'VOUCHER-' || encode(gen_random_bytes(16), 'hex');

  -- Create voucher
  INSERT INTO public.user_vouchers (
    user_id,
    voucher_template_id,
    qr_code,
    expires_at,
    metadata
  )
  VALUES (
    p_user_id,
    p_voucher_template_id,
    v_qr_code,
    NOW() + (v_template.expiry_days || ' days')::INTERVAL,
    jsonb_build_object('converted_from_beans', true, 'beans_used', v_template.bean_threshold)
  )
  RETURNING id INTO v_voucher_id;

  -- Record transaction
  INSERT INTO public.bean_transactions (user_id, amount, source, source_id, description, metadata)
  VALUES (p_user_id, -v_template.bean_threshold, 'voucher_conversion', v_voucher_id, 'Converted to voucher: ' || v_template.name, jsonb_build_object('voucher_id', v_voucher_id));

  RETURN jsonb_build_object('success', true, 'voucher_id', v_voucher_id, 'qr_code', v_qr_code, 'beans_remaining', v_balance.current_beans - v_template.bean_threshold);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update voucher templates with new thresholds and expiry
UPDATE public.voucher_templates 
SET 
  bean_threshold = CASE 
    WHEN name = 'Enhancer Voucher' THEN 2
    WHEN name = 'Free Coffee' THEN 8
    WHEN name = 'Golden Duck Reward' THEN 15
    WHEN name = 'Wheel Spin' THEN 2
    ELSE bean_threshold
  END,
  expiry_days = 14
WHERE name IN ('Enhancer Voucher', 'Free Coffee', 'Golden Duck Reward', 'Wheel Spin');

-- Add new voucher templates
INSERT INTO public.voucher_templates (name, description, category, bean_threshold, expiry_days) VALUES
('Sausage Roll', 'Hot sausage roll', 'food', 15, 14),
('£5 Voucher', '£5 off any purchase', 'major', 25, 14)
ON CONFLICT DO NOTHING;

-- Grant execute permission on new function
GRANT EXECUTE ON FUNCTION public.convert_beans_to_voucher(UUID, UUID) TO authenticated;
