-- Enable real-time for bean_transactions table
-- This allows the frontend to receive transaction descriptions for bean notifications

-- Enable real-time on the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bean_transactions;

-- Create RLS policy for real-time subscriptions
-- Users can only subscribe to their own bean transactions
DROP POLICY IF EXISTS "Users can view own bean transactions in real-time" ON public.bean_transactions;

CREATE POLICY "Users can view own bean transactions in real-time"
ON public.bean_transactions
FOR SELECT
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own bean transactions in real-time" ON public.bean_transactions IS 'Allows users to subscribe to their own bean transaction changes via realtime';
