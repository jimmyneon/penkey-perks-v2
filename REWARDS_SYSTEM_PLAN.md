# 🎯 PENKEY PERKS - 3-TIER REWARDS SYSTEM

**Created:** 2025-10-09  
**Status:** Planning Phase  
**Priority:** High

---

## 📊 SYSTEM OVERVIEW

### **3 Independent Systems:**

1. **POINTS SYSTEM** → Money-off vouchers (£5, £10, 20% off)
2. **COFFEE STAMPS** → Free coffee (10 stamps = 1 free)
3. **GAMES SYSTEM** → Instant prizes (food items, drinks)

---

## 🗄️ DATABASE SCHEMA

### **1. Points System**

```sql
-- Points ledger (tracks all point transactions)
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Can be positive or negative
  balance_after INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN (
    'visit', 'referral', 'share', 'birthday', 
    'game_bonus', 'manual_add', 'manual_remove', 'redemption'
  )),
  description TEXT,
  metadata JSONB, -- Extra data (e.g., referral_id, reward_id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points rewards catalog
CREATE TABLE points_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('fixed_discount', 'percentage_discount')),
  discount_value DECIMAL NOT NULL, -- e.g., 5.00 for £5 off, or 20 for 20%
  expiry_days INTEGER DEFAULT 30,
  stock INTEGER, -- NULL = unlimited
  active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's points balance (computed from transactions)
CREATE VIEW user_points_balance AS
SELECT 
  user_id,
  COALESCE(SUM(amount), 0) as total_points
FROM points_transactions
GROUP BY user_id;

-- Function to get user's current points
CREATE OR REPLACE FUNCTION get_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT total_points FROM user_points_balance WHERE user_id = p_user_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add points
CREATE OR REPLACE FUNCTION add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  v_new_balance := get_user_points(p_user_id) + p_amount;
  
  -- Insert transaction
  INSERT INTO points_transactions (
    user_id, amount, balance_after, source, description, metadata
  ) VALUES (
    p_user_id, p_amount, v_new_balance, p_source, p_description, p_metadata
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **2. Coffee Stamps System**

```sql
-- Rename ducks to coffee_stamps
ALTER TABLE ducks RENAME TO coffee_stamps;

-- Add geolocation columns
ALTER TABLE coffee_stamps 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN location_verified BOOLEAN DEFAULT FALSE;

-- Function to validate location
CREATE OR REPLACE FUNCTION validate_location(
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_shop_lat DECIMAL := 51.5074; -- Replace with actual Penkey coordinates
  v_shop_lng DECIMAL := -0.1278; -- Replace with actual Penkey coordinates
  v_distance DECIMAL;
  v_max_distance DECIMAL := 0.0005; -- ~50 meters in degrees
BEGIN
  -- Calculate distance (simplified for small distances)
  v_distance := SQRT(
    POWER(p_lat - v_shop_lat, 2) + 
    POWER(p_lng - v_shop_lng, 2)
  );
  
  RETURN v_distance <= v_max_distance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add coffee stamp with geo-validation
CREATE OR REPLACE FUNCTION add_coffee_stamp(
  p_user_id UUID,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_can_add BOOLEAN;
  v_location_valid BOOLEAN := FALSE;
  v_stamp_count INTEGER;
  v_last_stamp TIMESTAMP;
BEGIN
  -- Check if user added stamp in last hour (rate limiting)
  SELECT MAX(created_at) INTO v_last_stamp
  FROM coffee_stamps
  WHERE user_id = p_user_id;
  
  IF v_last_stamp IS NOT NULL AND (NOW() - v_last_stamp) < INTERVAL '1 hour' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You can only add one stamp per hour'
    );
  END IF;
  
  -- Validate location if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location_valid := validate_location(p_latitude, p_longitude);
    
    IF NOT v_location_valid THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'You must be at Penkey to add a coffee stamp'
      );
    END IF;
  END IF;
  
  -- Add stamp
  INSERT INTO coffee_stamps (user_id, latitude, longitude, location_verified)
  VALUES (p_user_id, p_latitude, p_longitude, v_location_valid);
  
  -- Get new count
  SELECT COUNT(*) INTO v_stamp_count
  FROM coffee_stamps
  WHERE user_id = p_user_id;
  
  -- Check if reached 10 stamps
  IF v_stamp_count % 10 = 0 THEN
    -- Auto-issue free coffee reward
    -- (This will be handled by trigger or separate function)
    NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'stamp_count', v_stamp_count,
    'message', 'Coffee stamp added!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **3. Games System Enhancement**

