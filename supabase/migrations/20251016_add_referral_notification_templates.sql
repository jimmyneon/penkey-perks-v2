-- =============================================
-- ADD REFERRAL NOTIFICATION TEMPLATES
-- Date: 2025-10-16
-- =============================================
-- Purpose: Add push notification and email templates for referral events
-- Templates:
--   1. referral_success - Sent to referrer when someone signs up
--   2. referred_welcome - Sent to new user who was referred
-- =============================================

-- 1. Add push notification templates
INSERT INTO public.push_notification_templates (name, title, message, trigger_event, priority, active, icon, url)
VALUES 
  (
    'referral_success',
    '🎊 {{referredName}} Joined!',
    'Your friend {{referredName}} signed up using your referral link! You earned {{beans}} beans. Keep sharing!',
    'referral_claimed',
    70,
    true,
    '/icon-192.png',
    '/referrals'
  ),
  (
    'referred_welcome',
    '🎉 Welcome to Penkey!',
    'Thanks for joining through {{referrerName}}''s link! Visit Penkey to redeem your free coffee and start earning beans.',
    'user_referred',
    60,
    true,
    '/icon-192.png',
    '/dashboard'
  )
ON CONFLICT (name) 
DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  trigger_event = EXCLUDED.trigger_event,
  priority = EXCLUDED.priority,
  active = EXCLUDED.active,
  icon = EXCLUDED.icon,
  url = EXCLUDED.url,
  updated_at = NOW();

-- 2. Add email templates
INSERT INTO public.email_templates (name, subject, html_body, active, category)
VALUES 
  (
    'referral_success',
    '🎊 {{referredName}} Joined Penkey Perks!',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Friend Joined!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎊</h1>
    <h1 style="color: white; margin: 10px 0;">Your Friend Joined!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Great news! 👥</h2>
    
    <p><strong>{{referredName}}</strong> just signed up using your referral link!</p>
    
    <div style="background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">+{{beans}} Beans! ☕</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Referral Bonus Added!</p>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        💡 <strong>Keep sharing!</strong> Earn {{beans}} beans for every friend who signs up through your link.
      </p>
    </div>
    
    <p>Thanks for spreading the word about Penkey Perks! The more friends you refer, the more beans you earn.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="' || COALESCE(current_setting('app.settings.app_url', true), 'https://penkey.app') || '/referrals" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Share Your Referral Link 🚀
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Visit Penkey Deli to redeem your beans!
    </p>
  </div>
</body>
</html>',
    true,
    'referral'
  ),
  (
    'referred_welcome',
    '🎉 Welcome to Penkey Perks!',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Penkey Perks!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎉</h1>
    <h1 style="color: white; margin: 10px 0;">Welcome to Penkey Perks!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi there! 👋</h2>
    
    <p>Thanks for joining through <strong>{{referrerName}}''s</strong> referral link! You''re now part of the Penkey family. 💕</p>
    
    <div style="background: linear-gradient(135deg, #FFA500 0%, #FFD700 100%); padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: white;">Your Welcome Bonus</h3>
      <h2 style="margin: 0; color: white; font-size: 36px;">250 Beans + Free Coffee! ☕</h2>
    </div>
    
    <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2E7D32;">
        🎁 <strong>{{referrerName}}</strong> will get {{beans}} beans as a thank you when you visit Penkey!
      </p>
    </div>
    
    <h3 style="color: #8B5CF6; margin-top: 30px;">What''s Next?</h3>
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>☕ Visit Penkey:</strong> Pop into the café to redeem your free coffee
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>📱 Check In:</strong> Use the app to check in and earn daily beans
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎮 Play Games:</strong> Win bonus rewards and prizes
      </li>
      <li style="padding: 10px 0;">
        <strong>👥 Refer Friends:</strong> Share your link and earn {{beans}} beans per friend!
      </li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="' || COALESCE(current_setting('app.settings.app_url', true), 'https://penkey.app') || '/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Start Earning Beans! 🚀
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Questions? Visit us at Penkey Deli or reply to this email.
    </p>
  </div>
</body>
</html>',
    true,
    'referral'
  )
ON CONFLICT (name) 
DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  active = EXCLUDED.active,
  category = EXCLUDED.category,
  updated_at = NOW();

-- =============================================
-- VERIFICATION
-- =============================================
DO $$
DECLARE
  v_push_count INTEGER;
  v_email_count INTEGER;
BEGIN
  -- Count push notification templates
  SELECT COUNT(*) INTO v_push_count
  FROM public.push_notification_templates
  WHERE name IN ('referral_success', 'referred_welcome');
  
  -- Count email templates
  SELECT COUNT(*) INTO v_email_count
  FROM public.email_templates
  WHERE name IN ('referral_success', 'referred_welcome');
  
  IF v_push_count = 2 AND v_email_count = 2 THEN
    RAISE NOTICE '✅ All referral templates created successfully!';
    RAISE NOTICE '   - Push notification templates: %', v_push_count;
    RAISE NOTICE '   - Email templates: %', v_email_count;
  ELSE
    RAISE WARNING '⚠️  Template creation incomplete:';
    RAISE WARNING '   - Push templates: % (expected 2)', v_push_count;
    RAISE WARNING '   - Email templates: % (expected 2)', v_email_count;
  END IF;
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
COMMENT ON TABLE public.push_notification_templates IS 'Push notification templates including referral_success and referred_welcome';
COMMENT ON TABLE public.email_templates IS 'Email templates including referral_success and referred_welcome';
