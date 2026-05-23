# Points System Audit & Upgrade Plan

## Current System Analysis

### 📊 Current Points Configuration

Based on the `points_config` table (from `20251010_create_points_config_table.sql`):

| Action | Current Points | Cooldown | Max/Day | Status |
|--------|---------------|----------|---------|--------|
| Signup | 10 | None | 1 | Active |
| Daily Check-in | 5 | 24h | 1 | Active |
| Profile Complete | 5 | None | 1 | Active |
| Referral Signup | 20 | None | ∞ | Active |
| Referral First Purchase | 10 | None | ∞ | Active |
| Social Share | 2 | 24h | 1 | Active |
| Review Posted | 15 | None | 1 | Requires Verification |
| Birthday Bonus | 25 | None | 1 | Active |
| 7-day Streak | 10 | None | ∞ | Active |
| 30-day Streak | 50 | None | ∞ | Active |
| First Game Play | 5 | None | 1 | Active |
| Game Win (Small) | 5 | None | ∞ | Active |
| Game Win (Medium) | 10 | None | ∞ | Active |
| Game Win (Large) | 20 | None | ∞ | Active |
| Game Win (Jackpot) | 50 | None | ∞ | Active |

### 💰 Current Reward Costs

From `points_rewards` table:

| Reward | Current Cost | Type |
|--------|-------------|------|
| Free Pastry | 30 pts | Free Item |
| £5 Off Voucher | 50 pts | Fixed Discount |
| 20% Off Voucher | 75 pts | Percentage |
| £10 Off Voucher | 90 pts | Fixed Discount |

### ⏱️ Current Time to Rewards

**Assuming weekly visit (check-in + game):**
- Daily check-in: 5 pts
- Game win (avg ~10 pts): 10 pts
- **Weekly total: ~15 pts**

| Reward | Weeks Needed | Months |
|--------|-------------|--------|
| Free Pastry (30 pts) | 2 weeks | ~0.5 |
| £5 Off (50 pts) | 3-4 weeks | ~1 |
| £10 Off (90 pts) | 6 weeks | ~1.5 |

**This is WAY TOO FAST and undervalues rewards!**

---

## 🎯 Your Proposed System

### Proposed Points Awards

| Action | Points | Unlock Rule | Status |
|--------|--------|-------------|--------|
| **Sign up** | **250 pts + Free Coffee Token** | Unlocks on first check-in + purchase | Pending |
| Daily check-in | 50 | — | Active |
| Weekly 7-day streak | +150 | — | Active |
| Mini-game played | 100 | Check-in to activate | Pending |
| Mini-game won | 200 | Check-in to activate | Pending |
| Quiz perfect score | 150 | Check-in to activate | Pending |
| GPS Duck found (near) | 100 | — | Pending |
| Golden Bean found (far) | 500 | — | Pending |
| Facebook share (milestone) | 200 | — | Pending |
| Refer a friend (sign up) | 300 | — | Pending |
| Friend buys first item | 500 | — | Pending |
| Birthday month visit | 250 | — | Active |

### Proposed Reward Costs

| Reward | Cost | Days (Weekly Visit) | Days (Daily Visit) |
|--------|------|--------------------|--------------------|
| £5 Voucher | 4,000 pts | ~3-4 weeks | ~2-3 weeks |
| £10 Voucher | 7,500 pts | ~6-8 weeks | ~1 month |
| Reusable Cup | 10,000 pts | ~2 months | ~6 weeks |
| Hoodie | 20,000 pts | 3-4 months | 2 months |
| Legend Status | 25,000 pts | 5-6 months | 3-4 months |

---

## 📈 Analysis & Recommendations

### ✅ What I Love About Your Proposal

1. **Much Higher Point Values** - Creates better perceived value
2. **Pending Rewards System** - Already implemented! Rewards unlock on check-in
3. **Free Coffee on Signup** - Great acquisition hook
4. **Longer Engagement Cycle** - 2-6 months keeps customers coming back
5. **Bigger Rewards** - Hoodie and Legend Status are aspirational

### 🎨 "Beans" vs "Points" Branding

**STRONG RECOMMENDATION: Use "Beans" 🫘**

**Why:**
- ☕ On-brand for a cafe
- 🎯 More memorable and fun
- 🦆 Fits with your duck theme (ducks eat beans?)
- 💡 Differentiates from generic "points"
- 🎨 Opens creative opportunities (Golden Beans, Bean Counter badge, etc.)

**Implementation:**
- Database: Keep as `points` (technical term)
- UI/UX: Display as "Beans" everywhere
- Marketing: "Collect Beans, Earn Rewards"

---

## 🔧 Recommended Point Values (Balanced)

### Core Actions

