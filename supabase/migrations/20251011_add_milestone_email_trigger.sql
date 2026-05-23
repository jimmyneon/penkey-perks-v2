-- =============================================
-- ADD MILESTONE EMAIL TRIGGER (DATABASE-DRIVEN)
-- =============================================
-- This uses the existing milestones table to send emails dynamically
-- Works with the existing check_milestones() function
-- =============================================

-- =============================================
-- 1. ADD MILESTONE EMAIL TRIGGER TO DATABASE
-- =============================================

INSERT INTO public.email_triggers (
  name,
  description,
  template_id,
  event_type,
  table_name,
  conditions,
  delay_minutes,
  active
) VALUES (
  'milestone_reached',
  'Send email when user reaches a milestone (from milestones table)',
  (SELECT id FROM public.email_templates WHERE name = 'milestone_reached'),
  'insert',
  'user_milestones',
  '{}'::jsonb,
  0,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  template_id = EXCLUDED.template_id,
  active = EXCLUDED.active;

-- =============================================
-- 2. CREATE MILESTONE EMAIL TRIGGER FUNCTION
-- =============================================
-- This fires when a new row is inserted into user_milestones
-- (which happens via the existing check_milestones() function)

CREATE OR REPLACE FUNCTION public.trigger_milestone_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_milestone RECORD;
  v_app_url TEXT;
  v_milestone_display TEXT;
BEGIN
  -- Get user details
  SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
  
  -- Get milestone details from the milestones table
  SELECT * INTO v_milestone FROM public.milestones WHERE id = NEW.milestone_id;
  
  -- Get app URL
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- Build milestone display text based on type
  CASE v_milestone.requirement_type
    WHEN 'points' THEN
      v_milestone_display := v_milestone.requirement_value || ' Points';
    WHEN 'visits' THEN
      v_milestone_display := v_milestone.requirement_value || ' Visits';
    WHEN 'stamps' THEN
      v_milestone_display := v_milestone.requirement_value || ' Stamps';
    WHEN 'referrals' THEN
      v_milestone_display := v_milestone.requirement_value || ' Referrals';
    WHEN 'games_played' THEN
      v_milestone_display := v_milestone.requirement_value || ' Games';
    ELSE
      v_milestone_display := v_milestone.requirement_value::TEXT;
  END CASE;
  
  -- Queue milestone email
  PERFORM public.queue_email_from_template(
    'milestone_reached',
    v_user.email,
    v_user.id,
    jsonb_build_object(
      'name', v_user.name,
      'milestone', v_milestone_display,
      'milestoneName', v_milestone.name,
      'milestoneDescription', v_milestone.description,
      'appUrl', v_app_url
    ),
    0,
    (SELECT id FROM public.email_triggers WHERE name = 'milestone_reached')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. CREATE DATABASE TRIGGER
-- =============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS send_milestone_email ON public.user_milestones;

-- Create trigger for milestone emails
-- This fires whenever check_milestones() inserts a new achievement
CREATE TRIGGER send_milestone_email
  AFTER INSERT ON public.user_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_milestone_email();

-- =============================================
-- 4. AUTO-CHECK MILESTONES ON POINTS EARNED
-- =============================================
-- This automatically calls check_milestones() when user earns points

CREATE OR REPLACE FUNCTION public.auto_check_milestones_on_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check on positive point transactions
  IF NEW.amount > 0 THEN
    -- Call the existing check_milestones function
    PERFORM public.check_milestones(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_milestones_on_points ON public.points_transactions;

-- Create trigger on points_transactions
CREATE TRIGGER check_milestones_on_points
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  WHEN (NEW.amount > 0)
  EXECUTE FUNCTION public.auto_check_milestones_on_points();

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.trigger_milestone_email TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_check_milestones_on_points TO service_role;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Milestone email trigger created!' as message;
SELECT 'Milestones are now fully database-driven from the milestones table!' as note;
SELECT 'Emails will be sent for ANY milestone type: points, visits, stamps, referrals, games' as feature;
