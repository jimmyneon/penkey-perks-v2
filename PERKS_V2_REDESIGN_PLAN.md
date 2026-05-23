# 🦆 Penkey Perks V2 - Redesign Plan

**Date:** May 23, 2026  
**Goal:** Simplify loyalty app to focus on core value: Coffee Stamp Card + Rewards

---

## 🎯 Vision

**Current State (V1):**
- Complex gamification (10 mini-games)
- Daily check-ins with ducks
- Multiple engagement mechanics
- Confusing user journey

**Target State (V2):**
- Simple coffee stamp card (5 coffees = 1 free)
- Clear rewards catalog
- QR-based redemption
- Staff scanner for stamps
- Optional: Daily offers (no games)

**Inspiration:** Greggs, Costa Coffee - simple, transactional, fast

---

## 📊 Database Schema Analysis

### ✅ KEEP (Core Tables)

#### `users` - Customer Profiles
- **Why:** Essential for authentication and customer data
- **Changes:** None
- **Fields:** id, name, email, avatar_url, phone, created_at, updated_at

#### `ducks` → Rename to `coffee_stamps`
- **Why:** Core loyalty mechanic (stamps for purchases)
- **Changes:** 
  - Rename table to `coffee_stamps`
  - Add `source` column: 'purchase', 'bonus', 'manual'
  - Add `reference_id` for linking to POS transactions
- **New Schema:**
  ```sql
  coffee_stamps:
    - id (UUID)
    - user_id (UUID)
    - source (TEXT) -- 'purchase', 'bonus', 'manual'
    - reference_id (TEXT) -- POS transaction ID or NULL
    - created_at (TIMESTAMPTZ)
  ```

#### `rewards` - Rewards Catalog
- **Why:** Available rewards for redemption
- **Changes:** Simplify types
- **Keep:** free_item, discount
- **Remove:** bonus_ducks (no longer needed)
- **New Schema:**
  ```sql
  rewards:
    - id (UUID)
    - name (TEXT)
    - description (TEXT)
    - type (TEXT) -- 'free_item', 'discount'
    - value (TEXT) -- "Free Coffee", "10% off"
    - stamp_threshold (INTEGER) -- stamps required (was duck_threshold)
    - expiry_days (INTEGER)
    - stock (INTEGER)
    - image_url (TEXT)
    - active (BOOLEAN)
    - created_at, updated_at
  ```

#### `user_rewards` - Issued Rewards
- **Why:** Track rewards earned and redeemed
- **Changes:** None needed
- **Keep:** All fields

#### `staff` - Admin/Staff Roles
- **Why:** Staff need to scan QR codes and add stamps
- **Changes:** None
- **Keep:** All fields

#### `transactions` - Audit Log
- **Why:** Important for tracking all actions
- **Changes:** Simplify action types
- **Remove:** game_play, check_in (if removing daily check-in)
- **Keep:** reward_earned, reward_redeemed, manual_stamp_add, manual_stamp_remove

---

### ❌ REMOVE (Game-Related Tables)

#### `mini_games` - REMOVE
- **Why:** Games are being removed from V2
- **Action:** Drop table (keep data in V1 for reference)

#### `game_prizes` - REMOVE
- **Why:** No games = no prizes
- **Action:** Drop table

#### `game_plays` - REMOVE
- **Why:** No game history needed
- **Action:** Drop table

---

### ⚠️ DEPRECATE (May Add Later)

#### `referrals` - DEPRECATE for V2
- **Why:** Can add in Phase 2 if needed
- **Action:** Keep table but don't use in V2 UI
- **Future:** Simple referral system (refer friend = bonus stamp)

---

## 🔧 Database Functions - Update

### ✅ KEEP & RENAME

#### `get_user_duck_count()` → `get_user_stamp_count()`
- **Why:** Core function for UI
- **Changes:** Rename, query `coffee_stamps` table

#### `check_and_issue_rewards()` → KEEP
- **Why:** Auto-issue rewards when threshold reached
- **Changes:** Update to use `stamp_threshold` instead of `duck_threshold`

### ❌ REMOVE

#### `can_check_in()` - REMOVE
- **Why:** Daily check-in being removed
- **Action:** Drop function

#### `can_play_game()` - REMOVE
- **Why:** No games
- **Action:** Drop function

---

## 🔄 Triggers - Update

### ✅ KEEP

#### `after_stamp_insert` (renamed from `after_duck_insert`)
- **Why:** Auto-issue rewards when stamp added
- **Changes:** Update table name to `coffee_stamps`

### ❌ REMOVE

#### Any game-related triggers
- **Action:** Drop

---

## 📱 New V2 Architecture

### Core Features

#### 1. Coffee Stamp Card
- **User View:** Visual stamp card (5 slots)
- **Progress:** Show X/5 stamps collected
- **Action:** Staff scans QR at POS to add stamp
- **Reward:** 5 stamps = 1 free coffee (auto-issued)

#### 2. Rewards Catalog
- **Display:** Simple list of available rewards
- **Filter:** By stamp threshold (5, 10, 15 stamps)
- **Action:** One-tap to generate QR code for redemption
- **Status:** Active, Redeemed, Expired

