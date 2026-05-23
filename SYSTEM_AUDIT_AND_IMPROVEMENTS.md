# 🔍 SYSTEM AUDIT & IMPROVEMENTS

## 📊 CURRENT ARCHITECTURE AUDIT

### ✅ What Works Well:

1. **Pending Rewards System**
   - ✅ `pending_rewards` table exists
   - ✅ Tracks points, stamps, vouchers
   - ✅ Has expiry tracking (14 days)
   - ✅ Status tracking (pending/claimed/expired)

2. **Game Plays Tracking**
   - ✅ `game_plays` table exists (referenced in code)
   - ✅ Logs every game play
   - ✅ Records prize awarded

3. **Check-In System**
   - ✅ Claims all pending rewards
   - ✅ Updates user balances
   - ✅ Tracks streaks & combos

---

## 🐛 ISSUES FOUND

### **1. Missing `game_plays` Table Definition** ⚠️
**Problem:** Table is used but not created in migrations
**Impact:** System may crash if table doesn't exist
**Fix:** Create proper table schema

### **2. No Audit Trail** ⚠️
**Problem:** Hard to track prize lifecycle
**Impact:** Can't debug issues or verify claims
**Fix:** Add comprehensive logging

### **3. Race Conditions** ⚠️
**Problem:** Multiple simultaneous game plays could cause issues
**Impact:** Duplicate prizes or lost rewards
**Fix:** Add proper locking and transactions

### **4. No Reconciliation** ⚠️
**Problem:** Can't verify pending vs claimed matches
**Impact:** Points could be lost or duplicated
**Fix:** Add reconciliation queries

### **5. Limited Error Handling** ⚠️
**Problem:** Silent failures in functions
**Impact:** Users lose prizes without knowing
**Fix:** Add error logging and notifications

---

## 🎯 RECOMMENDED IMPROVEMENTS

### **Architecture: Source of Truth Pattern**

```
┌─────────────────────────────────────────────────┐
│                 GAME PLAYS                      │
│         (Single Source of Truth)                │
│  - Every game play recorded                     │
│  - Prize awarded logged                         │
│  - Status tracked (pending/claimed/expired)     │
└─────────────────┬───────────────────────────────┘
                  │
                  ├──> Creates ──> PENDING_REWARDS
                  │                (Awaiting check-in)
                  │
                  └──> Check-in ──> TRANSACTIONS
                                    (Claimed history)
```

### **Benefits:**
1. ✅ Single source of truth
2. ✅ Full audit trail
3. ✅ Easy reconciliation
4. ✅ Can replay/fix issues
5. ✅ Analytics ready

---

## 🔧 PROPOSED SCHEMA IMPROVEMENTS

### **1. Enhanced `game_plays` Table**

```sql
CREATE TABLE IF NOT EXISTS public.game_plays (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Game Info
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.mini_games(id),
  
  -- Prize Info
  prize_type TEXT NOT NULL CHECK (prize_type IN ('points', 'stamps', 'reward', 'nothing')),
  prize_value INTEGER DEFAULT 0,
  prize_label TEXT NOT NULL,
  reward_id UUID REFERENCES public.rewards(id),
  
  -- Status Tracking (NEW!)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_via TEXT, -- 'check_in', 'manual', 'auto'
  
  -- Pending Reward Link (NEW!)
  pending_reward_id UUID REFERENCES public.pending_rewards(id),
  
  -- Transaction Link (NEW!)
  transaction_id UUID REFERENCES public.transactions(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_plays_user_id ON public.game_plays(user_id);
CREATE INDEX idx_game_plays_game_id ON public.game_plays(game_id);
CREATE INDEX idx_game_plays_status ON public.game_plays(status);
CREATE INDEX idx_game_plays_created_at ON public.game_plays(created_at);
CREATE INDEX idx_game_plays_pending_reward ON public.game_plays(pending_reward_id);

-- RLS Policies
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own game plays"
  ON public.game_plays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage game plays"
  ON public.game_plays FOR ALL
  USING (auth.role() = 'service_role');
```

