# 🎯 Pending Rewards System - Analysis & Plan

## 📊 Current System (Immediate Rewards)

### **What Happens Now:**
✅ **Referral confirmed** → Points added immediately  
✅ **Game won** → Stamps/points added immediately  
✅ **Signup bonus** → Points added immediately  
✅ **Email rewards** → Vouchers created immediately  
✅ **Win-back offers** → Rewards given immediately  

**Problem:** No incentive to visit the store!

---

## 🎯 Proposed System (Pending Until Check-In)

### **New Flow:**
1. **User earns reward** (referral, game, email offer, etc.)
2. **Reward goes to "pending" state**
3. **Email sent:** "You have X pending rewards! Check in at Penkey to claim them!"
4. **User checks in at store** → All pending rewards transferred
5. **Notification:** "You claimed 5 stamps, 50 points, and 1 free coffee!"

---

## 💡 What Should Be Pending?

### **✅ Should Be Pending (Drives Foot Traffic):**

| Reward Source | Current | Proposed | Why |
|---------------|---------|----------|-----|
| **Referral Points** | Immediate | ⏳ Pending | Bring friend + come claim bonus |
| **Game Wins** | Immediate | ⏳ Pending | Play online, claim in-store |
| **Signup Bonus** | Immediate | ⏳ Pending | Sign up online, visit to activate |
| **Email Offers** | Immediate | ⏳ Pending | Email promo, claim in-store |
| **Win-Back Rewards** | Immediate | ⏳ Pending | Come back to claim your gift |
| **Birthday Bonus** | Immediate | ⏳ Pending | Visit on birthday to claim |
| **Milestone Bonuses** | Immediate | ⏳ Pending | Hit milestone, visit to collect |
| **Streak Bonuses** | Immediate | ⏳ Pending | Keep streak, claim bonus |

### **❌ Should Stay Immediate (Already In-Store):**

| Reward Source | Status | Why |
|---------------|--------|-----|
| **Coffee Stamps** | ✅ Immediate | Already at store buying coffee |
| **In-Store Purchases** | ✅ Immediate | Already at store |
| **Manual Staff Awards** | ✅ Immediate | Staff giving reward in person |
| **Reward Redemptions** | ✅ Immediate | Using reward in-store |

---

## 🗄️ Database Design

### **New Table: `pending_rewards`**

```sql
CREATE TABLE pending_rewards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- What type of reward?
  reward_type TEXT CHECK (reward_type IN (
    'points',           -- Penkey points
    'stamps',           -- Coffee stamps
    'voucher',          -- Free item/discount voucher
    'badge_upgrade',    -- Badge tier upgrade
    'custom'            -- Custom reward
  )),
  
  -- Reward details
  amount INTEGER,                    -- For points/stamps
  voucher_id UUID,                   -- For vouchers
  reward_name TEXT,                  -- Display name
  reward_description TEXT,           -- What they're getting
  
  -- Source tracking
  source TEXT CHECK (source IN (
    'referral',
    'game_win',
    'signup_bonus',
    'email_offer',
    'winback_offer',
    'birthday_bonus',
    'milestone_bonus',
    'streak_bonus',
    'manual_award'
  )),
  source_id UUID,                    -- Link to game_play, referral, etc.
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  
  -- Timestamps
  earned_at TIMESTAMP DEFAULT NOW(),
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP,              -- Optional expiry
  
  -- Metadata
  metadata JSONB,                    -- Extra info
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Updated Flow Examples

### **Example 1: Referral Bonus**

**Before:**
```sql
-- Friend signs up
INSERT INTO referrals (referrer_id, referee_id, confirmed) 
VALUES (user_a, user_b, true);

-- Points added immediately
PERFORM add_points(user_a, 15, 'referral', 'Friend joined');
```

**After:**
```sql
-- Friend signs up
INSERT INTO referrals (referrer_id, referee_id, confirmed) 
VALUES (user_a, user_b, true);

-- Points go to pending
INSERT INTO pending_rewards (
  user_id, reward_type, amount, reward_name, source
) VALUES (
  user_a, 'points', 15, 'Referral Bonus', 'referral'
);

-- Email sent: "You have 15 pending points! Check in to claim!"
```

**On Check-In:**
```sql
-- User checks in at store
-- Transfer all pending rewards
FOR each pending_reward LOOP
  CASE reward_type
    WHEN 'points' THEN
      PERFORM add_points(user_id, amount, source, reward_name);
    WHEN 'stamps' THEN
      INSERT INTO coffee_stamps (user_id, notes)
      VALUES (user_id, 'Claimed: ' || reward_name);
    WHEN 'voucher' THEN
      UPDATE user_rewards SET status = 'active'
      WHERE id = voucher_id;
  END CASE;
  
  UPDATE pending_rewards 
  SET status = 'claimed', claimed_at = NOW()
  WHERE id = pending_reward.id;
END LOOP;
```

---

### **Example 2: Game Win**

**Before:**
```sql
-- User wins game
UPDATE game_plays SET result = 'win', prize = '5 stamps';

-- Stamps added immediately
FOR i IN 1..5 LOOP
  INSERT INTO coffee_stamps (user_id) VALUES (user_id);
END LOOP;
```

**After:**
```sql
-- User wins game
UPDATE game_plays SET result = 'win', prize = '5 stamps';

