-- =============================================
-- ADD CASCADE DELETE FROM AUTH.USERS
-- Date: 2025-10-15
-- =============================================
-- Issue: Deleting auth.users doesn't cascade to public.users
-- Solution: Create trigger to delete public.users when auth.users is deleted
-- =============================================

-- Create function to handle auth user deletion
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the public.users record
  -- This will cascade to all related tables (user_rewards, referrals, etc.)
  DELETE FROM public.users WHERE id = OLD.id;
  
  RAISE NOTICE 'Deleted public.users record for auth user %', OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users DELETE
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_delete();

COMMENT ON FUNCTION public.handle_auth_user_delete IS 'Cascades auth.users deletion to public.users and all related data';

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_deleted'
  ) THEN
    RAISE EXCEPTION 'Auth user delete trigger not created!';
  END IF;
  
  RAISE NOTICE '✅ Auth user cascade delete trigger created!';
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT '✅ Deleting auth.users will now cascade to public.users!' as message;
SELECT '⚠️ This will delete ALL user data (rewards, points, referrals, etc.)' as warning;
SELECT '💡 Use the /api/account/delete endpoint for safer deletion' as recommendation;
