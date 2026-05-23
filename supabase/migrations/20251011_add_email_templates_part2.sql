-- =============================================
-- ADD EMAIL TEMPLATES - PART 2
-- =============================================
-- Game & Achievement Emails
-- =============================================

-- =============================================
-- 4. BIG WIN EMAIL
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
  'big_win',
  'Big Win',
  'Sent when user wins a big prize from a game',
  '🎉 Big Win!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Big Win!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎉</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Big Win!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Congratulations, {{name}}! 🎊</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You just won big playing {{gameName}}!</p>
    
    <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #10B981;">
      <h2 style="margin: 0 0 8px 0; font-size: 48px; color: #2C3E50;">{{prizeWon}}</h2>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #059669;">Amazing Prize!</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Your Total Stamps:</p>
      <p style="margin: 0; font-size: 36px; color: #FF8C42; font-weight: 700;">{{totalStamps}}</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Keep playing to win even more prizes!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/games" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
        Play Again 🎮
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      You''re on a roll! 🔥
    </p>
  </div>
</body>
</html>',
  '["name", "gameName", "prizeWon", "totalStamps", "appUrl"]'::jsonb,
  'achievement',
  true
);

-- =============================================
-- 5. GAME AVAILABLE EMAIL
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
  'game_available',
  'Game Available',
  'Daily reminder to play bonus games',
  '🎮 Your Daily Games Are Ready!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Games Available!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🎮</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">Games Are Ready!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Hi {{name}}! 👋</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">Don''t forget - you have bonus games waiting for you!</p>
    
    <div style="background: #F5F1E8; padding: 24px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; color: #2C3E50; font-size: 18px;">Available Games:</h3>
      <p style="margin: 0; color: #FF8C42; font-size: 20px; font-weight: 600;">{{gamesAvailable}}</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #FFF9F0 0%, #FFFEF7 100%); border-left: 4px solid #FF8C42; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; color: #2C3E50; font-weight: 600;">🎁 Win Prizes:</p>
      <p style="margin: 8px 0 0 0; color: #3D4F5C; font-size: 14px;">Extra stamps, instant rewards, and more!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/games" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FFB380 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 140, 66, 0.3);">
        Play Now 🎮
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Games reset daily - don''t miss out!
    </p>
  </div>
</body>
</html>',
  '["name", "gamesAvailable", "appUrl"]'::jsonb,
  'reminder',
  true
);

-- =============================================
-- 6. STAMP STREAK EMAIL
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
  'stamp_streak',
  'Stamp Streak',
  'Sent when user has a check-in streak',
  '🔥 {{streakDays}} Day Streak!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Streak!</title>
</head>
<body style="font-family: ''Inter'', ''Segoe UI'', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F5F1E8;">
  <div style="background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; font-size: 48px; margin: 0;">🔥</h1>
    <h1 style="color: white; margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">You''re On Fire!</h1>
  </div>
  
  <div style="background: white; padding: 30px 20px; margin: 0;">
    <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 16px 0;">Amazing, {{name}}! 🎉</h2>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 0 0 20px 0;">You''ve checked in {{streakDays}} days in a row!</p>
    
    <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #EF4444;">
      <h2 style="margin: 0 0 8px 0; font-size: 56px; color: #2C3E50;">{{streakDays}}</h2>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #DC2626;">Day Streak!</p>
    </div>
    
    <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #2C3E50; font-weight: 600;">🎁 Bonus Reward:</p>
      <p style="margin: 0; color: #FF8C42; font-size: 18px; font-weight: 600;">{{bonusReward}}</p>
    </div>
    
    <p style="color: #3D4F5C; font-size: 16px; margin: 20px 0;">Keep your streak alive - check in tomorrow!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #F87171 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
        Keep It Going! 🔥
      </a>
    </div>
    
    <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      You''re unstoppable! 💪
    </p>
  </div>
</body>
</html>',
  '["name", "streakDays", "bonusReward", "appUrl"]'::jsonb,
  'achievement',
  true
);

-- Success message
SELECT '✅ Part 2: Added 3 email templates (Big Win, Game Available, Streak)' as message;