### **2. Enhanced `pending_rewards` Table**

```sql
-- Add missing columns
ALTER TABLE public.pending_rewards
  ADD COLUMN IF NOT EXISTS game_play_id UUID REFERENCES public.game_plays(id),
  ADD COLUMN IF NOT EXISTS claimed_via TEXT, -- 'check_in', 'manual', 'auto'
  ADD COLUMN IF NOT EXISTS error_log TEXT, -- Track any errors
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Index for game play link
CREATE INDEX IF NOT EXISTS idx_pending_rewards_game_play 
  ON public.pending_rewards(game_play_id);
```

### **3. Audit Log Table (NEW!)**

```sql
CREATE TABLE IF NOT EXISTS public.reward_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- What happened
  event_type TEXT NOT NULL, -- 'game_won', 'pending_created', 'claimed', 'expired', 'error'
  entity_type TEXT NOT NULL, -- 'game_play', 'pending_reward', 'transaction'
  entity_id UUID NOT NULL,
  
  -- Who
  user_id UUID REFERENCES public.users(id),
  
  -- Details
  old_status TEXT,
  new_status TEXT,
  amount INTEGER,
  reward_type TEXT,
  
  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  -- Traceability
  correlation_id UUID, -- Link related events
  source TEXT -- 'api', 'cron', 'manual', 'trigger'
);

CREATE INDEX idx_audit_user_id ON public.reward_audit_log(user_id);
CREATE INDEX idx_audit_entity ON public.reward_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON public.reward_audit_log(created_at);
CREATE INDEX idx_audit_correlation ON public.reward_audit_log(correlation_id);
```

---

## 🔄 IMPROVED WORKFLOW

### **1. Game Play (Improved)**

