-- =============================================
-- Notification Analytics Tables
-- =============================================

-- Create notification_views table
CREATE TABLE IF NOT EXISTS public.notification_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  user_agent TEXT
);

-- Create notification_actions table
CREATE TABLE IF NOT EXISTS public.notification_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('dismiss', 'click', 'convert')),
  action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_views_notification ON public.notification_views(notification_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON public.notification_views(user_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON public.notification_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_actions_notification ON public.notification_actions(notification_id);
CREATE INDEX IF NOT EXISTS idx_actions_user ON public.notification_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON public.notification_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_actions_date ON public.notification_actions(action_at);

-- Enable RLS
ALTER TABLE public.notification_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_actions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views/actions
CREATE POLICY "Users can track own views"
  ON public.notification_views
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can track own actions"
  ON public.notification_actions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all analytics
CREATE POLICY "Admins can view all views"
  ON public.notification_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can view all actions"
  ON public.notification_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- Grant permissions
GRANT INSERT ON public.notification_views TO authenticated;
GRANT INSERT ON public.notification_actions TO authenticated;
GRANT SELECT ON public.notification_views TO authenticated;
GRANT SELECT ON public.notification_actions TO authenticated;

-- Add comments
COMMENT ON TABLE public.notification_views IS 'Track when notifications are viewed by users';
COMMENT ON TABLE public.notification_actions IS 'Track user actions on notifications (dismiss, click, convert)';

-- Success message
SELECT 'Notification analytics tables created successfully!' as message;