```sql
-- Add columns to game_prizes
ALTER TABLE game_prizes
ADD COLUMN image_url TEXT,
ADD COLUMN stock_limit INTEGER, -- Daily stock limit
ADD COLUMN stock_used INTEGER DEFAULT 0, -- How many won today
ADD COLUMN active BOOLEAN DEFAULT TRUE,
ADD COLUMN prize_category TEXT CHECK (prize_category IN ('food', 'drink', 'discount', 'points'));

-- Reset daily stock function (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_game_stock()
RETURNS VOID AS $$
BEGIN
  UPDATE game_prizes SET stock_used = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to play game with stock checking
CREATE OR REPLACE FUNCTION play_game_with_stock(
  p_user_id UUID,
  p_game_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_can_play BOOLEAN;
  v_prize RECORD;
  v_random DECIMAL;
  v_cumulative_prob DECIMAL := 0;
BEGIN
  -- Check if user can play
  SELECT can_play_game(p_user_id, p_game_id) INTO v_can_play;
  
  IF NOT v_can_play THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'You have already played today'
    );
  END IF;
  
  -- Get random number
  v_random := random();
  
  -- Select prize based on probability and stock
  FOR v_prize IN 
    SELECT * FROM game_prizes 
    WHERE game_id = p_game_id 
      AND active = TRUE
      AND (stock_limit IS NULL OR stock_used < stock_limit)
    ORDER BY probability DESC
  LOOP
    v_cumulative_prob := v_cumulative_prob + v_prize.probability;
    
    IF v_random <= v_cumulative_prob THEN
      -- Winner!
      
      -- Update stock
      IF v_prize.stock_limit IS NOT NULL THEN
        UPDATE game_prizes 
        SET stock_used = stock_used + 1 
        WHERE id = v_prize.id;
      END IF;
      
      -- Log game play
      INSERT INTO game_plays (user_id, game_id, prize_type, prize_value, reward_id)
      VALUES (p_user_id, p_game_id, v_prize.prize_type, v_prize.prize_value, NULL);
      
      -- Award prize based on type
      IF v_prize.prize_type = 'ducks' THEN
        -- Add coffee stamps
        PERFORM add_coffee_stamp(p_user_id, NULL, NULL);
      ELSIF v_prize.prize_type = 'points' THEN
        -- Add points
        PERFORM add_points(p_user_id, v_prize.prize_value, 'game_bonus', 'Won from ' || v_prize.label);
      ELSIF v_prize.prize_type = 'reward' THEN
        -- Create instant reward voucher
        -- (Handle separately)
        NULL;
      END IF;
      
      RETURN jsonb_build_object(
        'success', TRUE,
        'prize', row_to_json(v_prize)
      );
    END IF;
  END LOOP;
  
  -- No prize (shouldn't happen if probabilities sum to 1)
  RETURN jsonb_build_object(
    'success', TRUE,
    'prize', NULL,
    'message', 'Better luck next time!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎮 POINTS EARNING RULES

### **How Users Earn Points:**

| Activity | Points | Frequency | Notes |
|----------|--------|-----------|-------|
| Visit/Check-in | 5 | Once per day | Tap NFC at counter |
| Coffee purchase | 0 | Unlimited | Earns stamp instead |
| Referral confirmed | 10 | Unlimited | When friend checks in |
| Social media share | 5 | Once per week | Share on Instagram/Facebook |
| Birthday | 20 | Once per year | Auto-awarded on birthday |
| Game bonus | 5-20 | Once per day | Win from daily game |
| Review posted | 15 | Once | Google/Facebook review |
| Streak bonus | 10 | Weekly | 7 days in a row |

### **Points Rewards Catalog:**

| Reward | Points Required | Value | Expiry |
|--------|----------------|-------|--------|
| £5 off | 50 | £5.00 | 30 days |
| £10 off | 90 | £10.00 | 30 days |
| 20% off | 75 | 20% | 14 days |
| Free pastry | 30 | £3.00 | 30 days |

---

## ☕ COFFEE STAMPS RULES

### **How Users Earn Stamps:**

1. **Buy coffee** → Tap NFC tag at counter
2. **Geo-validation** → Must be within 50m of shop
3. **Rate limiting** → Max 1 stamp per hour
4. **Reward** → 10 stamps = 1 free coffee voucher

### **Anti-Cheat Measures:**

- ✅ GPS validation (50m radius)
- ✅ Rate limiting (1 per hour)
- ✅ Device fingerprinting
- ✅ Timestamp validation
- ✅ Admin can review suspicious activity

---

## 🎲 GAMES SYSTEM RULES

### **Daily Game Flow:**

1. User checks in at counter (earns 5 points)
2. Unlocks today's random game
3. Plays game once per day
4. Wins instant prize based on odds
5. Prize types:
   - **Food items** (bacon bap, pastry, etc.)
   - **Drinks** (latte, cappuccino, etc.)
   - **Points bonus** (5-20 points)
   - **Coffee stamps** (1-3 stamps)

### **Prize Configuration (Admin):**

```javascript
// Example prize setup
{
  game: "Scratch Card",
  prizes: [
    {
      name: "Free Bacon Bap",
      category: "food",
      probability: 0.10, // 10%
      stock_limit: 5, // Max 5 per day
      image: "/prizes/bacon-bap.jpg"
    },
    {
      name: "Free Latte",
      category: "drink",
      probability: 0.15, // 15%
      stock_limit: 10,
      image: "/prizes/latte.jpg"
    },
    {
      name: "10 Bonus Points",
      category: "points",
      probability: 0.25, // 25%
      stock_limit: null, // Unlimited
      value: 10
    },
    {
      name: "2 Coffee Stamps",
      category: "stamps",
      probability: 0.20, // 20%
      stock_limit: null,
      value: 2
    },
    {
      name: "Better Luck Tomorrow",
      category: "nothing",
      probability: 0.30, // 30%
      stock_limit: null
    }
  ]
}
```

---

## 📱 USER DASHBOARD LAYOUT

```
┌─────────────────────────────────────────┐
│  Today's Visit                          │
│  ✅ Checked in at 14:30                 │
│  Earned: 5 points                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ☕ Coffee Stamp Card                    │
│  ☕☕☕☕☕ ○○○○○                         │
│  5/10 stamps - Tap NFC when you buy!    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  💰 Your Points: 45                     │
│  ┌─────────────────────────────────┐   │
│  │ £5 off voucher - 50 pts         │   │
│  │ 5 more points needed!            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎮 Daily Game                          │
│  Today: Scratch Card                    │
│  [Play Now] - Win instant prizes!       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎁 Active Rewards (3)                  │
│  • Free Latte (expires in 5 days)      │
│  • £5 off voucher (expires in 12 days) │
│  • Free Bacon Bap (expires tomorrow)   │
└─────────────────────────────────────────┘
```

---

## 🔗 NFC TAG URLS

### **1. Check-In Tag (Counter)**
```
URL: https://perks.penkey.co.uk/check-in
Purpose: Daily visit check-in
Reward: 5 points
```

### **2. Coffee Stamp Tag (Coffee Machine)**
```
URL: https://perks.penkey.co.uk/add-coffee
Purpose: Add coffee stamp
Validation: GPS required (50m radius)
Reward: 1 coffee stamp
```

### **3. View Dashboard Tag (Table/Wall)**
```
URL: https://perks.penkey.co.uk/dashboard
Purpose: Quick access to rewards
```

---

## 🛠️ ADMIN PANEL FEATURES

### **Points Management:**
- ✅ View all points transactions
- ✅ Manually add/remove points
- ✅ Create/edit points rewards
- ✅ Set points earning rules
- ✅ Track redemption rates

### **Coffee Stamps:**
- ✅ View stamp history
- ✅ Manually add/remove stamps
- ✅ Review geo-validation logs
- ✅ Flag suspicious activity
- ✅ Set shop coordinates

### **Games Configuration:**
- ✅ Create/edit prizes
- ✅ Set probability odds
- ✅ Upload prize images
- ✅ Set daily stock limits
- ✅ Enable/disable prizes
- ✅ View win statistics

### **Analytics Dashboard:**
- ✅ Total points issued
- ✅ Total stamps collected
- ✅ Games played
- ✅ Prizes won
- ✅ Redemption rates
- ✅ Revenue impact

---

## 📈 IMPLEMENTATION PHASES

### **Phase 1: Database (Week 1)**
- [ ] Create points_transactions table
- [ ] Create points_rewards table
- [ ] Rename ducks → coffee_stamps
- [ ] Add geolocation columns
- [ ] Create all functions
- [ ] Migrate existing data
- [ ] Add RLS policies

### **Phase 2: Points System (Week 2)**
- [ ] Points API endpoints
- [ ] Points display on dashboard
- [ ] Points rewards catalog page
- [ ] Redeem points flow
- [ ] Admin points management

### **Phase 3: Coffee Stamps (Week 3)**
- [ ] /add-coffee endpoint
- [ ] Geolocation validation
- [ ] Rate limiting
- [ ] Update stamp card UI
- [ ] Auto-reward at 10 stamps

### **Phase 4: Games Enhancement (Week 4)**
- [ ] Update game prizes schema
- [ ] Stock management
- [ ] Prize images
- [ ] Admin configuration UI
- [ ] Enhanced prize display

### **Phase 5: Admin Panel (Week 5)**
- [ ] Points management UI
- [ ] Game prizes configuration
- [ ] Analytics dashboard
- [ ] Reporting tools

---

## 🎯 SUCCESS METRICS

### **KPIs to Track:**
- Daily active users
- Average points per user
- Stamp completion rate (reach 10)
- Game play rate
- Prize redemption rate
- Customer retention (7-day, 30-day)
- Revenue per customer
- Referral conversion rate

---

## 🚀 LAUNCH CHECKLIST

### **Before Launch:**
- [ ] All database migrations run
- [ ] RLS policies tested
- [ ] GPS validation tested at shop
- [ ] NFC tags programmed
- [ ] Admin panel tested
- [ ] User testing completed
- [ ] Analytics tracking setup
- [ ] Backup/restore tested

### **Day 1:**
- [ ] Monitor error logs
- [ ] Check GPS validation accuracy
- [ ] Verify prize odds working
- [ ] Track user engagement
- [ ] Gather feedback

---

## 💡 FUTURE ENHANCEMENTS

### **Phase 6+ Ideas:**
- Push notifications for rewards
- Personalized offers based on history
- Leaderboards (optional)
- Social sharing bonuses
- Seasonal events/promotions
- Partner rewards
- Apple Wallet / Google Pay integration
- Birthday auto-rewards
- Streak bonuses
- Friend challenges

---

**Status:** Ready for implementation  
**Next Step:** Create database migration SQL  
**Estimated Time:** 5 weeks full implementation
