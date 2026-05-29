-- =============================================
-- PUSH NOTIFICATIONS INFRASTRUCTURE
-- =============================================
-- Creates tables and functions for Web Push notifications
-- =============================================

-- =============================================
-- 1. PUSH SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Push subscription details (from browser)
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,  -- Public key
  auth TEXT NOT NULL,    -- Auth secret
  
  -- Device info
  user_agent TEXT,
  device_name TEXT,
  
  -- Status
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate subscriptions per user/endpoint
  UNIQUE(user_id, endpoint)
);

-- Indexes for performance
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON public.push_subscriptions(active) WHERE active = true;
CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push notification subscriptions for users';

-- =============================================
-- 2. PUSH NOTIFICATIONS LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.push_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  subscription_id UUID REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  
  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'clicked'
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_log_user ON public.push_notifications_log(user_id);
CREATE INDEX idx_push_log_subscription ON public.push_notifications_log(subscription_id);
CREATE INDEX idx_push_log_status ON public.push_notifications_log(status);
CREATE INDEX idx_push_log_created ON public.push_notifications_log(created_at);

-- Constraints
ALTER TABLE public.push_notifications_log 
  ADD CONSTRAINT check_push_status 
  CHECK (status IN ('pending', 'sent', 'failed', 'clicked'));

COMMENT ON TABLE public.push_notifications_log IS 'Log of all push notifications sent';

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (user_id = auth.uid());

-- Users can view their own push notification log
CREATE POLICY "Users view own push log"
  ON public.push_notifications_log
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins view all push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE staff_roles.user_id = auth.uid()
      AND staff_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins view all push logs"
  ON public.push_notifications_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE staff_roles.user_id = auth.uid()
      AND staff_roles.role IN ('admin', 'manager')
    )
  );

-- =============================================
-- 4. HELPER FUNCTIONS
-- =============================================

-- Function to get active subscriptions for a user
CREATE OR REPLACE FUNCTION public.get_user_push_subscriptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  device_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    ps.device_name,
    ps.created_at
  FROM public.push_subscriptions ps
  WHERE ps.user_id = p_user_id
    AND ps.active = true
  ORDER BY ps.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_push_subscriptions IS 'Get all active push subscriptions for a user';

-- Function to mark subscription as inactive (expired/unsubscribed)
CREATE OR REPLACE FUNCTION public.deactivate_push_subscription(p_endpoint TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.push_subscriptions
  SET active = false,
      updated_at = NOW()
  WHERE endpoint = p_endpoint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.deactivate_push_subscription IS 'Deactivate a push subscription (expired or unsubscribed)';

-- Function to log push notification
CREATE OR REPLACE FUNCTION public.log_push_notification(
  p_user_id UUID,
  p_subscription_id UUID,
  p_notification_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_url TEXT,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.push_notifications_log (
    user_id,
    subscription_id,
    notification_id,
    title,
    message,
    url,
    status,
    error_message,
    sent_at
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_notification_id,
    p_title,
    p_message,
    p_url,
    p_status,
    p_error_message,
    CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_push_notification IS 'Log a push notification send attempt';

-- Function to update last used timestamp
CREATE OR REPLACE FUNCTION public.update_push_subscription_used(p_subscription_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.push_subscriptions
  SET last_used_at = NOW(),
      updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_push_subscription_used IS 'Update last used timestamp for a subscription';

-- =============================================
-- 5. UPDATE TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_subscriptions_updated_at();

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE ON public.push_subscriptions TO authenticated;
GRANT SELECT ON public.push_notifications_log TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
GRANT ALL ON public.push_notifications_log TO service_role;

GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_push_subscription TO service_role;
GRANT EXECUTE ON FUNCTION public.log_push_notification TO service_role;
GRANT EXECUTE ON FUNCTION public.update_push_subscription_used TO service_role;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Push notification tables created successfully!';
  RAISE NOTICE '   - push_subscriptions table';
  RAISE NOTICE '   - push_notifications_log table';
  RAISE NOTICE '   - Helper functions created';
  RAISE NOTICE '   - RLS policies enabled';
END $$;

-- Success message
SELECT '🎉 Push notification infrastructure ready!' as message;