#### 3. Staff Scanner
- **Add Stamp:** Scan customer QR → Add 1 stamp
- **Redeem Reward:** Scan reward QR → Mark as redeemed
- **View Customer:** See stamp history, rewards

#### 4. Daily Offers (Optional)
- **Display:** "Double Stamp Tuesday", "Free pastry with coffee"
- **Action:** Staff can enable/disable via admin
- **No Games:** Simple offers only

---

## 🗂️ New Page Structure

### Customer Pages

```
/dashboard (home)
  - Stamp card (prominent)
  - Progress bar
  - Quick actions: "Show QR", "View Rewards"

/stamp-card
  - Full stamp card view
  - Stamp history
  - Progress to next reward

/rewards
  - Available rewards catalog
  - My rewards (active, redeemed, expired)
  - Reward detail with QR generation

/profile
  - User profile
  - Settings
  - Stamp history
```

### Staff Pages

```
/staff/dashboard
  - Quick scanner (add stamp)
  - Recent scans
  - Stats

/staff/scan
  - QR scanner for stamps
  - QR scanner for rewards

/staff/customers
  - Customer search
  - View customer details
  - Manual stamp add/remove

/staff/rewards
  - Manage rewards catalog
  - View redemptions
```

### Admin Pages

```
/admin/dashboard
  - Overview stats
  - Active users
  - Stamps issued
  - Rewards redeemed

/admin/rewards
  - Create/edit rewards
  - Set thresholds
  - Manage stock

/admin/offers
  - Create daily offers
  - Schedule offers
  - Weather-based offers

/admin/staff
  - Manage staff roles
  - Add/remove staff
```

---

## 🎨 UI/UX Simplification

### Remove from V1:
- ❌ All game pages (10 games)
- ❌ Game selection UI
- ❌ Daily check-in button
- ❌ Duck pond visuals
- ❌ Complex gamification animations
- ❌ Leaderboards
- ❌ Achievements/badges

### Add to V2:
- ✅ Clean stamp card UI
- ✅ Simple progress bar
- ✅ QR code generation (large, clear)
- ✅ Staff scanner interface
- ✅ Daily offers banner
- ✅ Apple Wallet/Google Wallet integration (Phase 2)

---

## 📦 Component Structure

### Keep & Simplify:
- `components/ui/` - ShadCN components (keep all)
- `components/stamp-card/` - NEW - Stamp card display
- `components/qr-code/` - Keep and simplify
- `components/staff-scanner/` - NEW - Staff QR scanner
- `components/rewards-catalog/` - Simplify from existing

### Remove:
- `components/games/` - All game components
- `components/duck-pond/` - Remove
- `components/mini-games/` - Remove
- `components/leaderboard/` - Remove

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Copy app to perks-v2 ✅
- [ ] Update package.json ✅
- [ ] Create database migration script (rename ducks → coffee_stamps)
- [ ] Update database functions
- [ ] Remove game-related tables/functions
- [ ] Test database changes

### Phase 2: UI Redesign (Week 2)
- [ ] Design new stamp card component
- [ ] Create simplified dashboard
- [ ] Build rewards catalog page
- [ ] Create staff scanner interface
- [ ] Remove all game pages
- [ ] Update navigation

### Phase 3: Integration (Week 3)
- [ ] Connect stamp card to database
- [ ] Implement QR generation for rewards
- [ ] Build staff scanner functionality
- [ ] Test end-to-end flow
- [ ] Add daily offers system

### Phase 4: Polish (Week 4)
- [ ] Apple Wallet/Google Wallet integration
- [ ] Push notifications for offers
- [ ] Analytics tracking
- [ ] Performance optimization
- [ ] Testing & bug fixes

---

## 🔗 POS Integration

### Required Integration Points:

1. **Customer Lookup**
   - POS needs to search customers by email/phone
   - Display customer stamp count

2. **Add Stamp**
   - POS calls API to add stamp after purchase
   - API: `POST /api/stamps/add`
   - Body: `{ user_id, reference_id (transaction_id) }`

3. **Redeem Reward**
   - POS scans reward QR
   - API: `POST /api/rewards/redeem`
   - Body: `{ qr_code, staff_id }`

4. **Real-time Sync**
   - Supabase subscriptions for real-time stamp updates
   - POS shows updated stamp count immediately

---

## 📊 Success Metrics

### V2 Goals:
- **Simpler UX:** 50% reduction in time to first reward
- **Higher Engagement:** 30% increase in stamp collection rate
- **Staff Adoption:** 100% of staff using scanner
- **Redemption Rate:** 60% of issued rewards redeemed

### Track:
- Daily active users
- Stamps issued per day
- Rewards redeemed per day
- Time from signup to first stamp
- Time from first stamp to reward redemption

---

## 🎯 Next Steps

1. **Database Migration Script** - Create SQL to rename tables and remove games
2. **Stamp Card Component** - Design and build new stamp card UI
3. **Staff Scanner** - Build QR scanner for staff
4. **Remove Games** - Delete all game-related code
5. **Test V2** - Ensure app runs independently on port 3004

---

**Status:** Planning Phase  
**Last Updated:** May 23, 2026
