# ☕ PENKEY PERKS - SYSTEM LOGIC & HOW IT WORKS

**Complete guide to the 3-tier rewards system**

---

## 🎯 OVERVIEW

Penkey Perks uses a **3-tier rewards system** to engage customers and drive repeat visits:

1. **Points System** → Money-off vouchers
2. **Coffee Stamps** → Free coffee
3. **Games System** → Instant prizes

Plus a **Badges & Milestones** system for lifetime achievements!

---

## 💰 TIER 1: POINTS SYSTEM

### **How It Works:**
Customers earn points for various activities and redeem them for money-off vouchers.

### **Earning Points:**

| Activity | Points | Frequency | Notes |
|----------|--------|-----------|-------|
| **Visit/Check-in** | 5 | Once per day | Tap NFC at counter |
| **Referral confirmed** | 10 | Unlimited | When friend checks in first time |
| **Social media share** | 5 | Once per week | Share on Instagram/Facebook |
| **Birthday** | 50 | Once per year | Auto-awarded on birthday |
| **Game bonus** | 5-20 | Once per day | Win from daily game |
| **Review posted** | 15 | Once | Google/Facebook review |
| **Streak bonus** | 10 | Weekly | 7 days in a row |

### **Spending Points:**

| Reward | Points Required | Value | Expiry |
|--------|----------------|-------|--------|
| £5 off voucher | 50 | £5.00 | 30 days |
| £10 off voucher | 90 | £10.00 | 30 days |
| 20% off voucher | 75 | 20% | 14 days |
| Free pastry | 30 | £3.00 | 30 days |

### **Technical Implementation:**

```sql
-- Points are tracked in a ledger
CREATE TABLE points_transactions (
  user_id UUID,
  amount INTEGER, -- positive = earn, negative = spend
  balance_after INTEGER,
  source TEXT, -- 'visit', 'referral', 'game_bonus', etc.
  created_at TIMESTAMP
);

-- Add points function
SELECT add_points(
  user_id, 
  5, -- amount
  'visit', -- source
  'Daily check-in' -- description
);
```

### **User Flow:**
1. Customer visits Penkey
2. Taps NFC at counter → `/check-in`
3. System awards 5 points
4. Points accumulate over time
5. At 50 points, can redeem £5 off voucher
6. Voucher generated with QR code
7. Show QR to staff to use

---

## ☕ TIER 2: COFFEE STAMPS

### **How It Works:**
Traditional stamp card - buy 10 coffees, get 1 free!

### **Earning Stamps:**
- **Only when buying coffee** (not just visiting)
- Customer taps NFC tag at coffee machine
- GPS validates location (must be within 50m of shop)
- Rate limited to 1 stamp per hour (prevent abuse)

### **Rewards:**
- **10 stamps** = 1 free coffee voucher
- Voucher expires in 30 days
- Can collect multiple free coffees

### **Technical Implementation:**

```sql
-- Coffee stamps table
CREATE TABLE coffee_stamps (
  user_id UUID,
  latitude DECIMAL, -- GPS coordinates
  longitude DECIMAL,
  location_verified BOOLEAN,
  created_at TIMESTAMP
);

-- Add stamp with validation
SELECT add_coffee_stamp(
  user_id,
  51.5074, -- latitude
  -0.1278  -- longitude
);
```

### **Anti-Cheat Measures:**
1. **GPS Validation** - Must be within 50m of shop
2. **Rate Limiting** - Max 1 stamp per hour
3. **Location Logging** - All GPS coords stored
4. **Admin Review** - Flag suspicious patterns

### **User Flow:**
1. Customer buys coffee
2. Taps NFC tag on coffee machine → `/add-coffee`
3. Browser requests GPS permission
4. System validates location
5. If valid, adds stamp
6. At 10 stamps, auto-generates free coffee voucher
7. Show QR to staff to redeem

---

## 🎮 TIER 3: GAMES SYSTEM

### **How It Works:**
Play a fun daily game for instant prizes!

### **Game Rules:**
- **1 random game per day** (Scratch Card, Spin Wheel, or Duck Pond)
- Everyone sees the same game on the same day
- Can only play after checking in
- Prizes include food, drinks, points, or stamps

### **Prize Types:**

| Category | Examples | Probability | Stock Limit |
|----------|----------|-------------|-------------|
| **Food** | Bacon bap, pastry, sandwich | 10% | 5 per day |
| **Drink** | Latte, cappuccino, tea | 15% | 10 per day |
| **Points** | 5-20 bonus points | 25% | Unlimited |
| **Stamps** | 1-3 coffee stamps | 20% | Unlimited |
| **Nothing** | Try again tomorrow | 30% | Unlimited |

### **Technical Implementation:**

