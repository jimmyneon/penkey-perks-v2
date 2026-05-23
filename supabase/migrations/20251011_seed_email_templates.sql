-- =============================================
-- SEED EMAIL TEMPLATES
-- =============================================
-- This migration seeds the initial email templates
-- based on the existing templates in lib/email/templates.tsx
-- =============================================

-- =============================================
-- 1. WELCOME EMAIL
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
  'welcome_email',
  'Welcome Email',
  'Sent when a new user signs up',
  'Welcome to Penkey Perks! 🦆',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Penkey Perks!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3CA9E2 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🦆</h1>
    <h1 style="color: white; margin: 10px 0;">Welcome to Penkey Perks!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi {{name}}! 👋</h2>
    
    <p>Welcome to the flock! We''re excited to have you join Penkey Perks.</p>
    
    <h3 style="color: #3CA9E2;">Here''s how it works:</h3>
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎯 Earn Points:</strong> Check in daily to earn 5 points
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎮 Play Games:</strong> After check-in, play bonus games for extra prizes
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎁 Get Rewards:</strong> Redeem points for free treats and discounts
      </li>
      <li style="padding: 10px 0;">
        <strong>👥 Refer Friends:</strong> Share your link and earn bonus points
      </li>
    </ul>
    
    <div style="background: #FFFEF7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0;"><strong>Your Referral Link:</strong></p>
      <a href="{{referralUrl}}" style="color: #3CA9E2; word-break: break-all;">{{referralUrl}}</a>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Get Started 🦆
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Questions? Visit us at Penkey Deli or reply to this email.
    </p>
  </div>
</body>
</html>',
  '["name", "referralUrl", "appUrl"]'::jsonb,
  'transactional',
  true
);

-- =============================================
-- 2. REWARD EARNED EMAIL
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
  'reward_earned',
  'Reward Earned',
  'Sent when a user earns a new reward',
  '🎁 You Earned a Reward!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Earned a Reward!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎁</h1>
    <h1 style="color: white; margin: 10px 0;">Congratulations!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Great news, {{name}}! 🎉</h2>
    
    <p>You''ve earned a new reward!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #3CA9E2 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; color: white;">
      <h2 style="margin: 0 0 10px 0; font-size: 32px;">{{rewardName}}</h2>
      <p style="margin: 0; font-size: 24px; font-weight: bold;">{{rewardValue}}</p>
    </div>
    
    <div style="background: #FFFEF7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0;"><strong>Your QR Code:</strong></p>
      <img src="{{qrCodeUrl}}" alt="QR Code" style="max-width: 200px; height: auto;" />
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #7f8c8d;">Show this QR code at Penkey to redeem</p>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FFD93B; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        ⏰ <strong>Expires in {{expiryDays}} days</strong> - Don''t forget to use it!
      </p>
    </div>
    
    <p>Visit Penkey Deli to redeem your reward!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View My Rewards 🎁
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Keep earning points to unlock more rewards!
    </p>
  </div>
</body>
</html>',
  '["name", "rewardName", "rewardValue", "qrCodeUrl", "expiryDays", "appUrl"]'::jsonb,
  'transactional',
  true
);

-- =============================================
-- 3. REWARD EXPIRING EMAIL
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
  'reward_expiring',
  'Reward Expiring Soon',
  'Sent 3 days before a reward expires',
  '⏰ Your Reward Expires in {{daysLeft}} Days!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reward Expiring Soon!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF5252 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">⏰</h1>
    <h1 style="color: white; margin: 10px 0;">Reward Expiring Soon!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi {{name}}! 👋</h2>
    
    <p>Just a friendly reminder that one of your rewards is expiring soon!</p>
    
    <div style="background: #FFF3CD; border: 2px solid #FF5252; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #856404;">{{rewardName}}</h3>
      <p style="margin: 0; font-size: 18px; color: #856404;">
        <strong>Expires in {{daysLeft}} day{{daysLeftPlural}}!</strong>
      </p>
    </div>
    
    <div style="background: #FFFEF7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0;"><strong>Your QR Code:</strong></p>
      <img src="{{qrCodeUrl}}" alt="QR Code" style="max-width: 200px; height: auto;" />
    </div>
    
    <p>Don''t let it go to waste! Visit Penkey Deli and redeem your reward before it expires.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: #FF5252; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Redeem Now 🎁
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      See you soon at Penkey Deli!
    </p>
  </div>
