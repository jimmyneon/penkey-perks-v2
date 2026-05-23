-- =============================================
-- MIGRATE EMAIL TEMPLATES TO DATABASE
-- =============================================
-- This migration moves all hardcoded email templates
-- from lib/email/templates.tsx into the database
-- =============================================

-- First, delete any existing templates we're about to recreate
DELETE FROM public.email_templates WHERE name IN (
  'welcome_email',
  'reward_earned',
  'reward_expiring',
  'referral_confirmed',
  'birthday_email',
  'win_back_email',
  'milestone_email'
);

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
  'Welcome to Penkey Perks, {{name}}! 🦆',
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
        <strong>☕ Collect Stamps:</strong> Buy coffee and collect stamps
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎮 Play Games:</strong> After check-in, play bonus games for extra prizes
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        <strong>🎁 Earn Rewards:</strong> Collect 10 stamps to unlock free coffee
      </li>
      <li style="padding: 10px 0;">
        <strong>👥 Refer Friends:</strong> Share your link and earn bonus beans
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
  '["name", "referralUrl", "appUrl"]',
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
  'Reward Earned Email',
  'Sent when a user earns a reward',
  'You Earned a Reward! 🎁',
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
    
    <div style="background: #FFF3CD; border-left: 4px solid #FFD93B; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        ⏰ <strong>Expires in {{expiryDays}} days</strong> - Don''t forget to use it!
      </p>
    </div>
    
    <p>Visit your rewards wallet to view the QR code and redeem it at Penkey Deli.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: #FFD93B; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View My Rewards 🎁
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Keep collecting stamps to earn more rewards!
    </p>
  </div>
</body>
</html>',
  '["name", "rewardName", "rewardValue", "expiryDays", "appUrl"]',
  'notification',
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
  'Reward Expiring Email',
  'Sent when a reward is about to expire',
  'Reward Expiring Soon! ⏰',
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
        <strong>Expires in {{daysLeft}} day(s)!</strong>
      </p>
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
  '["name", "rewardName", "daysLeft", "appUrl"]',
  'notification',
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
  'Referral Confirmed Email',
  'Sent when a referral is confirmed',
  'Referral Confirmed! 🎉',
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
    <h2 style="color: #2C3E50;">Awesome, {{name}}! 🦆</h2>
    
    <p>Your friend <strong>{{refereeName}}</strong> just completed their first check-in!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #4CAF50 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0; color: white; font-size: 48px;">+{{beansEarned}} ☕</h2>
      <p style="margin: 10px 0 0 0; color: white; font-size: 18px;">Bonus Beans Added!</p>
    </div>
    
    <p>Keep sharing your referral link to earn even more beans!</p>
    
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
  '["name", "refereeName", "beansEarned", "appUrl"]',
  'notification',
  true
);

-- =============================================
-- 5. BIRTHDAY EMAIL (NEW)
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
  'birthday_email',
  'Birthday Email',
  'Sent on user''s birthday',
  'Happy Birthday, {{name}}! 🎂',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FF6B9D 0%, #FFD93B 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎂</h1>
    <h1 style="color: white; margin: 10px 0;">Happy Birthday!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Happy Birthday, {{name}}! 🎉</h2>
    
    <p>We hope you have an amazing day! To celebrate, we''ve got a special birthday treat for you!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #FF6B9D 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; color: white;">
      <h2 style="margin: 0 0 10px 0; font-size: 32px;">FREE Coffee!</h2>
      <p style="margin: 0; font-size: 18px;">On us, birthday star! ⭐</p>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FFD93B; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        🎁 <strong>Valid today only!</strong> Show this email at the counter.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: #FF6B9D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Claim Your Birthday Treat 🎂
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Have a wonderful birthday from all of us at Penkey! 💕
    </p>
  </div>
</body>
</html>',
  '["name", "appUrl"]',
  'marketing',
  true
);

-- =============================================
-- 6. WIN-BACK EMAIL (NEW)
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
  'win_back_email',
  'Win-Back Email',
  'Sent to inactive users to re-engage them',
  'We Miss You, {{name}}! 💕',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3CA9E2 0%, #9C27B0 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">💕</h1>
    <h1 style="color: white; margin: 10px 0;">We Miss You!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Hey {{name}}! 👋</h2>
    
    <p>It''s been a while since we''ve seen you at Penkey! We''ve been missing your smile. ☕</p>
    
    <p>A lot has happened since your last visit:</p>
    <ul style="list-style: none; padding: 0;">
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        ✨ New rewards available
      </li>
      <li style="padding: 10px 0; border-bottom: 1px solid #ECEFF1;">
        🎮 Fun daily games to play
      </li>
      <li style="padding: 10px 0;">
        ☕ Your favorite coffee is waiting!
      </li>
    </ul>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #3CA9E2 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; color: white;">
      <h2 style="margin: 0 0 10px 0; font-size: 28px;">Welcome Back Bonus!</h2>
      <p style="margin: 0; font-size: 18px;">{{bonusBeans}} bonus beans waiting for you! 🎁</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: #3CA9E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Come Back & Claim Bonus 💕
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      We can''t wait to see you again! ☕
    </p>
  </div>
</body>
</html>',
  '["name", "bonusBeans", "appUrl"]',
  'marketing',
  true
);

-- =============================================
-- 7. MILESTONE EMAIL (NEW)
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
  'milestone_email',
  'Milestone Achievement Email',
  'Sent when user reaches a milestone',
  'You Hit {{milestone}} Beans! 🏆',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Achievement!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #FFD700 0%, #FF6B9D 100%); padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🏆</h1>
    <h1 style="color: white; margin: 10px 0;">Milestone Achieved!</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2 style="color: #2C3E50;">Incredible, {{name}}! 🎉</h2>
    
    <p>You''ve reached an amazing milestone!</p>
    
    <div style="background: linear-gradient(135deg, #FFD93B 0%, #FFD700 100%); padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; color: white;">
      <h2 style="margin: 0 0 10px 0; font-size: 48px;">{{milestone}} ☕</h2>
      <p style="margin: 0; font-size: 24px; font-weight: bold;">Lifetime Beans!</p>
    </div>
    
    <p>You''re officially a Penkey legend! Thank you for being such an amazing customer. 💕</p>
    
    <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2E7D32;">
        🎁 <strong>Milestone Bonus:</strong> {{bonusBeans}} extra beans added to your account!
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: #FFD700; color: #2C3E50; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View Your Progress 🏆
      </a>
    </div>
    
    <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin-top: 40px;">
      Keep up the amazing work! Next milestone: {{nextMilestone}} beans! 💪
    </p>
  </div>
</body>
</html>',
  '["name", "milestone", "bonusBeans", "nextMilestone", "appUrl"]',
  'notification',
  true
);

-- =============================================
-- VERIFICATION
-- =============================================

-- Count templates created
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.email_templates WHERE active = true;
  RAISE NOTICE '✅ Created % email templates successfully!', v_count;
  
  IF v_count < 7 THEN
    RAISE EXCEPTION 'Expected 7 email templates but only created %', v_count;
  END IF;
END $$;

-- Show summary
SELECT 
  name,
  display_name,
  category,
  array_length(string_to_array(variables::text, ','), 1) as variable_count
FROM public.email_templates
WHERE active = true
ORDER BY created_at;

-- Success message
SELECT '🎉 Email templates successfully migrated to database!' as message;
