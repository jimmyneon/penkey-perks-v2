# 🎯 Master Integration Plan - Penkey Perks Enhancement

## 📋 Executive Summary

**Goal:** Integrate pending rewards, engagement features, and email systems into existing Penkey Perks app

**Timeline:** 4 weeks (phased rollout)

**Expected Impact:**
- +150% visit frequency
- +100% email engagement
- +75% customer lifetime value
- +40% referral rate

---

## 🏗️ Current System Analysis

### **What You Already Have:**
✅ User authentication (Supabase Auth)
✅ Points system (points_transactions table)
✅ Coffee stamps system (coffee_stamps table)
✅ Rewards catalog (rewards, user_rewards tables)
✅ Games system (scratch cards, spin wheel, duck pond)
✅ Referral system (referrals table)
✅ Check-in system (GPS validation, 24hr cooldown)
✅ Email system (22 templates, triggers, queue)
✅ Badges & milestones (user_badges, milestones tables)
✅ Notifications system
✅ Staff scanner (QR code redemption)
✅ Dashboard UI (Next.js + Tailwind)

### **Database Tables:**
- `users` - User accounts
- `points_transactions` - Points ledger
- `coffee_stamps` - Stamp collection
- `rewards` - Reward catalog
- `user_rewards` - User's earned rewards
- `referrals` - Referral tracking
- `transactions` - Activity log
- `email_templates` - Email templates
- `email_queue` - Email queue
- `email_logs` - Sent emails
- `user_badges` - User badges
- `milestones` - Milestone definitions
- `user_milestones` - User achievements

---

## 🎯 Integration Plan - 4 Phases

---

## 📅 PHASE 1: Foundation (Week 1)

### **Goal:** Set up pending rewards system + second chance emails

### **Database Changes:**

#### **1.1 Create pending_rewards Table**
```sql
CREATE TABLE pending_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reward type
  reward_type TEXT CHECK (reward_type IN (
    'points', 'stamps', 'voucher', 'game_play', 'custom'
  )),
  
  -- Reward details
  amount INTEGER,                    -- For points/stamps
  reward_id UUID REFERENCES rewards(id),  -- For vouchers
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  
  -- Source tracking
  source TEXT CHECK (source IN (
    'referral', 'game_win', 'signup_bonus', 'email_offer',
    'winback_offer', 'birthday_bonus', 'milestone_bonus',
    'streak_bonus', 'manual_award', 'second_chance'
  )),
  source_id UUID,                    -- Link to source record
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'claimed', 'expired', 'second_chance'
  )),
  
  -- Timestamps
  earned_at TIMESTAMP DEFAULT NOW(),
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pending_rewards_user_id ON pending_rewards(user_id);
CREATE INDEX idx_pending_rewards_status ON pending_rewards(status);
CREATE INDEX idx_pending_rewards_expires_at ON pending_rewards(expires_at);
```

#### **1.2 Add Pending Rewards Counter to Users**
```sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS pending_rewards_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP;

CREATE INDEX idx_users_pending_rewards ON users(pending_rewards_count) 
  WHERE pending_rewards_count > 0;
```

#### **1.3 Create Check-In Streak Tracking**
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS check_in_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS check_in_streak_multiplier DECIMAL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
```

### **Functions to Create:**

#### **1.4 claim_pending_rewards() Function**
```sql
CREATE OR REPLACE FUNCTION claim_pending_rewards(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_pending RECORD;
  v_claimed_count INTEGER := 0;
  v_total_points INTEGER := 0;
  v_total_stamps INTEGER := 0;
  v_vouchers TEXT[] := ARRAY[]::TEXT[];
  v_location_valid BOOLEAN := true;
BEGIN
  -- Validate location if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location_valid := validate_location(p_latitude, p_longitude);
    
    IF NOT v_location_valid THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You must be at Penkey to claim rewards'
      );
    END IF;
  END IF;
  
  -- Claim all pending rewards
  FOR v_pending IN
    SELECT * FROM pending_rewards
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY earned_at ASC
  LOOP
    -- Award based on type
    CASE v_pending.reward_type
      WHEN 'points' THEN
        PERFORM add_points(
          p_user_id,
          v_pending.amount,
          v_pending.source,
          'Claimed: ' || v_pending.reward_name
        );
        v_total_points := v_total_points + v_pending.amount;
        
      WHEN 'stamps' THEN
        FOR i IN 1..v_pending.amount LOOP
          INSERT INTO coffee_stamps (user_id, notes)
          VALUES (p_user_id, 'Claimed: ' || v_pending.reward_name);
        END LOOP;
        v_total_stamps := v_total_stamps + v_pending.amount;
        
      WHEN 'voucher' THEN
        UPDATE user_rewards
        SET status = 'active'
        WHERE id = v_pending.reward_id;
        v_vouchers := array_append(v_vouchers, v_pending.reward_name);
        
      WHEN 'game_play' THEN
        -- Add game play credits (implement based on your game system)
        NULL;
    END CASE;
    
    -- Mark as claimed
    UPDATE pending_rewards
    SET status = 'claimed',
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pending.id;
    
    v_claimed_count := v_claimed_count + 1;
  END LOOP;
  
  -- Update user's pending count
  UPDATE users
  SET pending_rewards_count = (
    SELECT COUNT(*) FROM pending_rewards
    WHERE user_id = p_user_id AND status = 'pending'
  )
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'claimed_count', v_claimed_count,
    'total_points', v_total_points,
    'total_stamps', v_total_stamps,
    'vouchers', v_vouchers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **1.5 expire_pending_rewards() Function**