```sql
CREATE OR REPLACE FUNCTION public.award_game_prize_v2(
  p_user_id UUID,
  p_game_id UUID,
  p_prize_type TEXT,
  p_prize_value INTEGER,
  p_prize_label TEXT,
  p_reward_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_game_play_id UUID;
  v_pending_id UUID;
  v_correlation_id UUID := gen_random_uuid();
  v_game_name TEXT;
BEGIN
  -- Get game name
  SELECT display_name INTO v_game_name FROM public.mini_games WHERE id = p_game_id;
  
  -- 1. ALWAYS log the game play (source of truth)
  INSERT INTO public.game_plays (
    user_id,
    game_id,
    prize_type,
    prize_value,
    prize_label,
    reward_id,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_game_id,
    p_prize_type,
    p_prize_value,
    p_prize_label,
    p_reward_id,
    CASE WHEN p_prize_type = 'nothing' THEN 'claimed' ELSE 'pending' END,
    jsonb_build_object(
      'correlation_id', v_correlation_id,
      'game_name', v_game_name
    )
  )
  RETURNING id INTO v_game_play_id;
  
  -- 2. Audit log
  INSERT INTO public.reward_audit_log (
    event_type,
    entity_type,
    entity_id,
    user_id,
    new_status,
    amount,
    reward_type,
    correlation_id,
    source,
    metadata
  ) VALUES (
    'game_won',
    'game_play',
    v_game_play_id,
    p_user_id,
    'pending',
    p_prize_value,
    p_prize_type,
    v_correlation_id,
    'api',
    jsonb_build_object('game_name', v_game_name, 'prize_label', p_prize_label)
  );
  
  -- 3. Create pending reward (if not "nothing")
  IF p_prize_type != 'nothing' THEN
    INSERT INTO public.pending_rewards (
      user_id,
      reward_type,
      amount,
      reward_id,
      reward_name,
      reward_description,
      source,
      source_id,
      game_play_id,
      metadata
    ) VALUES (
      p_user_id,
      CASE 
        WHEN p_prize_type = 'points' THEN 'points'
        WHEN p_prize_type = 'stamps' THEN 'stamps'
        WHEN p_prize_type = 'reward' THEN 'voucher'
        ELSE 'custom'
      END,
      p_prize_value,
      p_reward_id,
      p_prize_label || ' from ' || v_game_name,
      'Check in at Penkey to claim your prize!',
      'game_win',
      p_game_id,
      v_game_play_id,
      jsonb_build_object(
        'correlation_id', v_correlation_id,
        'game_play_id', v_game_play_id
      )
    )
    RETURNING id INTO v_pending_id;
    
    -- Update game play with pending reward link
    UPDATE public.game_plays
    SET pending_reward_id = v_pending_id
    WHERE id = v_game_play_id;
    
    -- Audit log
    INSERT INTO public.reward_audit_log (
      event_type,
      entity_type,
      entity_id,
      user_id,
      new_status,
      amount,
      reward_type,
      correlation_id,
      source
    ) VALUES (
      'pending_created',
      'pending_reward',
      v_pending_id,
      p_user_id,
      'pending',
      p_prize_value,
      p_prize_type,
      v_correlation_id,
      'api'
    );
    
    -- Update user count
    UPDATE public.users
    SET pending_rewards_count = pending_rewards_count + 1
    WHERE id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'game_play_id', v_game_play_id,
    'pending_id', v_pending_id,
    'pending', p_prize_type != 'nothing',
    'correlation_id', v_correlation_id,
    'message', CASE 
      WHEN p_prize_type = 'nothing' THEN 'Better luck next time!'
      ELSE 'Prize pending! Check in at Penkey to claim it.'
    END
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO public.reward_audit_log (
    event_type,
    entity_type,
    entity_id,
    user_id,
    correlation_id,
    source,
    error_message
  ) VALUES (
    'error',
    'game_play',
    v_game_play_id,
    p_user_id,
    v_correlation_id,
    'api',
    SQLERRM
  );
  
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. Check-In Claim (Improved)**

```sql
CREATE OR REPLACE FUNCTION public.claim_pending_rewards_v2(
  p_user_id UUID,
  p_location_verified BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_pending RECORD;
  v_correlation_id UUID := gen_random_uuid();
  v_claimed_count INTEGER := 0;
  v_total_points INTEGER := 0;
  v_total_stamps INTEGER := 0;
  v_transaction_id UUID;
BEGIN
  -- Claim all pending rewards
  FOR v_pending IN
    SELECT * FROM public.pending_rewards
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND claimed = false
      AND (expires_at IS NULL OR expires_at > NOW())
  LOOP
    -- Create transaction
    INSERT INTO public.transactions (
      user_id,
      action,
      points_change,
      details
    ) VALUES (
      p_user_id,
      'claim_pending_reward',
      CASE WHEN v_pending.reward_type = 'points' THEN v_pending.amount ELSE 0 END,
      jsonb_build_object(
        'pending_reward_id', v_pending.id,
        'game_play_id', v_pending.game_play_id,
        'reward_type', v_pending.reward_type,
        'amount', v_pending.amount,
        'correlation_id', v_correlation_id
      )
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update pending reward
    UPDATE public.pending_rewards
    SET status = 'claimed',
        claimed = true,
        claimed_at = NOW(),
        claimed_via = 'check_in',
        updated_at = NOW()
    WHERE id = v_pending.id;
    
    -- Update game play
    UPDATE public.game_plays
    SET status = 'claimed',
        claimed_at = NOW(),
        claimed_via = 'check_in',
        transaction_id = v_transaction_id,
        updated_at = NOW()
    WHERE id = v_pending.game_play_id;
    
    -- Audit log
    INSERT INTO public.reward_audit_log (
      event_type,
      entity_type,
      entity_id,
      user_id,
      old_status,
      new_status,
      amount,
      reward_type,
      correlation_id,
      source,
      metadata
    ) VALUES (
      'claimed',
      'pending_reward',
      v_pending.id,
      p_user_id,
      'pending',
      'claimed',
      v_pending.amount,
      v_pending.reward_type,
      v_correlation_id,
      'check_in',
      jsonb_build_object(
        'game_play_id', v_pending.game_play_id,
        'transaction_id', v_transaction_id
      )
    );
    
    -- Award based on type
    CASE v_pending.reward_type
      WHEN 'points' THEN
        UPDATE public.users
        SET points = points + v_pending.amount
        WHERE id = p_user_id;
        v_total_points := v_total_points + v_pending.amount;
        
      WHEN 'stamps' THEN
        UPDATE public.users
        SET stamps = stamps + v_pending.amount
        WHERE id = p_user_id;
        v_total_stamps := v_total_stamps + v_pending.amount;
        
      WHEN 'voucher' THEN
        UPDATE public.user_rewards
        SET status = 'active'
        WHERE id = v_pending.reward_id;
    END CASE;
    
    v_claimed_count := v_claimed_count + 1;
  END LOOP;
  
  -- Update user pending count
  UPDATE public.users
  SET pending_rewards_count = 0
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'claimed_count', v_claimed_count,
    'total_points', v_total_points,
    'total_stamps', v_total_stamps,
    'correlation_id', v_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 RECONCILIATION QUERIES

### **1. Check Data Integrity**

```sql
-- Find game plays without pending rewards (should only be "nothing" prizes)
SELECT gp.*
FROM game_plays gp
LEFT JOIN pending_rewards pr ON pr.game_play_id = gp.id
WHERE pr.id IS NULL
  AND gp.prize_type != 'nothing'
  AND gp.status = 'pending';

-- Find pending rewards without game plays (orphaned)
SELECT pr.*
FROM pending_rewards pr
LEFT JOIN game_plays gp ON gp.id = pr.game_play_id
WHERE gp.id IS NULL
  AND pr.source = 'game_win';

-- Check user pending count matches actual pending
SELECT 
  u.id,
  u.name,
  u.pending_rewards_count as recorded_count,
  COUNT(pr.id) as actual_count,
  u.pending_rewards_count - COUNT(pr.id) as difference
FROM users u
LEFT JOIN pending_rewards pr ON pr.user_id = u.id AND pr.status = 'pending'
GROUP BY u.id, u.name, u.pending_rewards_count
HAVING u.pending_rewards_count != COUNT(pr.id);
```

### **2. Audit Trail**

```sql
-- Full prize lifecycle for a user
SELECT 
  ral.created_at,
  ral.event_type,
  ral.entity_type,
  ral.reward_type,
  ral.amount,
  ral.old_status,
  ral.new_status,
  ral.error_message,
  ral.metadata
FROM reward_audit_log ral
WHERE ral.user_id = 'USER_ID'
ORDER BY ral.created_at DESC;

-- Track a specific prize from win to claim
SELECT 
  ral.*
FROM reward_audit_log ral
WHERE ral.correlation_id = 'CORRELATION_ID'
ORDER BY ral.created_at;
```

---

## 🎯 MIGRATION PLAN

### **Phase 1: Add Missing Tables (CRITICAL)**
1. Create `game_plays` table if missing
2. Add audit log table
3. Add indexes

### **Phase 2: Enhance Existing Tables**
1. Add linking columns
2. Add status tracking
3. Add error logging

### **Phase 3: Update Functions**
1. Replace `award_game_prize_pending` with v2
2. Replace `claim_pending_rewards` with v2
3. Add error handling

### **Phase 4: Add Monitoring**
1. Create reconciliation cron job
2. Add error alerting
3. Add analytics views

---

## ✅ BENEFITS OF NEW ARCHITECTURE

1. **Single Source of Truth**
   - Every game play recorded
   - Can replay/fix issues
   - Full audit trail

2. **Robust Error Handling**
   - Errors logged, not silent
   - Can retry failed operations
   - Users notified of issues

3. **Easy Debugging**
   - Track prize from win to claim
   - See exactly what happened
   - Correlation IDs link events

4. **Data Integrity**
   - Reconciliation queries
   - Detect orphaned records
   - Fix inconsistencies

5. **Analytics Ready**
   - Track conversion rates
   - See claim patterns
   - Identify issues early

---

## 🚀 NEXT STEPS

1. **Review this audit**
2. **Approve architecture changes**
3. **Create migration files**
4. **Test thoroughly**
5. **Deploy incrementally**

**Want me to create the migration files?** 🎯
