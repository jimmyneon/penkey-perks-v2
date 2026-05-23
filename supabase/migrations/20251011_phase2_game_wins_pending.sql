-- =============================================
-- PHASE 2: GAME WINS PENDING SYSTEM
-- =============================================
-- Makes all game prizes pending until user checks in
-- =============================================

-- =============================================
-- 1. FUNCTION: Award Game Prize as Pending
-- =============================================

CREATE OR REPLACE FUNCTION public.award_game_prize_pending(
  p_user_id UUID,
  p_game_id UUID,
  p_prize_type TEXT,
  p_prize_value INTEGER,
  p_prize_label TEXT,
  p_reward_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_app_url TEXT;
  v_pending_id UUID;
  v_game_name TEXT;
BEGIN
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Get game name
  SELECT display_name INTO v_game_name FROM public.mini_games WHERE id = p_game_id;
  
  -- Don't create pending reward for "nothing" prizes
  IF p_prize_type = 'nothing' THEN
    RETURN jsonb_build_object(
      'success', true,
      'pending', false,
      'message', 'Better luck next time!'
    );
  END IF;
  
  -- Create pending reward
  INSERT INTO public.pending_rewards (
    user_id,
    reward_type,
    amount,
    reward_id,
    reward_name,
    reward_description,
    source,
    source_id,
    metadata
  ) VALUES (
    p_user_id,
    CASE 
      WHEN p_prize_type = 'points' THEN 'points'
      WHEN p_prize_type = 'stamps' THEN 'stamps'
      WHEN p_prize_type = 'reward' THEN 'voucher'
      ELSE 'custom'
    END,
    p_prize_value,
    p_reward_id,
    p_prize_label || ' from ' || COALESCE(v_game_name, 'Game'),
    'Check in at Penkey to claim your prize!',
    'game_win',
    p_game_id,
    jsonb_build_object(
      'game_id', p_game_id,
      'game_name', v_game_name,
      'prize_type', p_prize_type,
      'prize_label', p_prize_label
    )
  )
  RETURNING id INTO v_pending_id;
  
  -- Update user's pending count
  UPDATE public.users
  SET pending_rewards_count = pending_rewards_count + 1,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Send email notification
  IF public.can_send_email(p_user_id, 'achievement') THEN
    PERFORM public.queue_email_from_template(
      'game_win_pending',
      (SELECT email FROM public.users WHERE id = p_user_id),
      p_user_id,
      jsonb_build_object(
        'name', (SELECT name FROM public.users WHERE id = p_user_id),
        'gameName', v_game_name,
        'prizeWon', p_prize_label,
        'prizeType', p_prize_type,
        'prizeValue', p_prize_value,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'pending', true,
    'pending_id', v_pending_id,
    'message', 'Prize pending! Check in at Penkey to claim.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.award_game_prize_pending IS 'Awards game prize as pending reward (claimed on check-in)';

-- =============================================
-- 2. EMAIL TEMPLATE: Game Win Pending
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
  'game_win_pending',
  'Game Win (Pending)',
  'Sent when user wins a game - prize is pending',
  '🎉 You Won {{prizeWon}}! Check In to Claim',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Helvetica Neue'', Arial, sans-serif; background: linear-gradient(135deg, #F5F1E8 0%, #FFE8D6 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 80px; margin-bottom: 10px;">🎉</div>
      <h1 style="color: #2C3E50; font-size: 36px; margin: 0 0 10px 0;">
        Congratulations!
      </h1>
      <p style="color: #FF8C42; font-size: 24px; font-weight: bold; margin: 0;">
        You Won {{prizeWon}}!
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 30px;">
      
      <p style="color: #2C3E50; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">
        Hi {{name}},
      </p>
      
      <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! You just won <strong>{{prizeWon}}</strong> playing {{gameName}}! 🎮
      </p>

      <!-- Prize Display -->
      <div style="background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
        <div style="font-size: 60px; margin-bottom: 15px;">
          {{#if (eq prizeType ''points'')}}💰{{/if}}
          {{#if (eq prizeType ''stamps'')}}☕{{/if}}
          {{#if (eq prizeType ''reward'')}}🎁{{/if}}
        </div>
        <h3 style="color: white; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">
          {{prizeWon}}
        </h3>
        <p style="color: white; font-size: 16px; margin: 0; opacity: 0.95;">
          From {{gameName}}
        </p>
      </div>

      <!-- How to Claim -->
      <div style="background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 10px; padding: 20px; margin: 30px 0;">
        <h4 style="color: #92400E; font-size: 18px; margin: 0 0 15px 0; text-align: center;">
          🎯 How to Claim Your Prize
        </h4>
        <ol style="color: #92400E; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Visit Penkey Deli</li>
          <li>Open the Penkey Perks app</li>
          <li>Tap "Check In"</li>
          <li>Your prize will be claimed automatically! 🎉</li>
        </ol>
      </div>

      <!-- Urgency -->
      <div style="background: #EFF6FF; border-radius: 10px; padding: 15px; text-align: center; margin: 20px 0;">
        <p style="color: #1E40AF; font-size: 14px; margin: 0;">
          ⏰ Your prize is waiting! Check in within 14 days to claim it.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{appUrl}}/check-in" style="display: inline-block; background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);">
          Check In to Claim Prize! 🎁
        </a>
      </div>
    </div>

    <!-- Play More Games -->
    <div style="background: white; border-radius: 15px; padding: 20px; text-align: center; margin-bottom: 30px;">
      <p style="color: #6B7280; font-size: 14px; margin: 0 0 15px 0;">
        Want to win more prizes?
      </p>
      <a href="{{appUrl}}/games" style="display: inline-block; background: #2C3E50; color: white; text-decoration: none; padding: 12px 30px; border-radius: 20px; font-weight: 600; font-size: 14px;">
        Play More Games
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6B7280; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 10px 0;">
        See you soon at Penkey! 🎮
      </p>
      <p style="margin: 0;">
        <a href="{{appUrl}}" style="color: #FF8C42; text-decoration: none;">Open Penkey Perks</a>
      </p>
    </div>
  </div>
</body>
</html>',
  '["name", "gameName", "prizeWon", "prizeType", "prizeValue", "appUrl"]'::jsonb,
  'achievement',
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- 3. GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.award_game_prize_pending TO service_role;
GRANT EXECUTE ON FUNCTION public.award_game_prize_pending TO authenticated;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Phase 2: Game wins now pending!' as message;
SELECT 'Players must check in to claim prizes' as feature1;
SELECT 'Email sent when game is won' as feature2;
SELECT 'Prizes claimed automatically on check-in' as feature3;
