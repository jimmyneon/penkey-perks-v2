-- =============================================
-- UPDATE REMAINING EMAIL TEMPLATES - PENKEY BRANDING
-- =============================================
-- Part 2: Updates remaining 5 email templates
-- =============================================

-- Update Reward Expiring Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reward Expiring Soon!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">⏰</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Reward Expiring Soon!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 👋</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Just a friendly reminder that one of your rewards is expiring soon!</p>
    
    <div style="background: #FFF3CD; border: 2px solid #EF4444; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 8px 0; color: #2C3E50; font-size: 22px;">{{rewardName}}</h3>
      <p style="margin: 0; font-size: 18px; color: #DC2626; font-weight: 600;">
        Expires in {{daysLeft}} day{{daysLeftPlural}}!
      </p>
    </div>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 16px 0; font-weight: 600; color: #2C3E50;">Your QR Code:</p>
      <img src="{{qrCodeUrl}}" alt="QR Code" style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Don''t let it go to waste! Visit Penkey Deli and redeem your reward before it expires.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
        Redeem Now 🎁
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      See you soon at Penkey Deli!
    </p>
  </div>
</body>
</html>'
WHERE name = 'reward_expiring';

-- Update Referral Confirmed Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Confirmed!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #10B981 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎉</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Referral Confirmed!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Awesome, {{name}}! 🎯</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Your friend <strong style="color: #FF8C42;">{{refereeName}}</strong> just completed their first check-in!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #D1FAE5 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #10B981;">
      <h2 style="margin: 0; color: #2C3E50; font-size: 42px; font-weight: 700;">+{{pointsEarned}} Points</h2>
      <p style="margin: 8px 0 0 0; color: #059669; font-size: 18px; font-weight: 600;">Bonus Points Added!</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Keep sharing your referral link to earn even more points!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/referrals" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Share Your Link 👥
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Thanks for spreading the word about Penkey Perks!
    </p>
  </div>
</body>
</html>'
WHERE name = 'referral_confirmed';

-- Update Reward Redeemed Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reward Redeemed!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">✅</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Enjoy Your Reward!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 😊</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Your reward has been successfully redeemed!</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #10B981;">
      <h3 style="margin: 0 0 8px 0; color: #2C3E50; font-size: 22px;">{{rewardName}}</h3>
      <p style="margin: 0; color: #6B7280; font-size: 14px;">Redeemed on {{redeemedAt}}</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">We hope you enjoyed your treat! Keep earning stamps for more rewards.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Check In Again ☕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      See you again soon at Penkey Deli! 💕
    </p>
  </div>
</body>
</html>'
WHERE name = 'reward_redeemed';

-- Update Inactive User Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🦆</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">We Miss You!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 👋</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">It''s been a while since we''ve seen you at Penkey Deli!</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <p style="margin: 0 0 8px 0; font-size: 16px; color: #6B7280; font-weight: 500;">Your Current Balance:</p>
      <p style="margin: 0; font-size: 36px; color: #FF8C42; font-weight: 700;">{{pointsBalance}} Points</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Come visit us and earn more stamps! We have delicious treats waiting for you.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Check In Now ☕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      See you soon! 💕
    </p>
  </div>
</body>
</html>'
WHERE name = 'inactive_user';

-- Update Milestone Reached Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Reached!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FFB380 0%, #FF8C42 50%, #10B981 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎊</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Milestone Reached!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Congratulations, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You''ve reached an amazing milestone!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <h2 style="margin: 0; color: #2C3E50; font-size: 48px; font-weight: 700;">{{milestone}} Points</h2>
      <p style="margin: 8px 0 0 0; color: #FF8C42; font-size: 18px; font-weight: 600;">Total Points Earned!</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">You''re doing amazing! Keep earning stamps to unlock even more rewards.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        View Rewards 🎁
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Thanks for being an amazing customer! 💕
    </p>
  </div>
</body>
</html>'
WHERE name = 'milestone_reached';

-- Success message
SELECT '✅ All 7 email templates updated with Penkey Perks branding!' as message;
SELECT 'Colors match dashboard: Penkey Orange (#FF8C42), Penkey Dark (#2C3E50), Penkey Cream (#F5F1E8)' as details;
