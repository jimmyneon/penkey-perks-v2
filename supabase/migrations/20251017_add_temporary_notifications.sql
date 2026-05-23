-- =============================================
-- Add Temporary Notification Feature
-- =============================================
-- Allows notifications to be marked as temporary
-- and automatically expire after first view + 24 hours

-- Add new columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_expire_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS first_shown_at TIMESTAMP WITH TIME ZONE;

-- Add index for temporary notifications
CREATE INDEX IF NOT EXISTS idx_notifications_temporary 
ON public.notifications(is_temporary, first_shown_at) 
WHERE is_temporary = true;

-- Create function to auto-deactivate expired temporary notifications
CREATE OR REPLACE FUNCTION deactivate_expired_temporary_notifications()
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET active = false,
      updated_at = NOW()
  WHERE is_temporary = true
    AND active = true
    AND first_shown_at IS NOT NULL
    AND first_shown_at + (auto_expire_hours || ' hours')::INTERVAL < NOW();
    
  -- Log how many were deactivated
  RAISE NOTICE 'Deactivated % expired temporary notifications', 
    (SELECT COUNT(*) FROM public.notifications 
     WHERE is_temporary = true 
     AND active = false 
     AND first_shown_at IS NOT NULL 
     AND first_shown_at + (auto_expire_hours || ' hours')::INTERVAL < NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark first view of temporary notification
CREATE OR REPLACE FUNCTION mark_temporary_notification_shown(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET first_shown_at = COALESCE(first_shown_at, NOW()),
      updated_at = NOW()
  WHERE id = p_notification_id
    AND is_temporary = true
    AND first_shown_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deactivate_expired_temporary_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_temporary_notification_shown TO authenticated;

-- Add comments
COMMENT ON COLUMN public.notifications.is_temporary IS 'If true, notification will auto-deactivate after auto_expire_hours from first view';
COMMENT ON COLUMN public.notifications.auto_expire_hours IS 'Hours after first_shown_at when temporary notification expires (default 24)';
COMMENT ON COLUMN public.notifications.first_shown_at IS 'Timestamp when temporary notification was first shown to any user';
COMMENT ON FUNCTION deactivate_expired_temporary_notifications IS 'Deactivates temporary notifications that have expired';
COMMENT ON FUNCTION mark_temporary_notification_shown IS 'Marks when a temporary notification was first shown';

-- Example: Create a temporary notification (commented out - for reference)
/*
INSERT INTO public.notifications (
  type, priority, title, message, icon, 
  conditions, variant, dismissible,
  is_temporary, auto_expire_hours
) VALUES (
  'custom', 1, '🎉 Limited Time Offer!', 
  'Double points on all purchases today only! Don''t miss out!', 
  '🎉',
  '{}', 'reward', true,
  true, 24  -- Temporary, expires 24 hours after first shown
);
*/

-- Success message
SELECT 'Temporary notification feature added successfully!' as message;
