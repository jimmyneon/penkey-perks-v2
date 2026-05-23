-- =============================================
-- FIX: Award Game Prize Pending Function
-- =============================================
-- Fixes table name from 'games' to 'mini_games'
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
  
  -- Get game name (FIXED: was public.games, now public.mini_games)
  SELECT display_name INTO v_game_name FROM public.mini_games WHERE id = p_game_id;
  
  -- Don't create pending reward for "nothing" prizes
  IF p_prize_type = 'nothing' THEN
    RETURN jsonb_build_object(
      'success', true,
      'pending', false,
      'message', 'Better luck next time!'
    );
  END IF;
  
  -- Create pending reward with game_play_id link
  INSERT INTO public.pending_rewards (
    user_id,
    reward_type,
    amount,
    reward_id,
    reward_name,
    reward_description,
    source,
    source_id,
    game_play_id,
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
    (SELECT id FROM public.game_plays WHERE user_id = p_user_id AND game_id = p_game_id ORDER BY created_at DESC LIMIT 1),
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
    'message', 'Prize pending! Check in at Penkey to claim it.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.award_game_prize_pending IS 'Awards game prize as pending reward (claimed on check-in) - FIXED';

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Fixed award_game_prize_pending function!' as message;
SELECT '🎮 Function now correctly references mini_games table' as status;
