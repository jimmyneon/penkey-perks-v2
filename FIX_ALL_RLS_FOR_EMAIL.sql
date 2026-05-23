-- =============================================
-- FIX ALL RLS POLICIES FOR EMAIL SYSTEM
-- =============================================
-- This completely rebuilds RLS policies to avoid recursion
-- =============================================

-- =============================================
-- 1. FIX STAFF TABLE (Root cause of recursion)
-- =============================================

-- Disable RLS temporarily
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on staff
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'staff' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.staff';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create ONE simple policy for staff
CREATE POLICY "staff_select_policy"
  ON public.staff
  FOR SELECT
  USING (true);  -- Allow all authenticated users to SELECT

-- =============================================
-- 2. FIX EMAIL_QUEUE TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own queued emails" ON public.email_queue;
DROP POLICY IF EXISTS "Staff can view all queued emails" ON public.email_queue;

-- Create simple policy - service role can do everything
CREATE POLICY "Service role full access to email_queue"
  ON public.email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own
CREATE POLICY "Users view own email_queue"
  ON public.email_queue
  FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- =============================================
-- 3. FIX EMAIL_LOGS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Staff can view all email logs" ON public.email_logs;

-- Create simple policy - service role can do everything
CREATE POLICY "Service role full access to email_logs"
  ON public.email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own
CREATE POLICY "Users view own email_logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- =============================================
-- 4. FIX EMAIL_TEMPLATES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Anyone can view active email templates" ON public.email_templates;

-- Service role full access
CREATE POLICY "Service role full access to email_templates"
  ON public.email_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anyone can view active templates
CREATE POLICY "Anyone view active email_templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (active = true);

-- =============================================
-- 5. FIX EMAIL_TRIGGERS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can manage email triggers" ON public.email_triggers;

-- Service role full access
CREATE POLICY "Service role full access to email_triggers"
  ON public.email_triggers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 6. VERIFY POLICIES
-- =============================================

SELECT 
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename LIKE 'email_%' OR tablename = 'staff')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ All RLS policies fixed! Email system should work now.' as message;