-- Stamps go to pending
INSERT INTO pending_rewards (
  user_id, reward_type, amount, reward_name, source, source_id
) VALUES (
  user_id, 'stamps', 5, '5 Bonus Stamps from Scratch Card', 'game_win', game_play_id
);

-- Email: "You won 5 stamps! Check in at Penkey to claim them!"
```

---

### **Example 3: Email Win-Back Offer**

**Before:**
```sql
-- User inactive 30 days, send email with offer
-- Stamps added to pending_rewards table (already exists)
-- User checks in → Auto-claimed
```

**After:**
```sql
-- Same flow, but now unified with pending_rewards table!
-- All pending rewards claimed on check-in
```

---

## 📧 Email Updates

### **New Email: "Pending Rewards Reminder"**

Sent when user has unclaimed pending rewards:

```
Subject: 🎁 You Have 3 Pending Rewards!

Hi {{name}},

You have rewards waiting for you at Penkey:

✅ 15 Penkey Points (Referral Bonus)
✅ 5 Coffee Stamps (Scratch Card Win)
✅ Free Coffee Voucher (Birthday Gift)

Check in at Penkey to claim them all!

[Claim My Rewards]
```

---

## 🎯 Benefits

### **For Business:**
✅ **Drives foot traffic** - Users must visit to claim  
✅ **Increases visits** - More reasons to come in  
✅ **Higher conversion** - Pending rewards = future sales  
✅ **Urgency** - Rewards can expire if not claimed  
✅ **Re-engagement** - Remind users of pending rewards  

### **For Users:**
✅ **Excitement** - Anticipation of claiming rewards  
✅ **Clear value** - See exactly what's waiting  
✅ **Gamification** - "Unlock" rewards by visiting  
✅ **Consolidation** - Claim multiple rewards at once  

---

## ⚙️ Implementation Plan

### **Phase 1: Database Setup**
1. Create `pending_rewards` table
2. Add `has_pending_rewards` flag to users
3. Create indexes for performance

### **Phase 2: Update Reward Functions**
1. Modify `add_points()` to support pending
2. Update game win functions
3. Update referral functions
4. Update milestone functions

### **Phase 3: Check-In Flow**
1. Create `claim_pending_rewards()` function
2. Update check-in API to call claim function
3. Add notification on claim

### **Phase 4: Email & Notifications**
1. Email when reward goes pending
2. Daily reminder if unclaimed rewards
3. Expiry warning (3 days before)

### **Phase 5: Dashboard UI**
1. Show pending rewards count
2. "Pending Rewards" section
3. Claim button (only works at store)

---

## 🚨 Edge Cases to Handle

### **1. Expiry**
- Pending rewards expire after X days (configurable)
- Email warning 3 days before expiry
- Auto-expire and notify user

### **2. Multiple Pending Rewards**
- Claim all at once on check-in
- Show summary: "You claimed 3 rewards!"
- Consolidate notifications

### **3. Location Verification**
- Only claim if at Penkey location
- Use existing `validate_location()` function
- Show error if not at store

### **4. Offline Claims**
- Staff can manually claim for user
- QR code scan to claim
- Admin override option

---

## 📊 Metrics to Track

```sql
-- Pending rewards stats
SELECT 
  COUNT(*) as total_pending,
  SUM(CASE WHEN reward_type = 'points' THEN amount ELSE 0 END) as pending_points,
  SUM(CASE WHEN reward_type = 'stamps' THEN amount ELSE 0 END) as pending_stamps,
  COUNT(DISTINCT user_id) as users_with_pending
FROM pending_rewards
WHERE status = 'pending';

-- Claim rate
SELECT 
  source,
  COUNT(*) as total_earned,
  COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
  ROUND(100.0 * COUNT(CASE WHEN status = 'claimed' THEN 1 END) / COUNT(*), 2) as claim_rate
FROM pending_rewards
GROUP BY source;

-- Time to claim
SELECT 
  source,
  AVG(EXTRACT(EPOCH FROM (claimed_at - earned_at)) / 3600) as avg_hours_to_claim
FROM pending_rewards
WHERE status = 'claimed'
GROUP BY source;
```

---

## 🎯 Recommendation

### **Start with these as pending:**
1. ✅ **Referral bonuses** - Biggest impact
2. ✅ **Game wins** - Already online, easy to make pending
3. ✅ **Win-back offers** - Already have this concept
4. ✅ **Email promotions** - Drive store visits

### **Keep immediate:**
1. ✅ **Coffee stamps from purchases** - Already in store
2. ✅ **In-store redemptions** - Already in store
3. ✅ **Staff manual awards** - Already in store

### **Configuration:**
Make it toggleable per reward type in database:
```sql
ALTER TABLE rewards 
ADD COLUMN requires_checkin BOOLEAN DEFAULT false;
```

---

## 🚀 Next Steps

1. **Review this plan** - Does it match your vision?
2. **Decide on expiry** - How long until pending rewards expire?
3. **Choose reward types** - Which should be pending?
4. **Implement Phase 1** - Database setup
5. **Test with one reward type** - Start with referrals
6. **Roll out gradually** - Add more types over time

---

## 💬 Questions to Answer

1. **Expiry time?** 7 days? 14 days? 30 days?
2. **Reminder frequency?** Daily? Every 3 days?
3. **Location strict?** Must be at exact location or within X meters?
4. **Staff override?** Can staff manually claim for users?
5. **Notification style?** Push? Email? Both?

Let me know your thoughts and I'll build it! 🎉