| Action | Recommended | Reasoning |
|--------|------------|-----------|
| **Sign up** | **250 beans + Free Coffee** | ✅ Great hook, unlocks on first visit |
| Daily check-in | **50 beans** | ✅ Your value is good |
| 7-day streak bonus | **200 beans** | 🔼 Increased from 150 (bigger incentive) |
| 14-day streak bonus | **500 beans** | 🆕 New milestone |
| 30-day streak bonus | **1,500 beans** | 🆕 Major achievement |

### Engagement Actions

| Action | Recommended | Reasoning |
|--------|------------|-----------|
| Mini-game played | **75 beans** | 🔽 Slightly lower (participation reward) |
| Mini-game WON | **250 beans** | 🔼 Higher (skill/luck reward) |
| Quiz perfect score | **200 beans** | ✅ Good value |
| Profile complete | **100 beans** | 🔼 Increased (valuable data) |
| Birthday visit | **300 beans** | 🔼 Special occasion |

### Social & Referral

| Action | Recommended | Reasoning |
|--------|------------|-----------|
| Social media share | **150 beans** | 🔽 From 200 (prevent spam) |
| Refer friend (signup) | **400 beans** | 🔼 High value action |
| Friend's first purchase | **600 beans** | 🔼 Completion bonus |
| Review posted | **250 beans** | 🆕 Valuable social proof |

### Location-Based (GPS Features)

| Action | Recommended | Reasoning |
|--------|------------|-----------|
| GPS Duck found (near) | **150 beans** | 🔼 Fun engagement |
| Golden Bean found (far) | **750 beans** | 🔼 Rare, drives foot traffic |

### Reward Costs

| Reward | Recommended Cost | Time to Earn |
|--------|-----------------|--------------|
| **Free Pastry** | **1,500 beans** | ~2 weeks (daily) / ~4 weeks (weekly) |
| **£5 Voucher** | **4,000 beans** | ~1 month (daily) / ~2 months (weekly) |
| **£10 Voucher** | **8,000 beans** | ~2 months (daily) / ~3-4 months (weekly) |
| **Reusable Cup** | **12,000 beans** | ~2.5 months (daily) / ~5 months (weekly) |
| **Hoodie** | **25,000 beans** | ~5 months (daily) / ~8-10 months (weekly) |
| **Legend Status Badge** | **50,000 beans** | ~10 months (daily) / ~1.5 years (weekly) |

---

## 🎁 Free Coffee on Signup

### Implementation Strategy

**Already have the infrastructure!** Your `pending_rewards` system is perfect for this.

```sql
-- On user signup, create pending reward
INSERT INTO public.pending_rewards (
  user_id,
  reward_type,
  amount,
  reward_name,
  reward_description,
  source,
  expires_at
) VALUES (
  NEW.id,
  'voucher',
  1,
  'Welcome Free Coffee',
  'Thanks for joining! Visit us to claim your free coffee.',
  'signup_bonus',
  NOW() + INTERVAL '30 days'
);
```

**Unlock Conditions:**
1. User checks in at location (GPS verified)
2. Optional: After first purchase (to prevent abuse)

---

## 📋 Migration Plan

### Phase 1: Update Point Values (Low Risk)

```sql
-- Update existing point configs
UPDATE public.points_config SET points_amount = 250 WHERE action_type = 'signup';
UPDATE public.points_config SET points_amount = 50 WHERE action_type = 'daily_checkin';
UPDATE public.points_config SET points_amount = 200 WHERE action_type = 'streak_7_days';
UPDATE public.points_config SET points_amount = 100 WHERE action_type = 'profile_complete';
UPDATE public.points_config SET points_amount = 300 WHERE action_type = 'birthday_bonus';

-- Add new configs
INSERT INTO public.points_config (action_type, points_amount, description, metadata) VALUES
('streak_14_days', 500, 'Check in 14 days in a row', '{"streak_required": 14}'::jsonb),
('streak_30_days', 1500, 'Check in 30 days in a row', '{"streak_required": 30}'::jsonb),
('game_play', 75, 'Play any mini-game', '{"requires_checkin": true}'::jsonb),
('game_win', 250, 'Win any mini-game', '{"requires_checkin": true}'::jsonb),
('quiz_perfect', 200, 'Perfect score on quiz', '{"requires_checkin": true}'::jsonb),
('gps_duck_near', 150, 'Find GPS duck near Penkey', NULL),
('golden_bean_far', 750, 'Find Golden Bean (farther location)', NULL),
('social_share_milestone', 150, 'Share milestone on social media', '{"max_per_week": 2}'::jsonb),
('referral_signup', 400, 'Friend signs up with referral', NULL),
('referral_purchase', 600, 'Referred friend makes first purchase', NULL),
('review_posted', 250, 'Post review on Google/Facebook', '{"requires_verification": true}'::jsonb);
```

