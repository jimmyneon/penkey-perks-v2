-- =============================================
-- ADD EMAIL TEMPLATES - PART 5 (FINAL)
-- =============================================
-- Monthly Report & Win-Back Emails
-- =============================================

-- =============================================
-- 13. MONTHLY REPORT EMAIL
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
  'monthly_report',
  'Monthly Report',
  'Monthly activity summary',
  '📊 Your {{monthName}} Report',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Report</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">📊</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">{{monthName}} Report</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 📈</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Here''s your {{monthName}} activity summary:</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0;">
      <div style="margin: 0 0 16px 0; padding: 0 0 16px 0; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">☕ Stamps This Month</span>
          <span style="color: #FF8C42; font-size: 28px; font-weight: 700;">{{totalStampsMonth}}</span>
        </div>
      </div>
      <div style="margin: 0 0 16px 0; padding: 0 0 16px 0; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">🎁 Rewards Earned</span>
          <span style="color: #10B981; font-size: 28px; font-weight: 700;">{{rewardsEarnedMonth}}</span>
        </div>
      </div>
      <div style="margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6B7280;">🏅 Badges Earned</span>
          <span style="color: #8B5CF6; font-size: 28px; font-weight: 700;">{{badgesEarned}}</span>
        </div>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #8B5CF6;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Your Rank</p>
      <p style="margin: 0; font-size: 36px; color: #8B5CF6; font-weight: 700;">#{{rank}}</p>
      <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 14px;">Out of all members</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
        View Full Stats 📊
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Keep up the amazing work! 🌟
    </p>
  </div>
</body>
</html>',
  '["name", "monthName", "totalStampsMonth", "rewardsEarnedMonth", "badgesEarned", "rank", "appUrl"]'::jsonb,
  'digest',
  true
);

-- =============================================
-- 14. WIN-BACK EMAIL (30 days)
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
  'win_back_30',
  'Win Back (30 days)',
  'Sent after 30 days of inactivity',
  '💔 We Really Miss You!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">💔</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">We Really Miss You!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">{{name}}, come back! 😢</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">It''s been 30 days since your last visit. We miss seeing you at Penkey Deli!</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Last Visit:</p>
      <p style="margin: 0; color: #2C3E50; font-size: 18px; font-weight: 600;">{{lastVisit}}</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFE4CC 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #FF8C42;">
      <h3 style="margin: 0 0 12px 0; color: #2C3E50; font-size: 22px;">Special Offer Just for You!</h3>
      <p style="margin: 0; color: #FF8C42; font-size: 24px; font-weight: 700;">{{specialOffer}}</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Come back and we''ll give you a special welcome back bonus!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
        Come Back Now 💕
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      We can''t wait to see you again!
    </p>
  </div>
</body>
</html>',
  '["name", "lastVisit", "specialOffer", "appUrl"]'::jsonb,
  'reengagement',
  true
);

-- =============================================
-- 15. WIN-BACK EMAIL (60 days)
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
  'win_back_60',
  'Win Back (60 days)',
  'Sent after 60 days of inactivity with special offer',
  '🎁 Special Offer - We Want You Back!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #10B981 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎁</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">We Want You Back!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">{{name}}, we have a special offer for you! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">We''ve missed you at Penkey Deli. Come back and enjoy these exclusive bonuses:</p>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #D1FAE5 100%); padding: 30px; border-radius: 12px; margin: 20px 0; border: 2px solid #10B981;">
      <h3 style="margin: 0 0 16px 0; color: #2C3E50; text-align: center; font-size: 22px;">Welcome Back Package:</h3>
      <div style="margin: 0 0 12px 0; padding: 12px; background: white; border-radius: 6px;">
        <strong style="color: #FF8C42;">☕ {{bonusStamps}}</strong>
        <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 14px;">Bonus stamps on your return visit</p>
      </div>
      <div style="margin: 0; padding: 12px; background: white; border-radius: 6px;">
        <strong style="color: #10B981;">🎁 {{specialReward}}</strong>
        <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 14px;">Exclusive reward just for you</p>
      </div>
    </div>
    
    <div style="background: #FFF3CD; border-left: 4px solid #FF8C42; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        ⏰ <strong>Limited Time Offer</strong> - Valid for 7 days only!
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Claim Your Offer 🎁
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      We''re excited to welcome you back! 💕
    </p>
  </div>
</body>
</html>',
  '["name", "bonusStamps", "specialReward", "appUrl"]'::jsonb,
  'reengagement',
  true
);

-- Success message
SELECT '✅ Part 5: Added 3 final email templates (Monthly Report, Win-Back 30, Win-Back 60)' as message;
SELECT '✅ Total: 15 new email templates created!' as summary;
SELECT 'Next: Run the triggers migration to automate these emails' as next_step;