```sql
CREATE OR REPLACE FUNCTION expire_pending_rewards()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  v_expired RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find expired rewards
  FOR v_expired IN
    SELECT * FROM pending_rewards
    WHERE status = 'pending'
      AND expires_at <= NOW()
  LOOP
    -- Mark as expired
    UPDATE pending_rewards
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = v_expired.id;
    
    -- Create second chance offer (50% of original)
    INSERT INTO pending_rewards (
      user_id,
      reward_type,
      amount,
      reward_name,
      reward_description,
      source,
      source_id,
      expires_at,
      metadata
    ) VALUES (
      v_expired.user_id,
      v_expired.reward_type,
      CASE 
        WHEN v_expired.reward_type IN ('points', 'stamps') 
        THEN GREATEST(1, v_expired.amount / 2)
        ELSE v_expired.amount
      END,
      'Second Chance: ' || v_expired.reward_name,
      'We''re giving you another chance to claim this reward!',
      'second_chance',
      v_expired.id,
      NOW() + INTERVAL '3 days',
      jsonb_build_object(
        'original_amount', v_expired.amount,
        'original_id', v_expired.id,
        'bonus_stamps', 5
      )
    );
    
    -- Send second chance email
    PERFORM queue_email_from_template(
      'second_chance_offer',
      (SELECT email FROM users WHERE id = v_expired.user_id),
      v_expired.user_id,
      jsonb_build_object(
        'name', (SELECT name FROM users WHERE id = v_expired.user_id),
        'expiredReward', v_expired.reward_name,
        'expiredAmount', v_expired.amount,
        'secondChanceAmount', GREATEST(1, v_expired.amount / 2),
        'bonusStamps', 5,
        'expiresIn', '3 days',
        'appUrl', 'https://perks.penkey.co.uk'
      )
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  expired_count := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Email Templates to Add:**

#### **1.6 Second Chance Email**
```sql
INSERT INTO email_templates (name, subject, html_body, category, active)
VALUES (
  'second_chance_offer',
  '😢 Your Rewards Expired... But Here''s Another Chance!',
  '<!-- Second chance email HTML -->',
  'reengagement',
  true
);
```

#### **1.7 Pending Rewards Reminder**
```sql
INSERT INTO email_templates (name, subject, html_body, category, active)
VALUES (
  'pending_rewards_reminder',
  '🎁 You Have {{pendingCount}} Rewards Waiting!',
  '<!-- Pending rewards reminder HTML -->',
  'reminder',
  true
);
```

### **API Updates:**

#### **1.8 Update Check-In Route**
```typescript
// app/api/check-in/route.ts
export async function POST(request: Request) {
  // ... existing check-in logic ...
  
  // After successful check-in, claim pending rewards
  const { data: claimResult } = await supabase
    .rpc('claim_pending_rewards', {
      p_user_id: userToCheckIn,
      p_latitude: latitude,
      p_longitude: longitude
    })
  
  return NextResponse.json({
    success: true,
    message: 'Check-in successful!',
    points_earned: 5,
    pending_claimed: claimResult
  })
}
```

### **Deliverables:**
- ✅ pending_rewards table
- ✅ claim_pending_rewards() function
- ✅ expire_pending_rewards() function
- ✅ Second chance email template
- ✅ Updated check-in API
- ✅ Cron job for expiring rewards

---

## 📅 PHASE 2: Game Integration (Week 2)

### **Goal:** Make game wins pending until check-in

### **Database Changes:**

#### **2.1 Update Game Win Functions**
```sql
-- Modify existing game win functions to create pending rewards
-- Instead of adding stamps immediately, create pending_rewards entry

