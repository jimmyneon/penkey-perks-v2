-- =============================================
-- QUICK FIX: Add staff_announcement email template
-- Run this directly in Supabase SQL Editor
-- =============================================

-- First, delete any existing broken template
DELETE FROM public.email_templates WHERE name = 'staff_announcement';

-- Now insert the correct one with display_name
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
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>',
  '{{title}}

{{message}}

View your dashboard: {{app_url}}/dashboard

- The Penkey Team
Penkey Délicaf & Gifts',
  'announcement',
  true,
  'Template for staff announcements sent to all customers'
);

-- Verify it was created
SELECT id, name, display_name, category, active 
FROM email_templates 
WHERE name = 'staff_announcement';

-- Success message
SELECT '✅ Staff announcement email template created successfully!' as status;
