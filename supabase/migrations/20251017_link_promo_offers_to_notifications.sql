-- =============================================
-- Link Promotional Offers to Temporary Notifications
-- =============================================
-- When a promo offer is created with show_as_notification=true,
-- automatically create a temporary notification for it

-- Add notification_id column to promotional_offers
ALTER TABLE public.promotional_offers 
ADD COLUMN IF NOT EXISTS notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_promotional_offers_notification 
ON public.promotional_offers(notification_id);

-- Function to create notification from promotional offer
CREATE OR REPLACE FUNCTION create_notification_from_promo_offer(
  p_offer_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_offer RECORD;
  v_notification_id UUID;
  v_conditions JSONB;
  v_expiry_hours INTEGER;
BEGIN
  -- Get the promotional offer details
  SELECT * INTO v_offer
  FROM public.promotional_offers
  WHERE id = p_offer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promotional offer not found: %', p_offer_id;
  END IF;
  
  -- Don't create notification if show_as_notification is false
  IF NOT v_offer.show_as_notification THEN
    RETURN NULL;
  END IF;
  
  -- Build conditions based on targeting
  v_conditions := '{}'::jsonb;
  
  IF v_offer.min_beans IS NOT NULL THEN
    v_conditions := v_conditions || jsonb_build_object('minBeans', v_offer.min_beans);
  END IF;
  
  IF v_offer.max_beans IS NOT NULL THEN
    v_conditions := v_conditions || jsonb_build_object('maxBeans', v_offer.max_beans);
  END IF;
  
  -- Calculate expiry hours for temporary notification
  -- Use the time until end_date, or default to 24 hours
  IF v_offer.end_date IS NOT NULL THEN
    v_expiry_hours := GREATEST(
      1, -- Minimum 1 hour
      EXTRACT(EPOCH FROM (v_offer.end_date - NOW())) / 3600
    )::INTEGER;
  ELSE
    v_expiry_hours := 24; -- Default 24 hours
  END IF;
  
  -- Create the notification
  INSERT INTO public.notifications (
    type,
    priority,
    title,
    message,
    icon,
    conditions,
    variant,
    dismissible,
    active,
    start_date,
    end_date,
    is_temporary,
    auto_expire_hours
  ) VALUES (
    'custom',
    v_offer.priority,
    v_offer.title,
    v_offer.description,
    v_offer.icon,
    v_conditions,
    'reward', -- Promo offers are always reward variant
    true, -- Always dismissible
    v_offer.active,
    v_offer.start_date,
    v_offer.end_date,
    true, -- Always temporary
    v_expiry_hours
  )
  RETURNING id INTO v_notification_id;
  
  -- Link notification to promotional offer
  UPDATE public.promotional_offers
  SET notification_id = v_notification_id,
      updated_at = NOW()
  WHERE id = p_offer_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync promotional offer changes to notification
CREATE OR REPLACE FUNCTION sync_promo_offer_to_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- If notification exists, update it
  IF NEW.notification_id IS NOT NULL THEN
    UPDATE public.notifications
    SET 
      title = NEW.title,
      message = NEW.description,
      icon = NEW.icon,
      priority = NEW.priority,
      active = NEW.active,
      start_date = NEW.start_date,
      end_date = NEW.end_date,
      updated_at = NOW()
    WHERE id = NEW.notification_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync changes
DROP TRIGGER IF EXISTS sync_promo_offer_notification ON public.promotional_offers;
CREATE TRIGGER sync_promo_offer_notification
  AFTER UPDATE ON public.promotional_offers
  FOR EACH ROW
  WHEN (OLD.notification_id IS NOT NULL)
  EXECUTE FUNCTION sync_promo_offer_to_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notification_from_promo_offer TO authenticated;

-- Add comments
COMMENT ON COLUMN public.promotional_offers.notification_id IS 'Linked temporary notification for this promotional offer';
COMMENT ON FUNCTION create_notification_from_promo_offer IS 'Creates a temporary notification from a promotional offer';
COMMENT ON FUNCTION sync_promo_offer_to_notification IS 'Syncs promotional offer changes to its linked notification';

-- Success message
SELECT 'Promotional offers linked to notifications successfully!' as message;