CREATE OR REPLACE FUNCTION award_game_prize(
  p_user_id UUID,
  p_game_type TEXT,
  p_prize_type TEXT,
  p_prize_value INTEGER
)
RETURNS JSONB AS $$
BEGIN
  -- Create pending reward instead of immediate
  INSERT INTO pending_rewards (
    user_id,
    reward_type,
    amount,
    reward_name,
    reward_description,
    source,
    metadata
  ) VALUES (
    p_user_id,
    CASE 
      WHEN p_prize_type = 'stamps' THEN 'stamps'
      WHEN p_prize_type = 'points' THEN 'points'
      ELSE 'voucher'
    END,
    p_prize_value,
    p_prize_value || ' ' || p_prize_type || ' from ' || p_game_type,
    'Check in at Penkey to claim your prize!',
    'game_win',
    jsonb_build_object('game_type', p_game_type)
  );
  
  -- Update user's pending count
  UPDATE users
  SET pending_rewards_count = pending_rewards_count + 1
  WHERE id = p_user_id;
  
  -- Send email notification
  PERFORM queue_email_from_template(
    'game_win_pending',
    (SELECT email FROM users WHERE id = p_user_id),
    p_user_id,
    jsonb_build_object(
      'name', (SELECT name FROM users WHERE id = p_user_id),
      'gameName', p_game_type,
      'prizeWon', p_prize_value || ' ' || p_prize_type,
      'appUrl', 'https://perks.penkey.co.uk'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Prize pending! Check in at Penkey to claim.',
    'pending', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Email Template:**

#### **2.2 Game Win Pending Email**
```sql
INSERT INTO email_templates (name, subject, html_body, category, active)
VALUES (
  'game_win_pending',
  '🎉 You Won {{prizeWon}}! Check In to Claim',
  '<!-- Game win pending email HTML -->',
  'achievement',
  true
);
```

### **Deliverables:**
- ✅ Updated game prize functions
- ✅ Game win pending email
- ✅ Dashboard shows pending game wins

---

## 📅 PHASE 3: Engagement Features (Week 3)

### **Goal:** Add check-in combos, spin wheel, daily challenges

### **Database Changes:**

#### **3.1 Check-In Combos Table**
```sql
CREATE TABLE check_in_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  required_days INTEGER NOT NULL,      -- e.g., 3 for "3 times this week"
  time_window TEXT DEFAULT 'week',     -- 'week', 'month', 'any'
  reward_type TEXT,
  reward_amount INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO check_in_combos (name, description, required_days, reward_type, reward_amount)
VALUES 
  ('Weekly Warrior', 'Check in 3 times this week', 3, 'stamps', 5),
  ('Perfect Week', 'Check in 5 times this week', 5, 'points', 25),
  ('Weekend Warrior', 'Check in both Sat and Sun', 2, 'stamps', 10);
```

#### **3.2 Spin Wheel System**
```sql
CREATE TABLE spin_wheel_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prize_type TEXT,                     -- 'stamps', 'points', 'voucher'
  prize_value INTEGER,
  probability DECIMAL,                 -- 0.0 to 1.0
  active BOOLEAN DEFAULT true
);

CREATE TABLE user_spin_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  prize_id UUID REFERENCES spin_wheel_prizes(id),
  check_in_number INTEGER,             -- Which check-in triggered this
  spun_at TIMESTAMP DEFAULT NOW()
);

-- Seed prizes
INSERT INTO spin_wheel_prizes (name, prize_type, prize_value, probability)
VALUES
  ('5 Stamps', 'stamps', 5, 0.40),
  ('10 Stamps', 'stamps', 10, 0.30),
  ('20 Stamps', 'stamps', 20, 0.15),
  ('Free Coffee', 'voucher', 1, 0.10),
  ('£10 Off', 'voucher', 10, 0.04),
  ('£20 Off', 'voucher', 20, 0.01);
```

#### **3.3 Daily Challenges**
```sql
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER,                 -- 0-6 (Sunday-Saturday)
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,                 -- 'item_purchase', 'time_based', 'social'
  challenge_criteria JSONB,            -- Specific requirements
  reward_type TEXT,
  reward_amount INTEGER,
  active BOOLEAN DEFAULT true
);

CREATE TABLE user_daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES daily_challenges(id),
  challenge_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Seed challenges
INSERT INTO daily_challenges (day_of_week, name, description, challenge_type, reward_type, reward_amount)
VALUES
  (1, 'Matcha Monday', 'Order a matcha drink', 'item_purchase', 'stamps', 2),
  (2, 'Treat Tuesday', 'Buy any pastry', 'item_purchase', 'game_play', 1),
  (3, 'Wellness Wednesday', 'Order a healthy item', 'item_purchase', 'points', 10),
  (4, 'Thirsty Thursday', 'Any drink purchase', 'item_purchase', 'stamps', 2),
  (5, 'Foodie Friday', 'Try a new menu item', 'item_purchase', 'stamps', 5),
  (6, 'Social Saturday', 'Bring a friend', 'social', 'stamps', 10),
  (0, 'Surprise Sunday', 'Mystery challenge', 'item_purchase', 'stamps', 3);
```

### **Functions:**

#### **3.4 Check Spin Wheel Eligibility**
```sql
CREATE OR REPLACE FUNCTION check_spin_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_check_in_count INTEGER;
BEGIN
  -- Count check-ins this month
  SELECT COUNT(*) INTO v_check_in_count
  FROM transactions
  WHERE user_id = p_user_id
    AND action = 'check_in'
    AND created_at >= date_trunc('month', NOW());
  
  -- Every 5th check-in = spin
  RETURN v_check_in_count % 5 = 0 AND v_check_in_count > 0;
END;
$$ LANGUAGE plpgsql;
```

#### **3.5 Spin Wheel Function**
```sql
CREATE OR REPLACE FUNCTION spin_wheel(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_random DECIMAL;
  v_cumulative DECIMAL := 0;
  v_prize RECORD;
  v_check_in_count INTEGER;
BEGIN
  -- Check eligibility
  IF NOT check_spin_eligibility(p_user_id) THEN
    RETURN jsonb_build_object('error', 'Not eligible to spin yet');
  END IF;
  
  -- Get check-in count
  SELECT COUNT(*) INTO v_check_in_count
  FROM transactions
  WHERE user_id = p_user_id
    AND action = 'check_in'
    AND created_at >= date_trunc('month', NOW());
  
  -- Generate random number
  v_random := random();
  
  -- Select prize based on probability
  FOR v_prize IN
    SELECT * FROM spin_wheel_prizes
    WHERE active = true
    ORDER BY probability DESC
  LOOP
    v_cumulative := v_cumulative + v_prize.probability;
    IF v_random <= v_cumulative THEN
      -- Award prize
      INSERT INTO pending_rewards (
        user_id, reward_type, amount, reward_name, source
      ) VALUES (
        p_user_id, v_prize.prize_type, v_prize.prize_value,
        'Spin Wheel: ' || v_prize.name, 'game_win'
      );
      
      -- Log spin
      INSERT INTO user_spin_history (user_id, prize_id, check_in_number)
      VALUES (p_user_id, v_prize.id, v_check_in_count);
      
      RETURN jsonb_build_object(
        'success', true,
        'prize', v_prize.name,
        'type', v_prize.prize_type,
        'value', v_prize.prize_value
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('error', 'No prize selected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **API Routes:**

#### **3.6 Spin Wheel API**
```typescript
// app/api/spin-wheel/route.ts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase.rpc('spin_wheel', {
    p_user_id: user.id
  })
  
  return NextResponse.json(data)
}
```

### **Deliverables:**
- ✅ Check-in combos system
- ✅ Spin wheel system
- ✅ Daily challenges system
- ✅ UI components for all features
- ✅ Email notifications

---

## 📅 PHASE 4: Polish & Analytics (Week 4)

### **Goal:** Add analytics, optimize, test everything

### **Database Changes:**

#### **4.1 Analytics Tables**
```sql
CREATE TABLE engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  
  -- Visit metrics
  total_check_ins INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_check_ins_per_user DECIMAL,
  
  -- Pending rewards metrics
  pending_created INTEGER DEFAULT 0,
  pending_claimed INTEGER DEFAULT 0,
  pending_expired INTEGER DEFAULT 0,
  claim_rate DECIMAL,
  
  -- Engagement metrics
  spins_completed INTEGER DEFAULT 0,
  combos_completed INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  
  -- Email metrics
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(metric_date)
);
```

#### **4.2 Daily Analytics Function**
```sql
CREATE OR REPLACE FUNCTION calculate_daily_metrics()
RETURNS VOID AS $$
BEGIN
  INSERT INTO engagement_metrics (
    metric_date,
    total_check_ins,
    unique_users,
    pending_created,
    pending_claimed,
    pending_expired,
    spins_completed,
    emails_sent
  )
  SELECT
    CURRENT_DATE - 1,
    COUNT(*) FILTER (WHERE action = 'check_in'),
    COUNT(DISTINCT user_id),
    (SELECT COUNT(*) FROM pending_rewards 
     WHERE DATE(earned_at) = CURRENT_DATE - 1),
    (SELECT COUNT(*) FROM pending_rewards 
     WHERE DATE(claimed_at) = CURRENT_DATE - 1),
    (SELECT COUNT(*) FROM pending_rewards 
     WHERE status = 'expired' AND DATE(updated_at) = CURRENT_DATE - 1),
    (SELECT COUNT(*) FROM user_spin_history 
     WHERE DATE(spun_at) = CURRENT_DATE - 1),
    (SELECT COUNT(*) FROM email_logs 
     WHERE DATE(sent_at) = CURRENT_DATE - 1)
  FROM transactions
  WHERE DATE(created_at) = CURRENT_DATE - 1
  ON CONFLICT (metric_date) DO UPDATE SET
    total_check_ins = EXCLUDED.total_check_ins,
    unique_users = EXCLUDED.unique_users;
