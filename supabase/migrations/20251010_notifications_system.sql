-- =============================================
-- Notification System - Admin Controlled
-- =============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification details
  type TEXT NOT NULL, -- 'reward', 'streak', 'checkin', 'stamp', 'game', 'milestone', 'custom'
  priority INTEGER NOT NULL DEFAULT 5, -- 1 = highest, 10 = lowest
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  
  -- Conditions (JSON for flexibility)
  conditions JSONB DEFAULT '{}', -- e.g., {"hasCheckedInToday": false, "timeOfDay": "morning"}
  
  -- Display settings
  variant TEXT DEFAULT 'default', -- 'default', 'streak', 'success', 'reward'
  dismissible BOOLEAN DEFAULT true,
  show_badge BOOLEAN DEFAULT false,
  badge_text TEXT,
  badge_color TEXT,
  
  -- Scheduling
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  days_of_week INTEGER[], -- 0=Sunday, 6=Saturday, NULL = all days
  time_of_day_start TIME, -- e.g., '09:00'
  time_of_day_end TIME, -- e.g., '17:00'
  
  -- Targeting
  target_audience TEXT DEFAULT 'all', -- 'all', 'new', 'returning', 'vip'
  min_points INTEGER,
  max_points INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for performance
CREATE INDEX idx_notifications_active ON public.notifications(active) WHERE active = true;
CREATE INDEX idx_notifications_priority ON public.notifications(priority);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );

-- Everyone can read active notifications
CREATE POLICY "Anyone can view active notifications"
  ON public.notifications
  FOR SELECT
  USING (active = true);

-- Add some default notifications
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
-- Priority 1: Rewards ready
('reward', 1, '🎁 Yaaas! Rewards Ready!', 'You''ve got treats waiting! Pop in and redeem them! 💕', '🎁', 
 '{"hasUnredeemedRewards": true}', 'reward', false),

-- Priority 2: Streak at risk
('streak', 2, '🔥 Streak at Risk!', 'Don''t lose your streak! Pop in today to keep it alive! 💪', '🔥',
 '{"currentStreak": {"min": 7}, "hasCheckedInToday": false}', 'streak', false),

-- Priority 3: One stamp away
('stamp', 3, '🎊 ONE MORE STAMP!!!', 'Eeeek! Just ONE more for FREE COFFEE! You HAVE to come in today! 💕', '☕',
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false}', 'reward', false),

-- Priority 4: Morning check-in
('checkin', 4, '☀️ Good Morning!', 'Start your day with us! Pop in for your check-in and earn 5 points! ✨', '☀️',
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true),

-- Priority 5: Afternoon coffee
('stamp', 5, '☕ Afternoon Coffee Run?', 'Time for a coffee break! Don''t forget your stamp! 🎉', '☕',
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "afternoon"}', 'default', true),

-- Priority 6: Play game
('game', 6, '🎮 Daily Game Ready!', 'Play now for a chance to win points, stamps, or prizes! 🎉', '🎮',
 '{"hasPlayedGameToday": false}', 'default', true),

-- Priority 7: All done
('custom', 7, '🌟 You''re Amazing!', 'All done for today! You''re crushing it! See you tomorrow! 💕', '🌟',
 '{"allComplete": true}', 'success', true);

-- Create notification_dismissals table (track which users dismissed which notifications)
CREATE TABLE IF NOT EXISTS public.notification_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.notification_dismissals ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own dismissals
CREATE POLICY "Users manage own dismissals"
  ON public.notification_dismissals
  FOR ALL
  USING (user_id = auth.uid());

-- Create function to get notifications for a user
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id UUID,
  p_user_state JSONB -- current user state (points, stamps, etc.)
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  priority INTEGER,
  title TEXT,
  message TEXT,
  icon TEXT,
  variant TEXT,
  dismissible BOOLEAN,
  show_badge BOOLEAN,
  badge_text TEXT,
  badge_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.priority,
    n.title,
    n.message,
    n.icon,
    n.variant,
    n.dismissible,
    n.show_badge,
    n.badge_text,
    n.badge_color
  FROM public.notifications n
  WHERE n.active = true
    -- Not dismissed by user
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id
      AND nd.notification_id = n.id
      AND nd.dismissed_at > NOW() - INTERVAL '1 day' -- Reset dismissals after 1 day
    )
    -- Check date range
    AND (n.start_date IS NULL OR n.start_date <= NOW())
    AND (n.end_date IS NULL OR n.end_date >= NOW())
    -- Check day of week
    AND (n.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(n.days_of_week))
    -- Check time of day
    AND (n.time_of_day_start IS NULL OR CURRENT_TIME >= n.time_of_day_start)
    AND (n.time_of_day_end IS NULL OR CURRENT_TIME <= n.time_of_day_end)
    -- Check conditions (simplified - would need more complex logic in real app)
    -- This is where you'd check the p_user_state JSONB against n.conditions
  ORDER BY n.priority ASC
  LIMIT 1; -- Return highest priority notification
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.notification_dismissals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications TO authenticated;

-- Add comments
COMMENT ON TABLE public.notifications IS 'Admin-controlled notification system';
COMMENT ON TABLE public.notification_dismissals IS 'Track which users dismissed which notifications';
COMMENT ON FUNCTION public.get_user_notifications IS 'Get the highest priority notification for a user based on their state';

-- Success message
SELECT 'Notification system created successfully!' as message;
