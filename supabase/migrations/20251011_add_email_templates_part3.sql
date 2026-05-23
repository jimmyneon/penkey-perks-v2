-- =============================================
-- ADD EMAIL TEMPLATES - PART 3
-- =============================================
-- Time-Based & Engagement Emails
-- =============================================

-- =============================================
-- 7. ANNIVERSARY EMAIL
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
  'anniversary',
  'Anniversary',
  'Sent on user''s signup anniversary',
  '🎂 Happy {{years}} Year Anniversary!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anniversary!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FFB380 0%, #FF8C42 50%, #10B981 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎂</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Happy Anniversary!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">{{name}}, you''ve been with us for {{years}} year{{yearsPlural}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Thank you for being an amazing part of the Penkey Perks family!</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 30px; border-radius: 12px; margin: 20px 0; border: 2px solid #FF8C42;">
      <h3 style="margin: 0 0 16px 0; color: #2C3E50; text-align: center;">Your Journey:</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;">
        <div>
          <p style="margin: 0; font-size: 32px; color: #FF8C42; font-weight: 700;">{{totalStamps}}</p>
          <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 14px;">Total Stamps</p>
        </div>
        <div>
          <p style="margin: 0; font-size: 32px; color: #10B981; font-weight: 700;">{{totalRewards}}</p>
          <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 14px;">Rewards Earned</p>
        </div>
      </div>
    </div>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #2C3E50; font-weight: 600;">🎁 Anniversary Gift:</p>
      <p style="margin: 0; color: #FF8C42; font-size: 20px; font-weight: 600;">{{anniversaryGift}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Claim Your Gift 🎁
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Here''s to many more years together! 🥂
    </p>
  </div>
</body>
</html>',
  '["name", "years", "yearsPlural", "totalStamps", "totalRewards", "anniversaryGift", "appUrl"]'::jsonb,
  'special',
  true
);

-- =============================================
-- 8. WEEKLY SUMMARY EMAIL
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
  'weekly_summary',
  'Weekly Summary',
  'Weekly activity digest',
  '📊 Your Week at Penkey Perks',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Summary</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">📊</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Your Weekly Summary</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 👋</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Here''s what you accomplished this week:</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0;">
      <div style="margin: 0 0 16px 0; padding: 0 0 16px 0; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">☕ Stamps Earned</span>
          <span style="color: #FF8C42; font-size: 24px; font-weight: 700;">{{stampsThisWeek}}</span>
        </div>
      </div>
      <div style="margin: 0 0 16px 0; padding: 0 0 16px 0; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">🎮 Games Played</span>
          <span style="color: #10B981; font-size: 24px; font-weight: 700;">{{gamesPlayed}}</span>
        </div>
      </div>
      <div style="margin: 0 0 16px 0; padding: 0 0 16px 0; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">🎁 Rewards Earned</span>
          <span style="color: #EF4444; font-size: 24px; font-weight: 700;">{{rewardsEarned}}</span>
        </div>
      </div>
      <div style="margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">👥 Referrals</span>
          <span style="color: #8B5CF6; font-size: 24px; font-weight: 700;">{{referralsConfirmed}}</span>
        </div>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Total Stamps</p>
      <p style="margin: 0; font-size: 36px; color: #FF8C42; font-weight: 700;">{{totalStamps}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        View Dashboard 📊
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Keep up the great work! 💪
    </p>
  </div>
</body>
</html>',
  '["name", "stampsThisWeek", "gamesPlayed", "rewardsEarned", "referralsConfirmed", "totalStamps", "appUrl"]'::jsonb,
  'digest',
  true
);

-- =============================================
-- 9. NEW REWARD AVAILABLE EMAIL
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
  'new_reward_available',
  'New Reward Available',
  'Sent when a new reward is added',
  '✨ New Reward: {{rewardName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reward!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">✨</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">New Reward Available!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Exciting news, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">We just added a brand new reward to our catalog!</p>
    
    <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #8B5CF6;">
      <h2 style="margin: 0 0 8px 0; font-size: 28px; color: #2C3E50;">{{rewardName}}</h2>
      <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 16px;">{{rewardDescription}}</p>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #8B5CF6;">{{rewardValue}}</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #2C3E50; font-weight: 600;">Stamps Required:</p>
      <p style="margin: 0; color: #FF8C42; font-size: 24px; font-weight: 700;">{{stampsRequired}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/rewards" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
        View Rewards ✨
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Start earning stamps to unlock this reward!
    </p>
  </div>
</body>
</html>',
  '["name", "rewardName", "rewardDescription", "rewardValue", "stampsRequired", "appUrl"]'::jsonb,
  'announcement',
  true
);

-- Success message
SELECT '✅ Part 3: Added 3 email templates (Anniversary, Weekly Summary, New Reward)' as message;
