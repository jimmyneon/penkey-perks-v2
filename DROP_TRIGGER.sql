-- =============================================
-- DROP THE BROKEN TRIGGER
-- =============================================

-- Find and drop all triggers using trigger_check_rewards
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname, relname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE tgname LIKE '%check_rewards%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', r.tgname, r.relname);
    RAISE NOTICE 'Dropped trigger % on table %', r.tgname, r.relname;
  END LOOP;
END $$;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.trigger_check_rewards() CASCADE;

-- Drop the broken function it was calling
DROP FUNCTION IF EXISTS public.check_and_issue_rewards(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_and_issue_rewards() CASCADE;

-- Verify they're gone
SELECT 'SUCCESS: All broken triggers and functions removed!' as status;
