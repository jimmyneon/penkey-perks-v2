-- =============================================
-- ADD EMAIL TEMPLATES - PART 4
-- =============================================
-- Referral & Re-engagement Emails
-- =============================================

-- =============================================
-- 10. REFERRAL MILESTONE EMAIL
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
  'referral_milestone',
  'Referral Milestone',
  'Sent when user reaches referral milestones (5, 10, 25, 50)',
  '🎯 {{totalReferrals}} Referrals!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Milestone!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #10B981 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎯</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Referral Milestone!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Incredible, {{name}}! 🌟</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You''ve referred {{totalReferrals}} friends to Penkey Perks!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #D1FAE5 100%); padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #10B981;">
      <h2 style="margin: 0 0 8px 0; font-size: 56px; color: #2C3E50;">{{totalReferrals}}</h2>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #059669;">Confirmed Referrals!</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #2C3E50; font-weight: 600;">🎁 Bonus Reward:</p>
      <p style="margin: 0; color: #FF8C42; font-size: 24px; font-weight: 700;">{{bonusReward}}</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Thank you for spreading the word! Keep sharing to earn even more rewards.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/referrals" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Share Your Link 👥
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      You''re an amazing ambassador! 🙌
    </p>
  </div>
</body>
</html>',
  '["name", "totalReferrals", "bonusReward", "appUrl"]'::jsonb,
  'achievement',
  true
);

-- =============================================
-- 11. WEEKEND SPECIAL EMAIL
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
  'weekend_special',
  'Weekend Special',
  'Sent every Friday to active users',
  '🌟 Weekend Special at Penkey!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekend Special!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🌟</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Weekend Special!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Happy Weekend, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">This weekend at Penkey Deli, enjoy special weekend bonuses!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 30px; border-radius: 12px; margin: 20px 0; border: 2px solid #FF8C42;">
      <h3 style="margin: 0 0 16px 0; color: #2C3E50; text-align: center; font-size: 22px;">Weekend Bonus:</h3>
      <p style="margin: 0; text-align: center; color: #FF8C42; font-size: 24px; font-weight: 700;">{{weekendBonus}}</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Your Current Stamps:</p>
      <p style="margin: 0; color: #2C3E50; font-size: 28px; font-weight: 700;">{{currentStamps}} / 10</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Visit us this weekend and make the most of your bonus!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Check In Now ☕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      See you this weekend! 🌞
    </p>
  </div>
</body>
</html>',
  '["name", "weekendBonus", "currentStamps", "appUrl"]'::jsonb,
  'marketing',
  true
);

-- =============================================
-- 12. REWARD EXPIRED EMAIL
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
  'reward_expired',
  'Reward Expired',
  'Sent when a reward expires unused',
  '😢 Your {{rewardName}} Expired',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reward Expired</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">😢</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Reward Expired</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}},</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Unfortunately, your reward has expired:</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #9CA3AF;">
      <h3 style="margin: 0 0 8px 0; color: #2C3E50; font-size: 20px;">{{rewardName}}</h3>
      <p style="margin: 0; color: #6B7280; font-size: 14px;">Expired on {{expiredDate}}</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFFEF7 100%); border-left: 4px solid #FF8C42; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; color: #2C3E50; font-weight: 600;">💡 Next Time:</p>
      <p style="margin: 8px 0 0 0; color: #3D4F5C; font-size: 14px;">Make sure to redeem your rewards before they expire. We send reminders 3 days before expiry!</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Don''t worry - keep earning stamps to unlock more rewards!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Earn More Rewards ☕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      We''ll see you soon!
    </p>
  </div>
</body>
</html>',
  '["name", "rewardName", "expiredDate", "appUrl"]'::jsonb,
  'notification',
  true
);

-- Success message
SELECT '✅ Part 4: Added 3 email templates (Referral Milestone, Weekend Special, Reward Expired)' as message;
