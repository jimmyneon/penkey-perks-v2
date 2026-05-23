-- =============================================
-- ADD ALL ADDITIONAL EMAIL TEMPLATES
-- =============================================
-- Penkey Perks branding - matches dashboard style
-- Colors: Orange (#FF8C42), Dark (#2C3E50), Cream (#F5F1E8)
-- =============================================

-- =============================================
-- 1. BADGE EARNED EMAIL
-- =============================================

INSERT INTO public.email_templates (
  name,
  display_name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'badge_earned',
  'Badge Earned',
  'Sent when user earns a new badge tier',
  '🏅 You Earned a New Badge!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Badge Earned!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🏅</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">New Badge Earned!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Congratulations, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You''ve unlocked a new achievement level!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <h2 style="margin: 0 0 8px 0; font-size: 32px; color: #2C3E50;">{{badgeName}}</h2>
      <p style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #FF8C42;">{{badgeTitle}}</p>
      <p style="margin: 0; color: #6B7280; font-size: 14px;">Lifetime Points: {{lifetimePoints}}</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; color: #2C3E50; font-size: 18px;">Your Perks:</h3>
      <p style="margin: 0; color: #3D4F5C; font-size: 14px;">{{perks}}</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Keep earning points to unlock even more exclusive benefits!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        View Your Profile ⭐
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      You''re doing amazing! Keep it up! 💪
    </p>
  </div>
</body>
</html>',
  '["name", "badgeName", "badgeTitle", "lifetimePoints", "perks", "appUrl"]'::jsonb,
  'achievement',
  true
);

-- =============================================
-- 2. FIRST STAMP EMAIL
-- =============================================

INSERT INTO public.email_templates (
  name,
  display_name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'first_stamp',
  'First Stamp',
  'Sent when user earns their first stamp',
  '🎊 Your First Stamp!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>First Stamp!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎊</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Your First Stamp!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Welcome to the journey, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You just earned your first stamp! Here''s how it works:</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFFEF7 100%); border-left: 4px solid #FF8C42; padding: 20px; margin: 0 0 16px 0; border-radius: 8px;">
      <div style="margin: 0 0 12px 0;">
        <strong style="color: #FF8C42; font-size: 16px;">☕ Collect 10 Stamps</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">Check in daily to earn stamps</p>
      </div>
      <div style="margin: 0 0 12px 0;">
        <strong style="color: #FF8C42; font-size: 16px;">🎁 Get Free Coffee</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">10 stamps = 1 free coffee reward!</p>
      </div>
      <div style="margin: 0;">
        <strong style="color: #FF8C42; font-size: 16px;">🎮 Play Bonus Games</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">After check-in, play games for extra prizes</p>
      </div>
    </div>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Your Progress:</p>
      <p style="margin: 0; font-size: 36px; color: #FF8C42; font-weight: 700;">1 / 10</p>
      <p style="margin: 8px 0 0 0; color: #3D4F5C; font-size: 14px;">Only 9 more stamps to go!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Check In Tomorrow ☕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      See you tomorrow at Penkey Deli! 💕
    </p>
  </div>
</body>
</html>',
  '["name", "appUrl"]'::jsonb,
  'onboarding',
  true
);

-- =============================================
-- 3. HALFWAY THERE EMAIL
-- =============================================

INSERT INTO public.email_templates (
  name,
  display_name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'halfway_there',
  'Halfway There',
  'Sent when user reaches 5 stamps',
  '☕ Halfway to Your Free Coffee!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halfway There!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">☕</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">You''re Halfway There!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Great progress, {{name}}! 🎯</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You''ve collected 5 stamps - you''re halfway to your free coffee!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 16px;">Your Progress:</p>
      <p style="margin: 0; font-size: 48px; color: #FF8C42; font-weight: 700;">5 / 10</p>
      <div style="background: #F5F1E8; height: 12px; border-radius: 6px; margin: 16px 0; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); height: 100%; width: 50%;"></div>
      </div>
      <p style="margin: 0; color: #2C3E50; font-size: 18px; font-weight: 600;">Just 5 more stamps to go!</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #2C3E50; font-weight: 600;">💡 Pro Tip:</p>
      <p style="margin: 0; color: #3D4F5C; font-size: 14px;">Check in daily and play bonus games to earn extra stamps faster!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Keep Going! ☕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      You''re doing great! See you soon! 🎉
    </p>
  </div>
</body>
</html>',
  '["name", "appUrl"]'::jsonb,
  'engagement',
  true
);

-- Success message
SELECT '✅ Part 1: Added 3 email templates (Badge, First Stamp, Halfway)' as message;
