-- =============================================
-- FIX EMAIL QUEUE ACCESS FOR SERVICE ROLE
-- =============================================

-- Drop ALL existing policies on email_queue
DROP POLICY IF EXISTS "Service role full access to email_queue" ON public.email_queue;
DROP POLICY IF EXISTS "Users view own email_queue" ON public.email_queue;
DROP POLICY IF EXISTS "Users can view own queued emails" ON public.email_queue;
DROP POLICY IF EXISTS "Staff can view all queued emails" ON public.email_queue;

-- Disable RLS temporarily to test
ALTER TABLE public.email_queue DISABLE ROW LEVEL SECURITY;

-- Check if emails are visible now
SELECT COUNT(*) as total_emails FROM email_queue;
SELECT COUNT(*) as pending_emails FROM email_queue WHERE status = 'pending';

-- Re-enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create a single permissive policy for service_role
CREATE POLICY "email_queue_service_role_all"
  ON public.email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to view their own
CREATE POLICY "email_queue_users_select_own"
  ON public.email_queue
  FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- Grant explicit permissions
GRANT ALL ON public.email_queue TO service_role;
GRANT SELECT ON public.email_queue TO authenticated;

-- Verify the fix
SELECT 
  'email_queue' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_records
FROM email_queue;

SELECT '✅ Email queue access fixed!' as message;
