-- =============================================
-- FIX STAFF EMAIL MESSAGING
-- Date: 2025-10-13
-- =============================================
-- This migration ensures staff messages can send emails properly
-- =============================================

-- 1. Ensure staff_announcement email template exists
-- =============================================
INSERT INTO public.email_templates (
  name,
  display_name,
  subject,
  html_body,
  text_body,
  category,
  active,
  description
)
VALUES (
  'staff_announcement',
  'Staff Announcement',
  '{{title}}',
  '
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8B6F47; margin: 0;">Penkey Perks</h1>
      </div>
      
      <div style="background: #FFFEF7; border-left: 4px solid #FFD93B; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #8B6F47; margin-top: 0;">{{title}}</h2>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">{{message}}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{app_url}}/dashboard" style="background: #FFD93B; color: #8B6F47; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          View Dashboard
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
        <p style="color: #666; font-size: 14px; margin: 5px 0;">
          - The Penkey Team
        </p>
        <p style="color: #999; font-size: 12px; margin: 5px 0;">
          Penkey Délicaf & Gifts
        </p>
      </div>
    </div>
  ',
  '{{title}}

{{message}}

View your dashboard: {{app_url}}/dashboard

- The Penkey Team
Penkey Délicaf & Gifts',
  'announcement',
  true,
  'Template for staff announcements sent to all customers'
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  category = EXCLUDED.category,
  active = EXCLUDED.active,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Check if mark_email_sent function exists, create if not
-- =============================================
CREATE OR REPLACE FUNCTION public.mark_email_sent(
  p_queue_id UUID,
  p_resend_id TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_success THEN
    UPDATE public.email_queue
    SET 
      status = 'sent',
      sent_at = NOW(),
      resend_id = p_resend_id,
      error_message = NULL,
      attempts = attempts + 1
    WHERE id = p_queue_id;
  ELSE
    UPDATE public.email_queue
    SET 
      status = 'failed',
      error_message = p_error_message,
      attempts = attempts + 1
    WHERE id = p_queue_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_email_sent IS 'Marks an email in the queue as sent or failed';

-- 3. Ensure app_settings table exists for cron configuration
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create helper function to get app settings
-- =============================================
CREATE OR REPLACE FUNCTION public.get_app_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM public.app_settings
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_app_setting IS 'Gets an app setting value by key';

-- 5. Insert default app settings if they don't exist
-- =============================================
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('app_url', 'https://perks.penkey.co.uk', 'Base URL of the application'),
  ('cron_secret', 'CHANGE_ME_IN_PRODUCTION', 'Secret key for cron job authentication')
ON CONFLICT (key) DO NOTHING;

-- 6. Verification queries
-- =============================================
DO $$
BEGIN
  -- Check email template exists
  IF NOT EXISTS (
    SELECT 1 FROM public.email_templates 
    WHERE name = 'staff_announcement' AND active = true
  ) THEN
    RAISE EXCEPTION 'staff_announcement email template not created!';
  END IF;
  
  -- Check function exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'mark_email_sent' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'mark_email_sent function not created!';
  END IF;
  
  -- Check app_settings table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'app_settings' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'app_settings table not created!';
  END IF;
  
  RAISE NOTICE '✅ All email messaging components created successfully!';
END $$;

-- Final success message
SELECT '✅ Staff email messaging fixed!' as message,
       'Email template created, functions ready' as status,
       'Remember to: 1) Enable pg_net extension, 2) Set up cron jobs, 3) Configure app_url in app_settings' as next_steps;
