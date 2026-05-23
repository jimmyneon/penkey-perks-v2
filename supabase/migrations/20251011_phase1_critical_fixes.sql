-- =============================================
-- PHASE 1: CRITICAL SYSTEM FIXES
-- =============================================
-- Fixes data integrity, adds monitoring, improves performance
-- =============================================

-- =============================================
-- 1. ENSURE GAME_PLAYS TABLE EXISTS WITH PROPER STRUCTURE
-- =============================================

CREATE TABLE IF NOT EXISTS public.game_plays (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Game Info
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.mini_games(id),
  
  -- Prize Info
  prize_type TEXT NOT NULL CHECK (prize_type IN ('points', 'stamps', 'reward', 'nothing')),
  prize_value INTEGER DEFAULT 0,
  prize_label TEXT,
  reward_id UUID REFERENCES public.rewards(id),
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_via TEXT, -- 'check_in', 'manual', 'auto'
  
  -- Links to other tables
  pending_reward_id UUID REFERENCES public.pending_rewards(id),
  transaction_id UUID REFERENCES public.transactions(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  -- Add status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN status TEXT DEFAULT 'pending' 
      CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled'));
  END IF;
  
  -- Add claimed_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add claimed_via if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'claimed_via'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN claimed_via TEXT;
  END IF;
  
  -- Add pending_reward_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'pending_reward_id'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN pending_reward_id UUID REFERENCES public.pending_rewards(id);
  END IF;
  
  -- Add transaction_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN transaction_id UUID REFERENCES public.transactions(id);
  END IF;
  
  -- Add metadata if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_plays' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.game_plays ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =============================================
-- 2. ADD MISSING COLUMNS TO PENDING_REWARDS
-- =============================================

DO $$ 
BEGIN
  -- Add game_play_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pending_rewards' AND column_name = 'game_play_id'
  ) THEN
    ALTER TABLE public.pending_rewards ADD COLUMN game_play_id UUID REFERENCES public.game_plays(id);
  END IF;
  
  -- Add claimed_via if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pending_rewards' AND column_name = 'claimed_via'
  ) THEN
    ALTER TABLE public.pending_rewards ADD COLUMN claimed_via TEXT;
  END IF;
  
  -- Add error_log if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pending_rewards' AND column_name = 'error_log'
  ) THEN
    ALTER TABLE public.pending_rewards ADD COLUMN error_log TEXT;
  END IF;
  
  -- Add retry_count if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pending_rewards' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.pending_rewards ADD COLUMN retry_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 3. CREATE ALL MISSING INDEXES
-- =============================================

