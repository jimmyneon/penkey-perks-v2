-- Fix the reset_coffee_stamps_on_redeem trigger
-- The trigger is using wrong column name: 'points' instead of 'amount'

CREATE OR REPLACE FUNCTION public.reset_coffee_stamps_on_redeem()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only reset if it's a Free Coffee reward being redeemed
  IF NEW.status = 'redeemed' AND OLD.status = 'active' THEN
    -- Check if this is a Free Coffee reward
    IF EXISTS (
      SELECT 1 FROM public.rewards 
      WHERE id = NEW.reward_id AND name = 'Free Coffee'
    ) THEN
      -- Delete 10 oldest stamps for this user
      DELETE FROM public.coffee_stamps
      WHERE id IN (
        SELECT id FROM public.coffee_stamps
        WHERE user_id = NEW.user_id
        ORDER BY created_at ASC
        LIMIT 10
      );
      
      -- FIXED: Use 'amount' instead of 'points', and remove balance_after
      -- Add 10 points for redeeming free coffee
      PERFORM public.add_points(
        NEW.user_id,
        10,
        'reward_redemption',
        'Redeemed Free Coffee (+10 bonus points)',
        jsonb_build_object('reward_id', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
