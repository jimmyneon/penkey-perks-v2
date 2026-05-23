# 🫘 Beans System - Complete Implementation Plan

## 📅 4-Week Implementation Timeline

### Week 1: Database & Backend (Oct 14-18)

#### Day 1-2: Database Migration
- [ ] **Backup production database**
- [ ] **Test migration on staging**
  ```bash
  # Create staging backup
  supabase db dump > backup_pre_beans_$(date +%Y%m%d).sql
  
  # Run migration on staging
  supabase db push --db-url [STAGING_URL]
  ```
- [ ] **Verify migration results:**
  - All balances multiplied by 10x
  - New point configs created
  - Signup bonus trigger working
  - Streak bonuses configured

#### Day 3-4: Backend Testing
- [ ] **Test signup flow** - New users get 250 beans + coffee (pending)
- [ ] **Test check-in** - Pending rewards unlock correctly
- [ ] **Test streak bonuses** - 7, 14, 30 day streaks award correctly
- [ ] **Test game wins** - Points awarded as pending, unlock on check-in
- [ ] **Test referrals** - 400 beans for signup, 600 for purchase

#### Day 5: Production Migration
- [ ] **Schedule maintenance window** (early morning, low traffic)
- [ ] **Run production migration**
- [ ] **Verify all existing users** have 10x balances
- [ ] **Monitor error logs** for 24 hours

**Deliverables:**
- ✅ Database migrated
- ✅ All functions updated
- ✅ Signup bonus active
- ✅ Existing users have 10x beans

---

### Week 2: Frontend Rebrand (Oct 21-25)

#### Day 1: Core Components
- [ ] **Update Points Card** (`/components/dashboard/points-card.tsx`)
  - Add bean emoji 🫘
  - Change "points" → "beans"
  - Add brown gradient background
  - Add animated bean counter

- [ ] **Update Rewards Page** (`/app/rewards/page.tsx`)
  - Update all cost displays
  - Add "beans required" labels
  - Update progress bars with bean theme

- [ ] **Update Dashboard** (`/app/dashboard/page.tsx`)
  - Update stats cards
  - Add bean-themed colors
  - Update transaction history

#### Day 2: Admin Dashboard
- [ ] **Points Config Page** (`/app/admin/points-config/page.tsx`)
  - Update table headers
  - Update form labels
  - Add bean icon to displays

- [ ] **Rewards Management** (`/app/admin/rewards/page.tsx`)
  - Update cost fields
  - Add bean-themed styling

#### Day 3: Type Definitions & API
- [ ] **Update types** (`/types/database.ts`)
  - Add BeansBalance, BeansTransaction types
  - Update existing interfaces

- [ ] **Update API routes**
  - `/app/api/points/*` → Update responses to use "beans"
  - Add currency metadata to responses

#### Day 4: Email Templates
- [ ] **Update all email templates** in migrations
  - Welcome email
  - Reward notifications
  - Streak bonuses
  - Migration announcement

#### Day 5: Testing & Polish
- [ ] **Visual testing** - All "points" replaced
- [ ] **Mobile testing** - Bean emoji displays correctly
- [ ] **Accessibility testing** - Screen readers handle "beans"
- [ ] **Cross-browser testing**

**Deliverables:**
- ✅ All UI updated to "beans"
- ✅ Bean emoji throughout
- ✅ Brown color scheme applied
- ✅ Mobile responsive

---

### Week 3: Creative Features (Oct 28-Nov 1)

#### Implement Creative Bean Ideas (see below)
- [ ] **Bean Jar Progress Visualization**
- [ ] **Golden Bean Hunt** (GPS feature)
- [ ] **Bean Multiplier Events**
- [ ] **Bean Leaderboard**
- [ ] **Achievement Badges**

**Deliverables:**
- ✅ 2-3 creative features launched
- ✅ User engagement hooks active

---

### Week 4: Launch & Monitor (Nov 4-8)

#### Day 1: Soft Launch
- [ ] **Deploy to production**
- [ ] **Enable for 10% of users** (feature flag)
- [ ] **Monitor metrics:**
  - Signup rate
  - Check-in frequency
  - Error rates
  - User feedback

