-- =============================================
-- FIX REWARDS TRIGGER - duck_threshold → points_cost
-- =============================================
-- The email trigger still references duck_threshold which was renamed to points_cost

DROP TRIGGER IF EXISTS send_new_reward_email ON public.rewards;
DROP FUNCTION IF EXISTS public.trigger_new_reward_email();

CREATE OR REPLACE FUNCTION public.trigger_new_reward_email()
RETURNS TRIGGER AS $$
DECLARE
  v_app_url TEXT;
  v_user RECORD;
BEGIN
  -- Get app URL from settings
  SELECT value INTO v_app_url FROM public.app_settings WHERE key = 'app_url';
  IF v_app_url IS NULL THEN
    v_app_url := 'https://penkey-perks.vercel.app';
  END IF;
  
  -- Only send if reward is active
  IF NEW.active THEN
    -- Send to all active users
    FOR v_user IN SELECT * FROM public.users LOOP
      PERFORM public.queue_email_from_template(
        'new_reward_available',
        v_user.email,
        v_user.id,
        jsonb_build_object(
          'name', v_user.name,
          'rewardName', NEW.name,
          'rewardDescription', COALESCE(NEW.description, 'A new reward is available!'),
          'rewardValue', NEW.value,
          'stampsRequired', COALESCE(NEW.points_cost, 0), -- Fixed: use points_cost instead of duck_threshold
          'appUrl', v_app_url
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER send_new_reward_email
  AFTER INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_reward_email();

-- Success message
SELECT 'Rewards trigger fixed to use points_cost!' as message;