```sql
-- Game prizes with stock management
CREATE TABLE game_prizes (
  game_id UUID,
  prize_category TEXT, -- 'food', 'drink', 'points', 'stamps'
  prize_value INTEGER,
  probability DECIMAL, -- 0.10 = 10%
  stock_limit INTEGER, -- NULL = unlimited
  stock_used INTEGER, -- resets daily
  active BOOLEAN
);

-- Play game function
SELECT play_game_enhanced(user_id, game_id);
```

### **Stock Management:**
- Admin sets daily stock limits
- When limit reached, prize becomes unavailable
- Stock resets at midnight (cron job)
- Prevents giving away too many prizes

### **User Flow:**
1. Customer checks in at counter
2. Dashboard shows today's game
3. Taps "Play Now"
4. Game animation plays
5. Prize revealed
6. If food/drink → instant voucher created
7. If points → added to balance
8. If stamps → added to stamp card

---

## 🏆 TIER 4: BADGES & MILESTONES

### **How It Works:**
Earn fun badges based on lifetime points and achievements!

### **Badge Tiers:**

| Badge | Points Required | Perks | Fun Title |
|-------|----------------|-------|-----------|
| **Penkey Newbie** | 0-49 | Welcome bonus | "Fresh Duck" |
| **Penkey Regular** | 50-199 | 5% birthday bonus | "Quacking Customer" |
| **Penkey VIP** | 200-499 | Priority support | "Duck Commander" |
| **Penkey Champion** | 500-999 | Exclusive rewards | "Lord of the Ducks" |
| **Penkey Legend** | 1000-1999 | VIP events | "Penkey Privateer" |
| **Penkey Master** | 2000+ | Lifetime perks | "Grand Duck Master" |

### **Milestone Rewards:**

| Milestone | Reward | Type |
|-----------|--------|------|
| **First visit** | +10 bonus points | One-time |
| **10 visits** | Free pastry | One-time |
| **25 visits** | £5 voucher | One-time |
| **50 visits** | Free coffee for a week | One-time |
| **100 visits** | £20 voucher + VIP badge | One-time |
| **Birthday** | 50 points + free item | Yearly |
| **Anniversary** | 100 points | Yearly |

### **Technical Implementation:**

```sql
-- User badges table
CREATE TABLE user_badges (
  user_id UUID,
  badge_tier TEXT,
  badge_name TEXT,
  earned_at TIMESTAMP,
  lifetime_points INTEGER
);

-- Milestones table
CREATE TABLE milestones (
  id UUID,
  name TEXT,
  description TEXT,
  requirement_type TEXT, -- 'visits', 'points', 'stamps'
  requirement_value INTEGER,
  reward_type TEXT,
  reward_value TEXT,
  one_time BOOLEAN
);

-- Check and award milestones
CREATE FUNCTION check_milestones(user_id UUID);
```

### **Badge Display:**
- Shows on dashboard
- Shows on profile
- Animated badge unlock
- Share badge on social media
- Leaderboard (optional)

---

## 🔄 COMPLETE USER JOURNEY

### **Day 1 - New Customer:**
1. Signs up → **+10 points** (first visit milestone)
2. Completes onboarding
3. Visits Penkey, buys coffee
4. Taps NFC at counter → **+5 points** (check-in)
5. Taps NFC at coffee machine → **+1 stamp**
6. Plays daily game → Wins **+10 points**
7. **Total: 25 points, 1 stamp**

### **Day 7 - Regular Customer:**
1. 7th consecutive visit → **+10 points** (streak bonus)
2. Check-in → **+5 points**
3. Buys coffee → **+1 stamp**
4. Plays game → Wins free pastry
5. **Total: 60 points, 7 stamps**
6. Redeems £5 off voucher (50 points)
7. **Remaining: 10 points, 7 stamps**

### **Day 30 - Loyal Customer:**
1. 30 visits total → **Unlocks "Penkey Regular" badge**
2. 10 coffee stamps → **Free coffee voucher**
3. 150 lifetime points → **5% birthday bonus unlocked**
4. Refers 3 friends → **+30 points**
5. **Status: VIP perks activated**

---

## 📊 ADMIN CONFIGURATION

### **Points Rewards:**
Admin can create/edit money-off vouchers:
- Set points required
- Set discount value (fixed or %)
- Set expiry days
- Set stock limits
- Enable/disable

### **Game Prizes:**
Admin can configure prizes:
- Set prize category (food/drink/points/stamps)
- Set probability (must sum to 100%)
- Set daily stock limit
- Upload prize image
- Enable/disable

### **Milestones:**
Admin can create custom milestones:
- Set requirement (visits/points/stamps)
- Set threshold value
- Set reward type
- Set one-time or repeating
- Enable/disable