#### Day 2-3: Gradual Rollout
- [ ] **50% of users**
- [ ] **Monitor and adjust**
- [ ] **Fix any issues**

#### Day 4: Full Launch
- [ ] **100% rollout**
- [ ] **Send announcement emails**
- [ ] **Post on social media**
- [ ] **Update website**

#### Day 5: Post-Launch
- [ ] **Monitor metrics**
- [ ] **Respond to feedback**
- [ ] **Optimize based on data**

**Deliverables:**
- ✅ Full production launch
- ✅ All users migrated
- ✅ Marketing campaign live
- ✅ Metrics tracking active

---

## 🎨 Creative Bean Opportunities

### 1. Bean Jar Visualization 🫙

**Concept:** Visual bean jar that fills up as users earn beans

```tsx
export function BeanJar({ beans, nextReward }: { beans: number; nextReward: number }) {
  const fillPercentage = Math.min((beans / nextReward) * 100, 100);
  
  return (
    <div className="relative w-48 h-64 mx-auto">
      {/* Jar outline */}
      <div className="absolute inset-0 border-4 border-[#8B4513] rounded-b-3xl rounded-t-lg bg-gradient-to-b from-transparent to-amber-50">
        {/* Beans filling up */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#8B4513] to-[#D2691E] rounded-b-3xl"
          style={{ height: `${fillPercentage}%` }}
          initial={{ height: 0 }}
          animate={{ height: `${fillPercentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Animated beans */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: Math.floor(beans / 100) }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-2xl"
                initial={{ y: -20, opacity: 0 }}
                animate={{ 
                  y: Math.random() * 100 + '%',
                  x: Math.random() * 100 + '%',
                  opacity: 1,
                  rotate: Math.random() * 360
                }}
                transition={{ delay: i * 0.1 }}
              >
                🫘
              </motion.span>
            ))}
          </div>
        </motion.div>
        
        {/* Label */}
        <div className="absolute -top-8 left-0 right-0 text-center">
          <p className="text-sm text-gray-600">Your Bean Jar</p>
          <p className="text-2xl font-bold text-[#8B4513]">{beans}</p>
        </div>
      </div>
    </div>
  );
}
```

**Impact:** Visual, satisfying, Instagram-worthy

---

### 2. Golden Bean Hunt 🏆

**Concept:** GPS-based treasure hunt with rare "Golden Beans" hidden around town

**Implementation:**
```sql
-- Add golden_beans table
CREATE TABLE public.golden_beans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  beans_value INTEGER DEFAULT 750,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'legendary')),
  active BOOLEAN DEFAULT TRUE,
  max_claims INTEGER, -- NULL = unlimited
  claims_count INTEGER DEFAULT 0,
  hint TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user claims
CREATE TABLE public.golden_bean_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  golden_bean_id UUID REFERENCES public.golden_beans(id),
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, golden_bean_id)
);
```

**Features:**
- **Common Beans** (100 beans) - Near Penkey, easy to find
- **Rare Beans** (500 beans) - Around town, need hints
- **Legendary Golden Bean** (2000 beans) - Changes location weekly, cryptic clues

**Gamification:**
- Map showing nearby beans (blur exact location)
- "Hot/Cold" indicator as you get closer
- Achievement for collecting all beans
- Weekly leaderboard for most beans found

**Marketing:**
- Partner with local businesses to place beans
- Social media clues
- "Bean of the Week" feature

---

### 3. Bean Multiplier Events ⚡

**Concept:** Limited-time events where beans earned are multiplied

**Event Types:**

#### Happy Hour (Daily)
```sql
-- 2x beans during slow hours (2-4pm weekdays)
CREATE TABLE public.multiplier_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  multiplier DECIMAL DEFAULT 2.0,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[], -- [1,2,3,4,5] for weekdays
  active BOOLEAN DEFAULT TRUE
);

