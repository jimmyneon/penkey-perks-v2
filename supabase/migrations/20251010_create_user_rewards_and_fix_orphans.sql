-- =============================================
-- CREATE USER_REWARDS TABLE AND FIX ORPHANED REDEMPTIONS
-- =============================================
-- This migration:
-- 1. Creates the user_rewards table if it doesn't exist
-- 2. Sets up proper RLS policies
-- 3. Fixes orphaned reward redemptions (points deducted but no user_reward created)

-- =============================================
-- 1. CREATE USER_REWARDS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  qr_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON public.user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_rewards_qr_code ON public.user_rewards(qr_code);

-- Add comment
COMMENT ON TABLE public.user_rewards IS 'Rewards issued to users (redeemed from points or earned from coffee stamps)';

-- =============================================
-- 2. ENABLE RLS AND CREATE POLICIES
-- =============================================

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Staff can redeem rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.user_rewards;

-- Allow users to view their own rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own rewards (for redemptions)
CREATE POLICY "Users can insert own rewards"
  ON public.user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own rewards (for status changes)
CREATE POLICY "Users can update own rewards"
  ON public.user_rewards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow staff to redeem rewards (update status to 'redeemed')
CREATE POLICY "Staff can redeem rewards"
  ON public.user_rewards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- Allow admins full access
CREATE POLICY "Admins can manage all rewards"
  ON public.user_rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- =============================================
-- 3. FIX ORPHANED REWARD REDEMPTIONS
-- =============================================

-- Create a function to fix orphaned redemptions
CREATE OR REPLACE FUNCTION public.fix_orphaned_reward_redemptions()
RETURNS TABLE(
  transaction_id UUID,
  user_id UUID,
  reward_id UUID,
  user_reward_created BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_transaction RECORD;
  v_reward RECORD;
  v_qr_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_user_reward_id UUID;
BEGIN
  -- Loop through all reward redemption transactions without matching user_rewards
  FOR v_transaction IN
    SELECT 
      pt.id,
      pt.user_id,
      pt.created_at,
      pt.metadata->>'reward_id' as reward_id,
      pt.description
    FROM points_transactions pt
    LEFT JOIN user_rewards ur ON (
      ur.user_id = pt.user_id 
      AND ur.reward_id::text = pt.metadata->>'reward_id'
      AND ur.created_at >= pt.created_at - INTERVAL '5 minutes'
      AND ur.created_at <= pt.created_at + INTERVAL '5 minutes'
    )
    WHERE pt.source = 'reward_redemption'
      AND pt.amount < 0
      AND ur.id IS NULL
      AND pt.metadata->>'reward_id' IS NOT NULL
  LOOP
    BEGIN
      -- Get reward details
      SELECT * INTO v_reward
      FROM rewards
      WHERE id = v_transaction.reward_id::UUID;
      
      IF NOT FOUND THEN
        -- Return error if reward not found
        transaction_id := v_transaction.id;
        user_id := v_transaction.user_id;
        reward_id := v_transaction.reward_id::UUID;
        user_reward_created := FALSE;
        error_message := 'Reward not found';
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Generate QR code
      v_qr_code := 'REWARD-' || EXTRACT(EPOCH FROM v_transaction.created_at)::BIGINT || '-' || 
                   substr(md5(random()::text), 1, 8);
      
      -- Calculate expiry (30 days from transaction date)
      v_expires_at := v_transaction.created_at + INTERVAL '30 days';
      
      -- Create user_reward entry
      INSERT INTO user_rewards (
        user_id,
        reward_id,
        qr_code,
        status,
        expires_at,
        created_at
      ) VALUES (
        v_transaction.user_id,
        v_transaction.reward_id::UUID,
        v_qr_code,
        'active',
        v_expires_at,
        v_transaction.created_at
      )
      RETURNING id INTO v_user_reward_id;
      
      -- Return success
      transaction_id := v_transaction.id;
      user_id := v_transaction.user_id;
      reward_id := v_transaction.reward_id::UUID;
      user_reward_created := TRUE;
      error_message := NULL;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error
      transaction_id := v_transaction.id;
      user_id := v_transaction.user_id;
      reward_id := v_transaction.reward_id::UUID;
      user_reward_created := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the fix
SELECT * FROM public.fix_orphaned_reward_redemptions();

-- =============================================
-- 4. ADD HELPFUL COMMENT
-- =============================================

COMMENT ON FUNCTION public.fix_orphaned_reward_redemptions IS 'Fixes orphaned reward redemptions where points were deducted but user_rewards entry was not created';

-- =============================================
-- DONE!
-- =============================================
-- Run DIAGNOSE_REWARD_ISSUE.sql to verify the fix
