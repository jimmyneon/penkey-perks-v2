-- ============================================================================
-- FIX VOUCHER RLS POLICIES IF NEEDED
-- ============================================================================
-- Run this file if the audit shows RLS issues with vouchers
-- ============================================================================

-- 1. DROP EXISTING POLICIES ON user_vouchers
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own vouchers" ON public.user_vouchers;
DROP POLICY IF EXISTS "Staff can view all vouchers" ON public.user_vouchers;
DROP POLICY IF EXISTS "Staff can redeem vouchers" ON public.user_vouchers;
DROP POLICY IF EXISTS "Users can insert own vouchers" ON public.user_vouchers;

-- 2. RECREATE CORRECT RLS POLICIES ON user_vouchers
-- ============================================================================

-- Users can view their own vouchers
CREATE POLICY "Users can view own vouchers"
  ON public.user_vouchers FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can view all vouchers (if staff_roles table exists)
CREATE POLICY "Staff can view all vouchers"
  ON public.user_vouchers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Staff can redeem vouchers
CREATE POLICY "Staff can redeem vouchers"
  ON public.user_vouchers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
    )
  );

-- Users cannot directly insert vouchers (only via functions)
-- This is already enforced by the lack of an INSERT policy

-- 3. DROP EXISTING POLICIES ON voucher_templates
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active voucher templates" ON public.voucher_templates;
DROP POLICY IF EXISTS "Staff can manage voucher templates" ON public.voucher_templates;

-- 4. RECREATE CORRECT RLS POLICIES ON voucher_templates
-- ============================================================================

-- Anyone can view voucher templates (needed for users to see available rewards)
CREATE POLICY "Anyone can view voucher templates"
  ON public.voucher_templates FOR SELECT
  USING (true);

-- Staff can manage voucher templates
CREATE POLICY "Staff can manage voucher templates"
  ON public.voucher_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- 5. VERIFY POLICIES WERE CREATED
-- ============================================================================
SELECT 'Verifying policies were created...' as step;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('user_vouchers', 'voucher_templates')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. TEST POLICY WITH A SAMPLE USER (REPLACE USER_ID)
-- ============================================================================
-- Uncomment and replace with actual user_id to test:
-- SET LOCAL request.jwt.claim.sub = 'YOUR_USER_ID_HERE';
-- SELECT * FROM public.user_vouchers WHERE user_id = 'YOUR_USER_ID_HERE';