INSERT INTO public.multiplier_events (name, multiplier, start_time, end_time, days_of_week) VALUES
('Happy Hour', 2.0, '14:00', '16:00', ARRAY[1,2,3,4,5]),
('Weekend Bonus', 1.5, '00:00', '23:59', ARRAY[6,7]);
```

#### Special Events
- **Double Bean Tuesday** - 2x all beans on Tuesdays
- **Birthday Month** - 3x beans during your birthday month
- **Rainy Day Bonus** - 1.5x when it's raining (weather API)
- **New Product Launch** - 5x beans for trying new items

#### Streak Multipliers (Already implemented!)
- 3-day streak: 1.25x
- 7-day streak: 1.5x
- 14-day streak: 2.0x
- 30-day streak: 3.0x

**UI:**
```tsx
export function MultiplierBadge({ multiplier }: { multiplier: number }) {
  if (multiplier <= 1) return null;
  
  return (
    <motion.div
      className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <Zap className="w-4 h-4" />
      {multiplier}x BEANS!
    </motion.div>
  );
}
```

---

### 4. Bean Leaderboards 🏅

**Concept:** Competitive leaderboards to drive engagement

**Leaderboard Types:**

#### Weekly Top Collectors
```sql
CREATE OR REPLACE VIEW public.weekly_bean_leaderboard AS
SELECT 
  u.id,
  u.name,
  u.avatar_url,
  SUM(pt.amount) as beans_this_week,
  COUNT(DISTINCT DATE(pt.created_at)) as days_active,
  ROW_NUMBER() OVER (ORDER BY SUM(pt.amount) DESC) as rank
FROM public.users u
JOIN public.points_transactions pt ON pt.user_id = u.id
WHERE pt.created_at >= date_trunc('week', NOW())
  AND pt.amount > 0
GROUP BY u.id, u.name, u.avatar_url
ORDER BY beans_this_week DESC
LIMIT 10;
```

#### All-Time Legends
```sql
CREATE OR REPLACE VIEW public.all_time_bean_legends AS
SELECT 
  u.id,
  u.name,
  u.avatar_url,
  u.badge_tier,
  public.get_user_points(u.id) as total_beans,
  u.longest_streak,
  ROW_NUMBER() OVER (ORDER BY public.get_user_points(u.id) DESC) as rank
FROM public.users u
WHERE public.get_user_points(u.id) > 0
ORDER BY total_beans DESC
LIMIT 50;
```

#### Streak Champions
- Longest current streak
- Most 30-day streaks completed
- Consecutive months active

**Rewards:**
- Top 3 weekly: Bonus 500 beans
- #1 monthly: Free hoodie
- Hall of Fame for all-time top 10

**UI Features:**
- Animated rank changes
- User's position highlighted
- "You're #X out of Y users"
- Share achievement on social media

---

### 5. Achievement Badges 🏆

**Concept:** Collectible badges for milestones (already have table!)

**Badge Ideas:**

#### Collection Badges
- **Bean Newbie** - Earn your first 100 beans
- **Bean Collector** - Earn 1,000 beans
- **Bean Hoarder** - Earn 10,000 beans
- **Bean Legend** - Earn 50,000 beans

#### Streak Badges
- **Weekend Warrior** - 7-day streak
- **Fortnight Fighter** - 14-day streak
- **Monthly Master** - 30-day streak
- **Unstoppable** - 100-day streak

#### Social Badges
- **Friend Magnet** - Refer 5 friends
- **Influencer** - Refer 20 friends
- **Social Butterfly** - Share 10 times

#### Special Badges
- **Golden Bean Hunter** - Find all golden beans
- **Game Master** - Win all mini-games
- **Perfect Score** - Get perfect quiz score 5 times
- **Early Bird** - Check in before 8am 10 times
- **Night Owl** - Check in after 8pm 10 times

**Badge Perks:**
- Display on profile
- Unlock exclusive rewards
- Special badge-holder events
- Bragging rights

---

### 6. Bean Combo System 🔥

**Concept:** Bonus beans for completing multiple actions in one visit

**Combos:**

```sql
CREATE TABLE public.bean_combos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  required_actions JSONB NOT NULL, -- ['check_in', 'game_play', 'social_share']
  bonus_beans INTEGER NOT NULL,
  icon TEXT,
  active BOOLEAN DEFAULT TRUE
);

