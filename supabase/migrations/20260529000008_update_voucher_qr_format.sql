-- Update voucher QR code format to include customer_id
-- New format: VOUCHER-{voucher_id}-{customer_id}-{timestamp}
-- This allows scanning a voucher to get both voucher and customer info

-- Update the convert_beans_to_voucher function to use new QR format
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
  SELECT * INTO v_template FROM public.voucher_templates WHERE id = p_voucher_template_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voucher template not found');
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

  -- Generate unique QR code with new format: VOUCHER-{voucher_id}-{customer_id}-{timestamp}
  v_qr_code := 'VOUCHER-' || encode(gen_random_bytes(8), 'hex') || '-' || p_user_id || '-' || EXTRACT(EPOCH FROM NOW());

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

-- Update existing voucher QR codes to new format
UPDATE public.user_vouchers 
SET qr_code = 'VOUCHER-' || encode(gen_random_bytes(8), 'hex') || '-' || user_id || '-' || EXTRACT(EPOCH FROM created_at)
WHERE qr_code NOT LIKE 'VOUCHER-%';

-- Add comment
COMMENT ON COLUMN public.user_vouchers.qr_code IS 'Unique QR code for voucher (format: VOUCHER-{random}-{customer_id}-{timestamp})';
