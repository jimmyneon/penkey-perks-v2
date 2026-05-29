-- Fix infinite recursion in staff_roles policy
-- The original policy caused recursion by checking staff_roles while being on staff_roles
-- This migration drops the old policy and creates a new one that uses a different approach

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can manage staff roles" ON public.staff_roles;

-- Create a new policy that avoids recursion by using auth.uid() directly
-- Service role will handle admin checks through application logic
CREATE POLICY "Service role can manage staff roles"
  ON public.staff_roles FOR ALL
  USING (auth.role() = 'service_role');

-- Allow users to view their own staff role
CREATE POLICY "Users can view own staff role"
  ON public.staff_roles FOR SELECT
  USING (auth.uid() = user_id);
