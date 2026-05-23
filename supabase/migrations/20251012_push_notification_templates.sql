-- =============================================
-- PUSH NOTIFICATION TEMPLATES
-- =============================================
-- Creates templates for automated and manual push notifications
-- Integrates with existing notifications and email systems
-- =============================================

-- =============================================
-- 1. PUSH NOTIFICATION TEMPLATES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.push_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL, -- 'automated', 'manual', 'scheduled'
  
  -- Trigger conditions (for automated templates)
  trigger_event TEXT, -- 'game_won', 'reward_earned', 'streak_risk', etc.
  conditions JSONB DEFAULT '{}',
  
  -- Content
  url TEXT DEFAULT '/dashboard',
  icon TEXT DEFAULT '/icon-192.png',
  image TEXT,
  require_interaction BOOLEAN DEFAULT false,
  
  -- Scheduling (for scheduled campaigns)
  schedule_time TIME,
  schedule_days INTEGER[], -- [0,1,2,3,4,5,6] for days of week (0=Sunday)
  
  -- Settings
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50, -- 0-100, higher = more important
  
  -- Metadata
  description TEXT,
  variables JSONB DEFAULT '[]', -- Available variables: ["name", "beans", etc.]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_templates_category ON public.push_notification_templates(category);
CREATE INDEX idx_push_templates_trigger ON public.push_notification_templates(trigger_event) WHERE trigger_event IS NOT NULL;
CREATE INDEX idx_push_templates_active ON public.push_notification_templates(active) WHERE active = true;
CREATE INDEX idx_push_templates_priority ON public.push_notification_templates(priority DESC);

-- Constraints
ALTER TABLE public.push_notification_templates 
  ADD CONSTRAINT check_push_template_category 
  CHECK (category IN ('automated', 'manual', 'scheduled'));

COMMENT ON TABLE public.push_notification_templates IS 'Templates for push notifications (automated, manual, and scheduled)';

-- =============================================
-- 2. INSERT DEFAULT TEMPLATES
-- =============================================

-- Automated Trigger Templates
INSERT INTO public.push_notification_templates (name, title, message, category, trigger_event, url, priority, description, variables) VALUES
('game_won', '🎮 You Won!', 'Congratulations {{name}}! You earned {{beans}} beans! Keep playing to earn more!', 'automated', 'game_won', '/games', 75, 'Sent when user wins a game', '["name", "beans"]'),
('coffee_stamp_earned', '☕ Stamp Added!', 'Great! {{stampsRemaining}} more stamp(s) until your free coffee!', 'automated', 'coffee_stamp_earned', '/dashboard', 70, 'Sent when user earns a coffee stamp', '["stampsRemaining"]'),
('reward_earned', '🎁 Reward Unlocked!', 'Congratulations! Your {{rewardName}} is ready to use!', 'automated', 'reward_earned', '/rewards', 80, 'Sent when user unlocks a reward', '["rewardName"]'),
('reward_expiring_soon', '⏰ Expiring Soon!', 'Don''t forget! Your {{rewardName}} expires in {{expiryTime}}. Use it before it''s gone!', 'automated', 'reward_expiring_soon', '/rewards', 85, 'Sent 24 hours before reward expires', '["rewardName", "expiryTime"]'),
('reward_expiring_urgent', '🚨 Last Chance!', 'URGENT: Your {{rewardName}} expires in {{expiryTime}}! Use it now!', 'automated', 'reward_expiring_urgent', '/rewards', 100, 'Sent 2 hours before reward expires', '["rewardName", "expiryTime"]'),
('streak_at_risk', '🔥 Streak Alert!', 'Don''t break your {{currentStreak}}-day streak! Check in today to keep it going!', 'automated', 'streak_at_risk', '/dashboard', 75, 'Sent at night if user hasn''t checked in', '["currentStreak"]'),
('birthday', '🎂 Happy Birthday!', 'Happy Birthday {{name}}! 🎉 Enjoy your special birthday treat on us!', 'automated', 'birthday', '/rewards', 90, 'Sent on user''s birthday', '["name"]'),
('milestone_reached', '🎉 Milestone Achieved!', 'Amazing! You''ve earned {{totalBeans}} beans! Keep up the great work!', 'automated', 'milestone_reached', '/dashboard', 70, 'Sent when user reaches bean milestones', '["totalBeans"]'),
('win_back', '💤 We Miss You!', 'Hey {{name}}! We haven''t seen you in a while. Come back for 100 bonus beans!', 'automated', 'win_back', '/dashboard', 60, 'Sent to inactive users after 30 days', '["name"]'),
('free_coffee_ready', '☕ Free Coffee Ready!', 'You''ve earned a free coffee! Show this notification at the counter to redeem.', 'automated', 'free_coffee_earned', '/rewards', 95, 'Sent when user earns free coffee reward', '[]')
ON CONFLICT (name) DO NOTHING;