INSERT INTO public.bean_combos (name, description, required_actions, bonus_beans, icon) VALUES
('Daily Triple', 'Check in + Play game + Share on social', '["check_in", "game_play", "social_share"]', 100, '🔥'),
('Perfect Visit', 'Check in + Win game + Buy coffee', '["check_in", "game_win", "purchase"]', 200, '⭐'),
('Social Star', 'Check in + Share + Refer friend', '["check_in", "social_share", "referral"]', 300, '🌟'),
('Weekend Warrior', 'Check in both Sat & Sun + Play 2 games', '["weekend_checkin", "game_play_2x"]', 150, '💪');
```

**UI:**
```tsx
export function ComboTracker({ completedActions, combo }: Props) {
  const progress = completedActions.length / combo.required_actions.length;
  
  return (
    <div className="p-4 border-2 border-dashed border-[#8B4513] rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">{combo.icon} {combo.name}</h4>
        <span className="text-sm text-gray-600">
          {completedActions.length}/{combo.required_actions.length}
        </span>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-[#8B4513] to-[#D2691E]"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-600">{combo.description}</p>
      
      {progress === 1 && (
        <motion.div
          className="mt-2 p-2 bg-green-100 text-green-800 rounded text-center font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          +{combo.bonus_beans} BONUS BEANS! 🎉
        </motion.div>
      )}
    </div>
  );
}
```

---

### 7. Bean Challenges 📋

**Concept:** Weekly/monthly challenges for extra beans

```sql
CREATE TABLE public.bean_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('weekly', 'monthly', 'special')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal_type TEXT, -- 'check_ins', 'games_won', 'beans_earned', 'referrals'
  goal_value INTEGER,
  reward_beans INTEGER,
  reward_item_id UUID REFERENCES public.rewards(id),
  active BOOLEAN DEFAULT TRUE
);

-- Track user progress
CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  challenge_id UUID REFERENCES public.bean_challenges(id),
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);
```

**Challenge Examples:**

#### Weekly Challenges
- **Check-in Champion** - Check in 5 days this week (200 beans)
- **Game Master** - Win 10 games this week (300 beans)
- **Social Sharer** - Share 3 times this week (150 beans)

#### Monthly Challenges
- **Perfect Month** - Check in every day (1000 beans + free hoodie)
- **Referral King** - Refer 5 friends (2000 beans)
- **Bean Collector** - Earn 5000 beans this month (500 bonus beans)

#### Special Challenges
- **Holiday Special** - Complete 5 actions on Christmas (500 beans)
- **Anniversary** - Visit on Penkey's anniversary (1000 beans)
- **New Year Resolution** - 30-day streak in January (2000 beans)

---

### 8. Bean Gifting 🎁

**Concept:** Send beans to friends

```sql
CREATE TABLE public.bean_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.users(id),
  recipient_id UUID REFERENCES public.users(id),
  beans_amount INTEGER CHECK (beans_amount > 0 AND beans_amount <= 500),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);