-- Game Plays Indexes
CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON public.game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_game_id ON public.game_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_status ON public.game_plays(status);
CREATE INDEX IF NOT EXISTS idx_game_plays_created_at ON public.game_plays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_plays_pending_reward ON public.game_plays(pending_reward_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_user_created ON public.game_plays(user_id, created_at DESC);

-- Pending Rewards Indexes
CREATE INDEX IF NOT EXISTS idx_pending_rewards_user_status ON public.pending_rewards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_rewards_expires_at ON public.pending_rewards(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pending_rewards_source ON public.pending_rewards(source, source_id);
CREATE INDEX IF NOT EXISTS idx_pending_rewards_game_play ON public.pending_rewards(game_play_id);
CREATE INDEX IF NOT EXISTS idx_pending_rewards_created_at ON public.pending_rewards(created_at DESC);

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_pending_count ON public.users(pending_rewards_count) WHERE pending_rewards_count > 0;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_action ON public.transactions(action);

-- Game Prizes Indexes
CREATE INDEX IF NOT EXISTS idx_game_prizes_game_id ON public.game_prizes(game_id);

-- =============================================
-- 4. ADD RLS POLICIES
-- =============================================

-- Enable RLS on game_plays if not already enabled
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own game plays" ON public.game_plays;
DROP POLICY IF EXISTS "Service can manage game plays" ON public.game_plays;

-- Create policies
CREATE POLICY "Users can view own game plays"
  ON public.game_plays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage game plays"
  ON public.game_plays FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- 5. DATA RECONCILIATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.reconcile_pending_rewards()
RETURNS TABLE(
  issue_type TEXT,
  user_id UUID,
  user_name TEXT,
  details JSONB
) AS $$
BEGIN
  -- Issue 1: User pending count doesn't match actual pending
  RETURN QUERY
  SELECT 
    'count_mismatch'::TEXT,
    u.id,
    u.name,
    jsonb_build_object(
      'recorded_count', u.pending_rewards_count,
      'actual_count', COUNT(pr.id),
      'difference', u.pending_rewards_count - COUNT(pr.id)
    )
  FROM users u
  LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
  GROUP BY u.id, u.name, u.pending_rewards_count
  HAVING u.pending_rewards_count != COUNT(pr.id);
  
  -- Issue 2: Pending rewards without game plays (orphaned)
  RETURN QUERY
  SELECT 
    'orphaned_pending'::TEXT,
    pr.user_id,
    u.name,
    jsonb_build_object(
      'pending_reward_id', pr.id,
      'reward_type', pr.reward_type,
      'amount', pr.amount,
      'created_at', pr.created_at,
      'source', pr.source
    )
  FROM pending_rewards pr
  JOIN users u ON u.id = pr.user_id
  LEFT JOIN game_plays gp ON gp.pending_reward_id = pr.id
  WHERE gp.id IS NULL
    AND pr.source = 'game_win'
    AND pr.status = 'pending';
  
  -- Issue 3: Expired but not marked
  RETURN QUERY
  SELECT 
    'expired_not_marked'::TEXT,
    pr.user_id,
    u.name,
    jsonb_build_object(
      'pending_reward_id', pr.id,
      'reward_type', pr.reward_type,
      'amount', pr.amount,
      'expires_at', pr.expires_at,
      'days_overdue', EXTRACT(DAY FROM NOW() - pr.expires_at)
    )
  FROM pending_rewards pr
  JOIN users u ON u.id = pr.user_id
  WHERE pr.status = 'pending'
    AND pr.expires_at < NOW();
    
  -- Issue 4: Game plays without pending rewards (should have them)
  RETURN QUERY
  SELECT 
    'missing_pending'::TEXT,
    gp.user_id,
    u.name,
    jsonb_build_object(
      'game_play_id', gp.id,
      'prize_type', gp.prize_type,
      'prize_value', gp.prize_value,
      'created_at', gp.created_at
    )
  FROM game_plays gp
  JOIN users u ON u.id = gp.user_id
  LEFT JOIN pending_rewards pr ON pr.game_play_id = gp.id
  WHERE pr.id IS NULL
    AND gp.prize_type != 'nothing'
    AND gp.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reconcile_pending_rewards IS 'Finds data integrity issues in pending rewards system';

-- =============================================
-- 6. AUTO-FIX FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.fix_pending_counts()
RETURNS JSONB AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_user RECORD;
  v_actual_count INTEGER;
BEGIN
  -- Fix all user pending counts
  FOR v_user IN
    SELECT id, pending_rewards_count
    FROM users
    WHERE pending_rewards_count != (
      SELECT COUNT(*)
      FROM pending_rewards pr
      WHERE pr.user_id = users.id
        AND pr.status = 'pending'
    )
  LOOP
    -- Get actual count
    SELECT COUNT(*) INTO v_actual_count
    FROM pending_rewards
    WHERE user_id = v_user.id
      AND status = 'pending';
    
    -- Update user
    UPDATE users
    SET pending_rewards_count = v_actual_count,
        updated_at = NOW()
    WHERE id = v_user.id;
    
    v_fixed_count := v_fixed_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'fixed_count', v_fixed_count,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fix_pending_counts IS 'Auto-fixes user pending reward counts';

-- =============================================
-- 7. SYSTEM HEALTH CHECK FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS JSONB AS $$
DECLARE
  v_health JSONB;
  v_issues_count INTEGER;
BEGIN
  -- Get issue count
  SELECT COUNT(*) INTO v_issues_count
  FROM public.reconcile_pending_rewards();
  
  -- Build health report
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'status', CASE WHEN v_issues_count = 0 THEN 'healthy' ELSE 'issues_found' END,
    
    -- User Stats
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users_7d', (SELECT COUNT(DISTINCT user_id) FROM game_plays WHERE created_at >= NOW() - INTERVAL '7 days'),
    'users_with_pending', (SELECT COUNT(*) FROM users WHERE pending_rewards_count > 0),
    
    -- Pending Rewards
    'pending_rewards_total', (SELECT COUNT(*) FROM pending_rewards WHERE status = 'pending'),
    'pending_points', (SELECT COALESCE(SUM(amount), 0) FROM pending_rewards WHERE status = 'pending' AND reward_type = 'points'),
    'pending_stamps', (SELECT COALESCE(SUM(amount), 0) FROM pending_rewards WHERE status = 'pending' AND reward_type = 'stamps'),
    'expired_pending', (SELECT COUNT(*) FROM pending_rewards WHERE status = 'pending' AND expires_at < NOW()),
    
    -- Games
    'games_played_today', (SELECT COUNT(*) FROM game_plays WHERE created_at >= CURRENT_DATE),
    'games_played_7d', (SELECT COUNT(*) FROM game_plays WHERE created_at >= NOW() - INTERVAL '7 days'),
    'games_enabled', (SELECT COUNT(*) FROM mini_games WHERE enabled = true),
    
    -- Data Integrity
    'data_issues', v_issues_count,
    
    -- Email (if table exists)
    'emails_queued', (
      SELECT COALESCE(
        (SELECT COUNT(*) FROM email_queue WHERE status = 'pending'),
        0
      )
    ),
    'emails_failed_24h', (
      SELECT COALESCE(
        (SELECT COUNT(*) FROM email_queue WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '24 hours'),
        0
      )
    )
  ) INTO v_health;
  
  RETURN v_health;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'error', SQLERRM,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.system_health_check IS 'Returns comprehensive system health status';

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.reconcile_pending_rewards TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_pending_rewards TO authenticated;

GRANT EXECUTE ON FUNCTION public.fix_pending_counts TO service_role;

GRANT EXECUTE ON FUNCTION public.system_health_check TO service_role;
GRANT EXECUTE ON FUNCTION public.system_health_check TO authenticated;

-- =============================================
-- 9. UPDATE EXISTING GAME PLAYS (IF ANY)
-- =============================================

-- Set default status for existing game plays
UPDATE public.game_plays
SET status = 'pending'
WHERE status IS NULL
  AND prize_type != 'nothing';

UPDATE public.game_plays
SET status = 'claimed'
WHERE status IS NULL
  AND prize_type = 'nothing';

-- =============================================
-- 10. VERIFICATION QUERIES
-- =============================================

-- Show table structures
SELECT 
  'game_plays' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'game_plays'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'pending_rewards' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pending_rewards'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('game_plays', 'pending_rewards', 'users', 'transactions')
ORDER BY tablename, indexname;

-- Run health check
SELECT public.system_health_check();

-- Check for data issues
SELECT * FROM public.reconcile_pending_rewards();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
DECLARE
  v_health JSONB;
  v_issues INTEGER;
BEGIN
  v_health := public.system_health_check();
  v_issues := (v_health->>'data_issues')::INTEGER;
  
  RAISE NOTICE '✅ Phase 1 Critical Fixes Applied Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 System Status:';
  RAISE NOTICE '  - Status: %', v_health->>'status';
  RAISE NOTICE '  - Total Users: %', v_health->>'total_users';
  RAISE NOTICE '  - Active Users (7d): %', v_health->>'active_users_7d';
  RAISE NOTICE '  - Pending Rewards: %', v_health->>'pending_rewards_total';
  RAISE NOTICE '  - Games Played Today: %', v_health->>'games_played_today';
  RAISE NOTICE '  - Data Issues: %', v_issues;
  RAISE NOTICE '';
  
  IF v_issues > 0 THEN
    RAISE NOTICE '⚠️  Found % data integrity issues', v_issues;
    RAISE NOTICE '   Run: SELECT * FROM reconcile_pending_rewards();';
    RAISE NOTICE '   Fix: SELECT fix_pending_counts();';
  ELSE
    RAISE NOTICE '✅ No data integrity issues found!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Run: SELECT * FROM reconcile_pending_rewards();';
  RAISE NOTICE '  2. If issues found, run: SELECT fix_pending_counts();';
  RAISE NOTICE '  3. Test game play and check-in flow';
  RAISE NOTICE '  4. Monitor: SELECT system_health_check();';
END $$;