### Phase 2: Update Reward Costs

```sql
-- Update points_rewards table
UPDATE public.points_rewards SET points_required = 1500 WHERE name LIKE '%Pastry%';
UPDATE public.points_rewards SET points_required = 4000 WHERE name = '£5 Off Voucher';
UPDATE public.points_rewards SET points_required = 8000 WHERE name = '£10 Off Voucher';

-- Add new rewards
INSERT INTO public.points_rewards (name, description, reward_type, discount_value, points_required, active) VALUES
('Reusable Cup', 'Eco-friendly Penkey reusable cup', 'free_item', NULL, 12000, TRUE),
('Penkey Hoodie', 'Exclusive Penkey branded hoodie', 'free_item', NULL, 25000, TRUE),
('Legend Status', 'Lifetime VIP status with exclusive perks', 'badge', NULL, 50000, TRUE);
```

### Phase 3: Free Coffee on Signup

```sql
-- Create trigger for signup bonus
CREATE OR REPLACE FUNCTION public.award_signup_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 250 beans as pending
  INSERT INTO public.pending_rewards (
    user_id,
    reward_type,
    amount,
    reward_name,
    reward_description,
    source,
    expires_at,
    metadata
  ) VALUES (
    NEW.id,
    'points',
    250,
    'Welcome Bonus',
    'Welcome to Penkey! Check in at our shop to claim your welcome beans.',
    'signup_bonus',
    NOW() + INTERVAL '30 days',
    '{"auto_award": true}'::jsonb
  );
  
  -- Award free coffee voucher as pending
  INSERT INTO public.pending_rewards (
    user_id,
    reward_type,
    reward_id,
    reward_name,
    reward_description,
    source,
    expires_at,
    metadata
  ) VALUES (
    NEW.id,
    'voucher',
    (SELECT id FROM public.rewards WHERE name = 'Free Coffee' LIMIT 1),
    'Welcome Free Coffee',
    'Enjoy a free coffee on us! Visit Penkey to claim.',
    'signup_bonus',
    NOW() + INTERVAL '30 days',
    '{"requires_purchase": false}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS on_user_signup_bonus ON public.users;
CREATE TRIGGER on_user_signup_bonus
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.award_signup_bonus();
```

### Phase 4: UI Updates

1. **Global Find & Replace:**
   - "points" → "beans" (in UI text only)
   - "Points" → "Beans"
   - Update icons to coffee bean emoji 🫘

2. **Update Components:**
   - `components/dashboard/points-card.tsx`
   - `app/rewards/page.tsx`
   - All admin panels

---

## 🚨 Important Considerations

### 1. Existing Users

**Problem:** Users with existing points will have less purchasing power.

**Solutions:**
- **Option A (Recommended):** Multiply all existing balances by 10x
  ```sql
  -- One-time migration
  UPDATE public.points_transactions 
  SET amount = amount * 10, 
      balance_after = balance_after * 10;
  ```
  
- **Option B:** Grandfather old users with "legacy" pricing tier
- **Option C:** Give all existing users a one-time 5,000 bean bonus

### 2. Communication

**Announce the change:**
- Email to all users
- In-app notification
- Social media posts
- "We're now counting BEANS instead of points! All your points have been converted to beans at a 10:1 ratio."

### 3. Prevent Gaming

**Anti-abuse measures already in place:**
- ✅ Cooldowns on actions
- ✅ GPS verification for check-ins
- ✅ Rate limiting on games
- ✅ Pending rewards system

**Additional recommendations:**
- Max 1 game win per day per game type
- Require minimum purchase amount for referral completion
- Verify social shares with webhook

---

## 🎯 Final Recommendation

### DO THIS:

1. ✅ **Rebrand to "Beans"** - More fun, on-brand
2. ✅ **Use your proposed higher values** - Better engagement
3. ✅ **Keep pending rewards system** - Already built!
4. ✅ **Add free coffee on signup** - Great acquisition
5. ✅ **10x existing user balances** - Fair migration
6. ✅ **Add streak bonuses** - Drives daily visits
7. ✅ **Add GPS features** - Unique differentiator

### Timeline:

- **Week 1:** Database migration + testing
- **Week 2:** UI updates (points → beans)
- **Week 3:** User communication + launch
- **Week 4:** Monitor and adjust

### Success Metrics:

- Daily active users (target: +30%)
- Average visit frequency (target: 2x/week → 3x/week)
- Referral rate (target: +50%)
- Social shares (target: +100%)
- Time to first reward redemption (target: 3-4 weeks)

---

## 📝 Next Steps

1. Review this audit
2. Approve point values
3. Approve "beans" branding
4. I'll create the migration SQL file
5. I'll update the UI components
6. Test on staging
7. Launch! 🚀