```

**Features:**
- Send up to 500 beans per gift
- Add personal message
- Recipient gets notification
- Track gift history
- "Thank you" responses

**Use Cases:**
- Birthday gifts
- Thank friends
- Apologize with beans
- Celebrate milestones together

---

### 9. Bean Predictions Game 🎲

**Concept:** Bet beans on daily predictions

**Examples:**
- "Will it rain today?" (50 beans to play, 150 if correct)
- "How many customers today?" (guess range, win 200 beans)
- "What's the special today?" (multiple choice, 100 beans)

**Rules:**
- Max 100 beans per prediction
- Results announced at end of day
- Winners split the pot
- House keeps 10% for reward pool

---

### 10. Bean Stories/Feed 📱

**Concept:** Social feed showing bean activities

```tsx
export function BeanFeed() {
  return (
    <div className="space-y-4">
      <FeedItem
        user="Sarah M."
        action="just earned 250 beans from a game win!"
        time="2 min ago"
        icon="🎮"
      />
      
      <FeedItem
        user="John D."
        action="completed a 30-day streak and earned 1,500 beans! 🔥"
        time="5 min ago"
        icon="⚡"
      />
      
      <FeedItem
        user="Emma L."
        action="found a Golden Bean worth 750 beans!"
        time="1 hour ago"
        icon="🏆"
      />
      
      <FeedItem
        user="You"
        action="are 200 beans away from a £5 voucher!"
        time="Just now"
        icon="🎁"
      />
    </div>
  );
}
```

---

## 🎯 Quick Wins (Implement First)

### Phase 1: Core Rebrand (Week 1-2)
1. ✅ Database migration
2. ✅ UI rebrand to "beans"
3. ✅ Signup bonus (250 beans + coffee)
4. ✅ Streak bonuses (7, 14, 30 days)

### Phase 2: Visual Polish (Week 3)
5. ✅ Bean jar visualization
6. ✅ Animated bean counter
7. ✅ Bean-themed colors throughout
8. ✅ Achievement badges display

### Phase 3: Engagement Hooks (Week 4)
9. ✅ Weekly leaderboard
10. ✅ Bean combo system (2-3 combos)
11. ✅ First weekly challenge
12. ✅ Happy Hour multiplier

### Phase 4: Advanced Features (Month 2)
13. ✅ Golden Bean Hunt (3-5 locations)
14. ✅ Bean gifting
15. ✅ More challenges
16. ✅ Bean feed/stories

---

## 📊 Success Metrics

### Week 1 (Post-Migration)
- [ ] 0 critical errors
- [ ] All existing users have 10x balances
- [ ] Signup bonus working for new users

### Week 2 (Post-UI Update)
- [ ] User feedback positive (>80%)
- [ ] No confusion about "beans" vs "points"
- [ ] Mobile experience smooth

### Month 1 (Post-Launch)
- [ ] Daily active users: +30%
- [ ] Check-in frequency: +50%
- [ ] New signups: +40%
- [ ] Referrals: +60%

### Month 3 (Mature System)
- [ ] Average beans per user: 5,000+
- [ ] Reward redemption rate: 20%
- [ ] 30-day streak completion: 15% of users
- [ ] Golden beans found: 500+ total claims

---

## 🎨 Branding Assets Needed

### Visual Design
- [ ] Bean logo/icon (SVG)
- [ ] Bean jar illustration
- [ ] Golden bean illustration
- [ ] Badge designs (10+ badges)
- [ ] Leaderboard trophy icons

### Marketing Materials
- [ ] Social media graphics
- [ ] Email templates
- [ ] In-store posters
- [ ] Table tents explaining beans
- [ ] Staff training materials

### Copy/Messaging
- [ ] "Collect Beans, Earn Rewards" tagline
- [ ] FAQ about beans system
- [ ] Social media posts (10+ scheduled)
- [ ] Email announcement
- [ ] Website copy updates

---

## 💰 Budget Estimate

### Development (In-house)
- Database migration: 8 hours
- Frontend rebrand: 16 hours
- Creative features: 40 hours
- Testing: 16 hours
- **Total: 80 hours**

### Design
- Bean logo/icons: £200
- Badge designs: £300
- Marketing graphics: £200
- **Total: £700**

### Marketing
- Social media ads: £500
- Email campaign: £100
- In-store materials: £200
- **Total: £800**

### **Grand Total: ~£1,500 + 80 dev hours**

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All code reviewed
- [ ] Database backed up
- [ ] Staging tested
- [ ] Marketing materials ready
- [ ] Staff trained
- [ ] FAQ published

### Launch Day
- [ ] Migration executed
- [ ] Frontend deployed
- [ ] Monitoring active
- [ ] Support team ready
- [ ] Social media posts live
- [ ] Email sent

### Post-Launch (First Week)
- [ ] Daily metrics review
- [ ] User feedback collected
- [ ] Bug fixes deployed
- [ ] Adjustments made
- [ ] Success celebrated! 🎉

---

**Ready to start? Let's begin with Week 1: Database Migration!** 🫘☕