-- Manual Staff Templates
INSERT INTO public.push_notification_templates (name, title, message, category, url, priority, description, variables) VALUES
('staff_announcement', '📢 Announcement', 'Important announcement from Penkey!', 'manual', '/dashboard', 50, 'General announcements from staff', '[]'),
('staff_promotion', '🎊 Special Offer', 'Limited time offer at Penkey!', 'manual', '/dashboard', 60, 'Promotional offers and deals', '[]'),
('staff_important', '⚠️ Important Update', 'Important information from Penkey.', 'manual', '/dashboard', 80, 'Urgent or important updates', '[]'),
('staff_reminder', '🔔 Reminder', 'Friendly reminder from Penkey!', 'manual', '/dashboard', 40, 'General reminders', '[]'),
('staff_event', '🎉 Event', 'Special event at Penkey!', 'manual', '/dashboard', 55, 'Event announcements', '[]'),
('staff_new_menu', '🍰 New Menu Items', 'Check out our new menu items!', 'manual', '/dashboard', 50, 'New product announcements', '[]')
ON CONFLICT (name) DO NOTHING;

-- Scheduled Campaign Templates
INSERT INTO public.push_notification_templates (name, title, message, category, schedule_time, schedule_days, url, priority, description, variables) VALUES
('daily_checkin_reminder', '☀️ Good Morning!', 'Start your day right! Don''t forget to check in today for your daily beans!', 'scheduled', '09:00:00', ARRAY[1,2,3,4,5,6,0], '/dashboard', 30, 'Daily morning check-in reminder', '[]'),
('lunchtime_prompt', '☕ Lunchtime?', 'Perfect time for a coffee break! Visit us for your midday pick-me-up!', 'scheduled', '12:00:00', ARRAY[1,2,3,4,5], '/dashboard', 25, 'Lunchtime visit prompt', '[]'),
('evening_reminder', '🌙 Evening Visit?', 'End your day with a treat! We''re open and ready to serve you!', 'scheduled', '17:00:00', ARRAY[1,2,3,4,5], '/dashboard', 25, 'Evening visit reminder', '[]'),
('weekend_special', '🎊 Weekend Vibes!', 'It''s the weekend! Enjoy double beans on all purchases today!', 'scheduled', '10:00:00', ARRAY[0,6], '/dashboard', 50, 'Weekend promotion', '[]')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. HELPER FUNCTIONS
-- =============================================

-- Function to get template by trigger event
CREATE OR REPLACE FUNCTION public.get_push_template_by_trigger(p_trigger_event TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  message TEXT,
  url TEXT,
  icon TEXT,
  require_interaction BOOLEAN,
  priority INTEGER,
  variables JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.name,
    pt.title,
    pt.message,
    pt.url,
    pt.icon,
    pt.require_interaction,
    pt.priority,
    pt.variables
  FROM public.push_notification_templates pt
  WHERE pt.trigger_event = p_trigger_event
    AND pt.active = true
    AND pt.category = 'automated'
  ORDER BY pt.priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_push_template_by_trigger IS 'Get active push template for a trigger event';

-- Function to get scheduled templates for current time
CREATE OR REPLACE FUNCTION public.get_scheduled_push_templates()
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  message TEXT,
  url TEXT,
  icon TEXT,
  priority INTEGER
) AS $$
DECLARE
  v_current_time TIME;
  v_current_day INTEGER;
BEGIN
  v_current_time := CURRENT_TIME;
  v_current_day := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER; -- 0=Sunday, 6=Saturday
  
  RETURN QUERY
  SELECT 
    pt.id,
    pt.name,
    pt.title,
    pt.message,
    pt.url,
    pt.icon,
    pt.priority
  FROM public.push_notification_templates pt
  WHERE pt.category = 'scheduled'
    AND pt.active = true
    AND pt.schedule_time IS NOT NULL
    AND v_current_day = ANY(pt.schedule_days)
    AND ABS(EXTRACT(EPOCH FROM (v_current_time - pt.schedule_time))) < 300 -- Within 5 minutes
  ORDER BY pt.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_scheduled_push_templates IS 'Get push templates scheduled for current time';

-- Function to substitute variables in template
CREATE OR REPLACE FUNCTION public.substitute_push_variables(
  p_template_text TEXT,
  p_variables JSONB
)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  var_key TEXT;
  var_value TEXT;
BEGIN
  result := p_template_text;
  
  FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    result := REPLACE(result, '{{' || var_key || '}}', var_value);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.substitute_push_variables IS 'Replace template variables with actual values';

-- =============================================
-- 4. ENABLE RLS
-- =============================================

ALTER TABLE public.push_notification_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active push templates"
  ON public.push_notification_templates
  FOR SELECT
  USING (active = true);

-- Only admins can modify
CREATE POLICY "Admins manage push templates"
  ON public.push_notification_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- 5. UPDATE TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.update_push_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_templates_updated_at
  BEFORE UPDATE ON public.push_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_templates_updated_at();

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON public.push_notification_templates TO authenticated;
GRANT ALL ON public.push_notification_templates TO service_role;

GRANT EXECUTE ON FUNCTION public.get_push_template_by_trigger TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scheduled_push_templates TO service_role;
GRANT EXECUTE ON FUNCTION public.substitute_push_variables TO authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM public.push_notification_templates;
  
  RAISE NOTICE '✅ Push notification templates created successfully!';
  RAISE NOTICE '   - push_notification_templates table created';
  RAISE NOTICE '   - % templates inserted', template_count;
  RAISE NOTICE '   - Helper functions created';
  RAISE NOTICE '   - RLS policies enabled';
END $$;

-- Success message
SELECT 
  '🎉 Push notification templates ready!' as message,
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE category = 'automated') as automated,
  COUNT(*) FILTER (WHERE category = 'manual') as manual,
  COUNT(*) FILTER (WHERE category = 'scheduled') as scheduled
FROM public.push_notification_templates;
