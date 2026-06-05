-- =============================================
-- FIX RLS POLICIES FOR PROMOTIONAL OFFERS
-- Fixes 403 error when users try to view active offers
-- =============================================

-- Drop all existing policies on promotional_offers
DROP POLICY IF EXISTS "Staff can manage promotional offers" ON public.promotional_offers;
DROP POLICY IF EXISTS "Users can view active promotional offers" ON public.promotional_offers;

-- Create simple policy: all authenticated users can view active offers
CREATE POLICY "Authenticated users can view active promotional offers"
  ON public.promotional_offers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy for staff to manage offers (INSERT/UPDATE/DELETE)
CREATE POLICY "Staff can manage promotional offers"
  ON public.promotional_offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('staff', 'admin')
    )
  );

-- Also fix user_promotional_offers RLS if needed
DROP POLICY IF EXISTS "Users manage own promotional offer interactions" ON public.user_promotional_offers;
DROP POLICY IF EXISTS "Users can view own promotional offer interactions" ON public.user_promotional_offers;
DROP POLICY IF EXISTS "Users can insert own promotional offer interactions" ON public.user_promotional_offers;
DROP POLICY IF EXISTS "Users can update own promotional offer interactions" ON public.user_promotional_offers;

CREATE POLICY "Users can view own promotional offer interactions"
  ON public.user_promotional_offers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own promotional offer interactions"
  ON public.user_promotional_offers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own promotional offer interactions"
  ON public.user_promotional_offers
  FOR UPDATE
  USING (user_id = auth.uid());

SELECT 'RLS policies fixed for promotional offers!' as message;
