-- Enable real-time for bean_balances table
-- Allow authenticated users to subscribe to their own bean balance changes

-- Enable real-time on the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bean_balances;

-- Create RLS policy for real-time subscriptions
-- Users can only subscribe to their own bean balance
DROP POLICY IF EXISTS "Users can view own bean balance in real-time" ON public.bean_balances;

CREATE POLICY "Users can view own bean balance in real-time"
ON public.bean_balances
FOR SELECT
USING (auth.uid() = user_id);
