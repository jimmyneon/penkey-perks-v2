-- =============================================
-- BIRTHDAY EMAIL SYSTEM
-- =============================================
-- Adds birthday tracking and birthday reward email
-- =============================================

-- =============================================
-- 1. ADD BIRTHDAY FIELD TO USERS
-- =============================================

-- Add birthday column if it doesn't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS birthday DATE;

-- Add index for birthday queries
CREATE INDEX IF NOT EXISTS idx_users_birthday ON public.users(birthday) WHERE birthday IS NOT NULL;

COMMENT ON COLUMN public.users.birthday IS 'User birthday (month and day only, year optional)';

-- =============================================
-- 2. BIRTHDAY EMAIL TEMPLATE
-- =============================================

INSERT INTO public.email_templates (
  name,
  description,
  subject,
  html_body,
  variables,
  category,
  active
) VALUES (
  'birthday_reward',
  'Sent on user birthday with special reward',
  '🎂 Happy Birthday {{name}}! Here''s Your Special Gift',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Helvetica Neue'', Arial, sans-serif; background: linear-gradient(135deg, #F5F1E8 0%, #FFE8D6 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #2C3E50; font-size: 42px; margin: 0 0 10px 0; font-weight: bold;">
        🎂 Happy Birthday!
      </h1>
      <p style="color: #FF8C42; font-size: 24px; margin: 0; font-weight: 600;">
        {{name}}
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 30px;">
      
      <!-- Birthday Message -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 60px; margin-bottom: 20px;">🎉🎈🎁</div>
        <h2 style="color: #2C3E50; font-size: 28px; margin: 0 0 15px 0;">
          It''s Your Special Day!
        </h2>
        <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0;">
          We''re so grateful to have you as part of the Penkey family. 
          To celebrate your birthday, we have a special gift just for you!
        </p>
      </div>

      <!-- Birthday Reward -->
      <div style="background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
        <div style="font-size: 48px; margin-bottom: 15px;">🎁</div>
        <h3 style="color: white; font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">
          Your Birthday Gift
        </h3>
        <p style="color: white; font-size: 18px; margin: 0 0 20px 0; opacity: 0.95;">
          Choose one of these special treats:
        </p>
        
        <!-- Reward Options -->
        <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 20px; margin-top: 20px;">
          <div style="color: white; font-size: 16px; line-height: 1.8; text-align: left;">
            🍰 <strong>Free Cake</strong> - Any cake from our selection<br>
            🥐 <strong>Free Bake</strong> - Any pastry or baked good<br>
            💰 <strong>£5 Off</strong> - Anything except drinks
          </div>
        </div>
        
        <p style="color: white; font-size: 14px; margin: 20px 0 0 0; opacity: 0.9;">
          Valid for 7 days from your birthday
        </p>
      </div>

      <!-- QR Code Section -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 15px 0;">
          Show this QR code when you visit:
        </p>
        <div style="background: #F5F1E8; border-radius: 15px; padding: 20px; display: inline-block;">
          <img src="{{qrCodeUrl}}" alt="Birthday Reward QR Code" style="width: 200px; height: 200px; display: block;">
        </div>
        <p style="color: #9CA3AF; font-size: 12px; margin: 15px 0 0 0;">
          QR Code: {{qrCode}}
        </p>
      </div>

      <!-- Stats -->
      <div style="background: #F5F1E8; border-radius: 15px; padding: 25px; margin-top: 30px;">
        <h4 style="color: #2C3E50; font-size: 18px; margin: 0 0 15px 0; text-align: center;">
          🎊 Your Penkey Journey
        </h4>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="color: #FF8C42; font-size: 28px; font-weight: bold;">{{totalStamps}}</div>
            <div style="color: #6B7280; font-size: 14px;">Stamps Collected</div>
          </div>
          <div>
            <div style="color: #FF8C42; font-size: 28px; font-weight: bold;">{{totalRewards}}</div>
            <div style="color: #6B7280; font-size: 14px;">Rewards Earned</div>
          </div>
          <div>
            <div style="color: #FF8C42; font-size: 28px; font-weight: bold;">{{badgeLevel}}</div>
            <div style="color: #6B7280; font-size: 14px;">Badge Level</div>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{appUrl}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);">
          View My Birthday Reward
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6B7280; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 10px 0;">
        Thank you for being part of our community! 🎉
      </p>
      <p style="margin: 0;">
        <a href="{{appUrl}}" style="color: #FF8C42; text-decoration: none;">Visit Penkey Perks</a>
      </p>
    </div>
  </div>
</body>
</html>',
  ARRAY['name', 'qrCodeUrl', 'qrCode', 'totalStamps', 'totalRewards', 'badgeLevel', 'appUrl'],
  'special',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- 3. BIRTHDAY REWARD IN REWARDS TABLE
-- =============================================

INSERT INTO public.rewards (
  name,
  description,
  type,
  value,
  points_cost,
  expiry_days,
  active
) VALUES (
  'Birthday Special',
  'Choose: Free Cake, Free Bake, or £5 off (excluding drinks)',
  'birthday_voucher',
  'Free Cake / Free Bake / £5 Off',
  0,
  7,  -- Valid for 7 days
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  value = EXCLUDED.value,
  expiry_days = EXCLUDED.expiry_days,
  updated_at = NOW();

-- =============================================
-- 4. CRON FUNCTION: Send Birthday Emails
-- =============================================

CREATE OR REPLACE FUNCTION public.send_birthday_emails()
RETURNS TABLE(emails_queued INTEGER) AS $$
DECLARE
  v_user RECORD;
  v_app_url TEXT;
  v_qr_code TEXT;
  v_qr_code_url TEXT;
  v_total_stamps INTEGER;
  v_total_rewards INTEGER;
  v_badge_level TEXT;
  v_reward_id UUID;
  v_user_reward_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Get birthday reward ID
  SELECT id INTO v_reward_id FROM public.rewards WHERE name = 'Birthday Special' LIMIT 1;
  
  -- Find users with birthdays today
  FOR v_user IN
    SELECT u.id, u.email, u.name, u.birthday
    FROM public.users u
    WHERE u.birthday IS NOT NULL
      AND EXTRACT(MONTH FROM u.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM u.birthday) = EXTRACT(DAY FROM CURRENT_DATE)
      -- Don't send if we already sent this year
      AND NOT EXISTS (
        SELECT 1 FROM public.email_logs el
        WHERE el.recipient_user_id = u.id
          AND el.template_id = (SELECT id FROM public.email_templates WHERE name = 'birthday_reward')
          AND el.sent_at > CURRENT_DATE - INTERVAL '360 days'  -- Within last year
      )
  LOOP
    -- Generate QR code
    v_qr_code := 'BDAY-' || SUBSTRING(MD5(v_user.id::TEXT || NOW()::TEXT), 1, 12);
    v_qr_code_url := v_app_url || '/api/qr/' || v_qr_code;
    
    -- Get user stats
    SELECT COUNT(*) INTO v_total_stamps
    FROM public.coffee_stamps
    WHERE user_id = v_user.id;
    
    SELECT COUNT(*) INTO v_total_rewards
    FROM public.user_rewards
    WHERE user_id = v_user.id;
    
    SELECT COALESCE(bt.name, 'Newbie') INTO v_badge_level
    FROM public.user_badges ub
    JOIN public.badge_tiers bt ON ub.tier = bt.tier
    WHERE ub.user_id = v_user.id
    ORDER BY bt.order_index DESC
    LIMIT 1;
    
    -- Create birthday reward voucher
    IF v_reward_id IS NOT NULL THEN
      INSERT INTO public.user_rewards (
        user_id,
        reward_id,
        qr_code,
        expires_at,
        status
      ) VALUES (
        v_user.id,
        v_reward_id,
        v_qr_code,
        CURRENT_DATE + INTERVAL '7 days',
        'active'
      )
      RETURNING id INTO v_user_reward_id;
    END IF;
    
    -- Check user preferences
    IF public.can_send_email(v_user.id, 'marketing') THEN
      -- Queue birthday email
      PERFORM public.queue_email_from_template(
        'birthday_reward',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'qrCodeUrl', v_qr_code_url,
          'qrCode', v_qr_code,
          'totalStamps', v_total_stamps,
          'totalRewards', v_total_rewards,
          'badgeLevel', v_badge_level,
          'appUrl', v_app_url
        )
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  emails_queued := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.send_birthday_emails IS 'Sends birthday reward emails to users with birthdays today';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.send_birthday_emails TO service_role;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Birthday email system created!' as message;
SELECT 'Users can now add birthdays to their profile' as feature1;
SELECT 'Birthday emails sent automatically via cron' as feature2;
SELECT 'Birthday reward: Free Cake/Bake or £5 off' as feature3;