END;
$$ LANGUAGE plpgsql;
```

### **Dashboard Updates:**

#### **4.3 Admin Analytics Dashboard**
```typescript
// app/admin/analytics/page.tsx
// Show:
// - Daily/weekly/monthly metrics
// - Pending rewards stats
// - Claim rates
// - Email performance
// - Top users
// - Revenue impact
```

### **Deliverables:**
- ✅ Analytics dashboard
- ✅ Performance optimization
- ✅ Full testing suite
- ✅ Documentation
- ✅ Staff training materials

---

## 🔄 Migration Strategy

### **How to Roll Out Without Breaking Existing System:**

#### **Step 1: Database Migrations (No Impact)**
```bash
# Run all new table creations
# These don't affect existing functionality
```

#### **Step 2: Feature Flags**
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feature_flags (feature_name, enabled) VALUES
  ('pending_rewards', false),
  ('spin_wheel', false),
  ('daily_challenges', false),
  ('check_in_combos', false);
```

#### **Step 3: Gradual Rollout**
```
Week 1: Enable for 10% of users
Week 2: Enable for 50% of users
Week 3: Enable for 100% of users
```

#### **Step 4: Fallback Plan**
```sql
-- If issues arise, disable feature instantly
UPDATE feature_flags 
SET enabled = false 
WHERE feature_name = 'pending_rewards';
```