### **Badges:**
Admin can customize badge tiers:
- Set points thresholds
- Set badge names/titles
- Set perks for each tier
- Upload badge images

---

## 🎯 BUSINESS LOGIC

### **Why 3 Tiers?**

1. **Points** - Drives overall engagement
   - Rewards all activities
   - Flexible redemption options
   - Easy to understand

2. **Coffee Stamps** - Drives coffee sales
   - Traditional loyalty card feel
   - Specific to coffee purchases
   - GPS prevents abuse

3. **Games** - Adds fun & surprise
   - Daily engagement hook
   - Instant gratification
   - Controlled costs (stock limits)

### **Why Badges?**

1. **Gamification** - Makes it fun
2. **Status** - Customers love titles
3. **Retention** - Long-term goals
4. **Sharing** - Social proof
5. **Segmentation** - Target VIPs

---

## 🔐 SECURITY & FRAUD PREVENTION

### **GPS Validation:**
```typescript
// Validate user is at shop
const SHOP_LAT = 51.5074 // Replace with actual
const SHOP_LNG = -0.1278
const MAX_DISTANCE = 50 // meters

function validateLocation(userLat, userLng) {
  const distance = calculateDistance(
    SHOP_LAT, SHOP_LNG,
    userLat, userLng
  )
  return distance <= MAX_DISTANCE
}
```

### **Rate Limiting:**
- Check-in: 1 per 24 hours
- Coffee stamp: 1 per hour
- Games: 1 per day
- Points redemption: 5 per day

### **Fraud Detection:**
- Log all GPS coordinates
- Flag impossible travel times
- Detect GPS spoofing
- Admin review interface
- Automatic account suspension

---

## 📱 TECHNICAL ARCHITECTURE

### **Database:**
```
points_transactions → Track all point movements
coffee_stamps → Track coffee purchases
game_plays → Track game history
user_badges → Track earned badges
milestones → Define milestone rewards
points_rewards → Define redemption options
```

### **APIs:**
```
POST /api/check-in → Award 5 points
POST /api/add-coffee → Add stamp (GPS validated)
POST /api/games/play → Play daily game
POST /api/points → Redeem points
GET /api/points → View balance & history
```

### **Functions:**
```sql
get_user_points(user_id) → Current balance
add_points(user_id, amount, source) → Add/remove points
add_coffee_stamp(user_id, lat, lng) → Add stamp
validate_location(lat, lng) → Check GPS
play_game_enhanced(user_id, game_id) → Play game
check_milestones(user_id) → Award milestones
```

---

## 🎨 UI/UX DESIGN

### **Dashboard Layout:**
```
┌─────────────────────────────────┐
│  Today's Visit                   │
│  Status: Ready / Checked in      │
│  Last visit: 9 Oct at 14:30      │
│  Points earned today: 5          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  💰 Your Points: 45              │
│  Next reward: £5 off (5 more!)   │
│  [View Rewards]                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ☕ Coffee Stamp Card             │
│  ☕☕☕☕☕ ○○○○○                   │
│  5/10 stamps                     │
│  [Tap NFC to add stamp]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🎮 Daily Game                   │
│  Today: Scratch Card             │
│  [Play Now]                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🏆 Your Badge                   │
│  Penkey Regular                  │
│  150 lifetime points             │
│  Next: VIP (50 more!)            │
└─────────────────────────────────┘
```

---

## 📈 ANALYTICS & INSIGHTS

### **Key Metrics:**
- Daily active users
- Average points per user
- Stamp completion rate
- Game play rate
- Prize redemption rate
- Customer lifetime value
- Churn rate
- Referral conversion rate

### **Customer Segments:**
- **New** (0-4 visits)
- **Occasional** (5-9 visits)
- **Regular** (10-19 visits)
- **VIP** (20+ visits)

### **Personalization:**
- Favorite items
- Visit patterns (time/day)
- Preferred games
- Redemption behavior

---

## 🚀 FUTURE ENHANCEMENTS

### **Planned Features:**
- [ ] Push notifications
- [ ] Email automation
- [ ] Social sharing templates
- [ ] Leaderboards
- [ ] Friend challenges
- [ ] Apple Wallet integration
- [ ] Seasonal events
- [ ] Partner rewards
- [ ] ML recommendations
- [ ] Predictive offers

---

## 📞 SUPPORT

### **For Customers:**
- In-app help center
- Email: perks@penkey.co.uk
- Phone: [TBD]

### **For Staff:**
- Admin panel documentation
- Training videos
- Support hotline

---

**Last Updated:** 2025-10-09  
**Version:** 2.0 (3-Tier System)  
**Status:** Ready for implementation
