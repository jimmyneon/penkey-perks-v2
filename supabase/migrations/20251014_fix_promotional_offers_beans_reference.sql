-- =============================================
-- FIX PROMOTIONAL OFFERS - Beans Reference
-- =============================================
-- The get_user_promotional_offers function references a non-existent 'beans' table
-- This fix updates it to use the correct points_transactions table

-- Drop and recreate the function with correct beans calculation
DROP FUNCTION IF EXISTS public.get_user_promotional_offers(UUID);

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
  -- Get user stats (using points_transactions instead of beans table)
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

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_promotional_offers TO authenticated;

-- Success message
SELECT 'Promotional offers beans reference fixed!' as message;
