-- Fix award_beans function to handle users without bean_balances record
-- This ensures new users can receive beans even if they haven't been initialized yet

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
  -- Get current balance, default to 0 if not found
  SELECT COALESCE(current_beans, 0) INTO v_current_beans
  FROM public.bean_balances
  WHERE user_id = p_user_id;

  -- Check if user is at cap (25 beans)
  IF v_current_beans >= 25 THEN
    RAISE EXCEPTION 'User has reached maximum bean cap of 25. Convert beans to vouchers first.';
  END IF;

  -- Calculate new balance (respect cap)
  v_current_beans := LEAST(v_current_beans + p_amount, 25);

  -- Update bean balance
  INSERT INTO public.bean_balances (user_id, current_beans, lifetime_beans, visit_count, last_visit_at, updated_at)
  VALUES (p_user_id, v_current_beans, COALESCE((SELECT lifetime_beans FROM public.bean_balances WHERE user_id = p_user_id), 0) + p_amount, 1, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_beans = LEAST(bean_balances.current_beans + p_amount, 25),
    lifetime_beans = bean_balances.lifetime_beans + p_amount,
    visit_count = bean_balances.visit_count + 1,
    last_visit_at = NOW(),
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
