-- =============================================
-- UPDATE EMAIL TEMPLATES - MATCH DASHBOARD BRANDING
-- =============================================
-- Updates all email templates to match the Penkey Perks dashboard
-- Colors: Penkey Orange (#FF8C42), Penkey Dark (#2C3E50), Penkey Cream (#F5F1E8)
-- =============================================

-- Update Welcome Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Penkey Perks!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🦆</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Welcome to Penkey Perks!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 👋</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Welcome to the flock! We''re excited to have you join Penkey Perks.</p>
    
    <h3 style="color: #FF8C42; font-size: 20px; margin: 24px 0 16px 0;">Here''s how it works:</h3>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFFEF7 100%); border-left: 4px solid #FF8C42; padding: 20px; margin: 0 0 16px 0; border-radius: 8px;">
      <div style="margin: 0 0 12px 0;">
        <strong style="color: #FF8C42; font-size: 16px;">☕ Earn Stamps:</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">Check in daily to earn stamps - 10 stamps = Free Coffee!</p>
      </div>
      <div style="margin: 0 0 12px 0;">
        <strong style="color: #FF8C42; font-size: 16px;">🎮 Play Games:</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">After check-in, play bonus games for extra prizes</p>
      </div>
      <div style="margin: 0 0 12px 0;">
        <strong style="color: #FF8C42; font-size: 16px;">🎁 Get Rewards:</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">Redeem stamps and points for free treats</p>
      </div>
      <div style="margin: 0;">
        <strong style="color: #FF8C42; font-size: 16px;">👥 Refer Friends:</strong>
        <p style="color: #3D4F5C; margin: 4px 0 0 0;">Share your link and earn bonus points</p>
      </div>
    </div>
    
    <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #2C3E50; font-weight: 600;">Your Referral Link:</p>
      <a href="{{referralUrl}}" style="color: #FF8C42; word-break: break-all; text-decoration: none; font-weight: 500;">{{referralUrl}}</a>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Get Started 🦆
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Questions? Visit us at Penkey Deli or reply to this email.
    </p>
  </div>
</body>
</html>'
WHERE name = 'welcome_email';

-- Update Reward Earned Email
UPDATE public.email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Earned a Reward!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎁</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Congratulations!</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Great news, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You''ve earned a new reward!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <h2 style="margin: 0 0 8px 0; font-size: 28px; color: #2C3E50;">{{rewardName}}</h2>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #FF8C42;">{{rewardValue}}</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 16px 0; font-weight: 600; color: #2C3E50;">Your QR Code:</p>
      <img src="{{qrCodeUrl}}" alt="QR Code" style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #6B7280;">Show this QR code at Penkey to redeem</p>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FF8C42; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        ⏰ <strong>Expires in {{expiryDays}} days</strong> - Don''t forget to use it!
      </p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Visit Penkey Deli to redeem your reward!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        View My Rewards 🎁
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Keep earning stamps to unlock more rewards!
    </p>
  </div>
</body>
</html>'
WHERE name = 'reward_earned';

-- Success message
SELECT '✅ Email templates updated with Penkey Perks branding!' as message;
SELECT 'Updated 2 templates - run more updates for remaining templates' as note;