</body>
</html>',
  '["name", "rewardName", "daysLeft", "daysLeftPlural", "qrCodeUrl", "appUrl"]'::jsonb,
  'marketing',
  true
);

-- =============================================
-- 4. REFERRAL CONFIRMED EMAIL
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
  'referral_confirmed',
  'Referral Confirmed',
  'Sent when a referral completes their first check-in',
  '🎉 Your Referral Bonus is Here!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Confirmed!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3CA9E2 0%, #4CAF50 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎉</h1>
    <h1 style="color: white; margin: 10px 0;">Referral Confirmed!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Awesome, {{name}}! 🎯</h2>
    
    <p>Your friend <strong>{{refereeName}}</strong> just completed their first check-in!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #4CAF50 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">+{{pointsEarned}} Points</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Bonus Points Added!</p>
    </div>
    
    <p>Keep sharing your referral link to earn even more points!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/referrals" style="display: inline-block; background: #3CA9E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Share Your Link 👥
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Thanks for spreading the word about Penkey Perks!
    </p>
  </div>
</body>
</html>',
  '["name", "refereeName", "pointsEarned", "appUrl"]'::jsonb,
  'transactional',
  true
);

-- =============================================
-- 5. REWARD REDEEMED EMAIL
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
  'reward_redeemed',
  'Reward Redeemed',
  'Sent when a user redeems a reward',
  '✅ Reward Redeemed Successfully!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reward Redeemed!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #3CA9E2 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">✅</h1>
    <h1 style="color: white; margin: 10px 0;">Enjoy Your Reward!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi {{name}}! 😊</h2>
    
    <p>Your reward has been successfully redeemed!</p>
    
    <div style="background: #FFFEF7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #2C3E50;">{{rewardName}}</h3>
      <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Redeemed on {{redeemedAt}}</p>
    </div>
    
    <p>We hope you enjoyed your treat! Keep earning points for more rewards.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Check In Again 🎯
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      See you again soon at Penkey Deli! 💕
    </p>
  </div>
</body>
</html>',
  '["name", "rewardName", "redeemedAt", "appUrl"]'::jsonb,
  'transactional',
  true
);

-- =============================================
-- 6. INACTIVE USER EMAIL
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
  'inactive_user',
  'We Miss You!',
  'Sent to users who haven''t checked in for 7 days',
  'We Miss You at Penkey! 🦆',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3CA9E2 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🦆</h1>
    <h1 style="color: white; margin: 10px 0;">We Miss You!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hi {{name}}! 👋</h2>
    
    <p>It''s been a while since we''ve seen you at Penkey Deli!</p>
    
    <div style="background: #FFFEF7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 18px;"><strong>Your Current Balance:</strong></p>
      <p style="margin: 10px 0 0 0; font-size: 32px; color: #3CA9E2; font-weight: bold;">{{pointsBalance}} Points</p>
    </div>
    
    <p>Come visit us and earn more points! We have delicious treats waiting for you.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Check In Now 🎯
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      See you soon! 💕
    </p>
  </div>
</body>
</html>',
  '["name", "pointsBalance", "appUrl"]'::jsonb,
  'marketing',
  true
);

-- =============================================
-- 7. MILESTONE REACHED EMAIL
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
  'milestone_reached',
  'Milestone Reached',
  'Sent when user reaches a points milestone',
  '🎊 You Reached {{milestone}} Points!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Reached!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FFD93B 0%, #4CAF50 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎊</h1>
    <h1 style="color: white; margin: 10px 0;">Milestone Reached!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Congratulations, {{name}}! 🎉</h2>
    
    <p>You''ve reached an amazing milestone!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #3CA9E2 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">{{milestone}} Points</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Total Points Earned!</p>
    </div>
    
    <p>You''re doing amazing! Keep earning points to unlock even more rewards.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View Rewards 🎁
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Thanks for being an amazing customer! 💕
    </p>
  </div>
</body>
</html>',
  '["name", "milestone", "appUrl"]'::jsonb,
  'notification',
  true
);

-- =============================================
-- SUCCESS
-- =============================================

SELECT 'Email templates seeded successfully!' as message;
SELECT COUNT(*) || ' templates created' as count FROM public.email_templates;