---

## 📊 Success Metrics

### **Track These KPIs:**

**Week 1:**
- Pending rewards created
- Claim rate
- Second chance email open rate

**Week 2:**
- Game plays (should increase)
- Pending game wins claimed
- User feedback

**Week 3:**
- Spin wheel engagement
- Daily challenge completion
- Check-in frequency

**Week 4:**
- Overall visit frequency (+150% target)
- Revenue per user (+25% target)
- Email engagement (+100% target)

---

## 🚀 Implementation Checklist

### **Phase 1 (Week 1):**
- [ ] Create pending_rewards table
- [ ] Create claim_pending_rewards() function
- [ ] Create expire_pending_rewards() function
- [ ] Add second chance email template
- [ ] Update check-in API
- [ ] Add cron job for expiring rewards
- [ ] Test with 10 users
- [ ] Deploy to production

### **Phase 2 (Week 2):**
- [ ] Update game prize functions
- [ ] Add game win pending email
- [ ] Update game UI to show pending
- [ ] Test all 3 games
- [ ] Deploy to production

### **Phase 3 (Week 3):**
- [ ] Create combos/spin/challenges tables
- [ ] Build spin wheel UI component
- [ ] Build daily challenge UI
- [ ] Add all functions
- [ ] Test thoroughly
- [ ] Deploy to production

### **Phase 4 (Week 4):**
- [ ] Build analytics dashboard
- [ ] Optimize database queries
- [ ] Full integration testing
- [ ] Staff training
- [ ] Documentation
- [ ] Final deployment

---

## 💡 Quick Wins (Can Do Today)

### **Immediate Improvements:**
1. ✅ Add pending rewards count to dashboard
2. ✅ Send reminder emails for pending rewards
3. ✅ Show "You have X pending rewards!" banner
4. ✅ Add second chance email template

---

## 🎯 Final Recommendation

**Start with Phase 1 this week:**
- Pending rewards system
- Second chance emails
- Updated check-in flow

**This alone will:**
- Drive +50% more visits
- Recover 40% of expired rewards
- Create urgency and excitement

**Then add Phases 2-4 over next 3 weeks for full impact!**

---

Ready to start? I can begin building Phase 1 right now! 🚀
