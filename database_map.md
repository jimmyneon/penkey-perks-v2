# 🗄️ Penkey Perks Database Map

Complete reference for all database tables, columns, relationships, and types.

---

## 📊 Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Customer profiles | Extended from auth.users |
| `ducks` | Loyalty stamps | → users |
| `rewards` | Available rewards | Standalone |
| `user_rewards` | Issued rewards | → users, rewards |
| `referrals` | Referral tracking | → users (referrer & referee) |
| `staff` | Admin/employee roles | → users |
| `mini_games` | Game configurations | Standalone |
| `game_prizes` | Prize definitions | → mini_games |
| `game_plays` | Game play history | → users, mini_games, rewards |
| `transactions` | Audit log | → users, staff |

---

## 📋 Table Schemas

### `users`
Extends Supabase auth.users with profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | - | Primary key, references auth.users(id) |
| `name` | TEXT | NO | - | User's full name |
| `email` | TEXT | NO | - | Email address (unique) |
| `avatar_url` | TEXT | YES | NULL | Profile picture URL |
| `phone` | TEXT | YES | NULL | Phone number |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last profile update |

**Relationships:**
- `id` → `auth.users(id)` (CASCADE DELETE)

---

### `ducks`
Loyalty stamps earned by users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Owner of the duck |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When duck was earned |

**Relationships:**
- `user_id` → `users(id)` (CASCADE DELETE)

**Indexes:**
- `idx_ducks_user_id` on `user_id`
- `idx_ducks_created_at` on `created_at`

**Business Rules:**
- Users can earn 1 duck per day via check-in
- Bonus ducks can be earned through games
- Admins can manually add/remove ducks

---

### `rewards`
Available rewards that users can earn.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `name` | TEXT | NO | - | Reward name (e.g., "Free Coffee") |
| `description` | TEXT | YES | NULL | Detailed description |
| `type` | TEXT | NO | - | 'free_item', 'discount', or 'bonus_ducks' |
| `value` | TEXT | NO | - | Display value (e.g., "10%", "Free Coffee") |
| `duck_threshold` | INTEGER | NO | 10 | Ducks required to unlock |
| `expiry_days` | INTEGER | YES | NULL | Days until reward expires (NULL = never) |
| `stock` | INTEGER | YES | NULL | Available quantity (NULL = unlimited) |
| `image_url` | TEXT | YES | NULL | Reward image |
| `active` | BOOLEAN | NO | TRUE | Whether reward is currently available |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

**Constraints:**
- `type` must be one of: 'free_item', 'discount', 'bonus_ducks'

**Business Rules:**
- Auto-issued when user reaches `duck_threshold`
- Stock decrements when issued (if not NULL)
- Inactive rewards are not issued

---

### `user_rewards`
Rewards issued to users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Reward owner |
| `reward_id` | UUID | NO | - | Type of reward |
| `status` | TEXT | NO | 'active' | 'active', 'redeemed', or 'expired' |
| `qr_code` | TEXT | NO | - | Unique QR code for redemption (unique) |
| `expires_at` | TIMESTAMPTZ | YES | NULL | Expiration timestamp |
| `redeemed_at` | TIMESTAMPTZ | YES | NULL | When reward was redeemed |
| `redeemed_by` | UUID | YES | NULL | Staff member who redeemed |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When reward was issued |

**Relationships:**
- `user_id` → `users(id)` (CASCADE DELETE)
- `reward_id` → `rewards(id)` (CASCADE DELETE)
- `redeemed_by` → `users(id)` (no cascade)

**Indexes:**
- `idx_user_rewards_user_id` on `user_id`
- `idx_user_rewards_status` on `status`

**Constraints:**
- `status` must be one of: 'active', 'redeemed', 'expired'
- `qr_code` must be unique

---

### `referrals`
Tracks user referrals.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `referrer_id` | UUID | NO | - | User who sent the referral |
| `referee_id` | UUID | YES | NULL | User who was referred (after signup) |
| `referee_email` | TEXT | YES | NULL | Email of referred user |
| `confirmed` | BOOLEAN | NO | FALSE | Whether referee completed first check-in |
| `confirmed_at` | TIMESTAMPTZ | YES | NULL | When referral was confirmed |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When referral was sent |

**Relationships:**
- `referrer_id` → `users(id)` (CASCADE DELETE)
- `referee_id` → `users(id)` (SET NULL on delete)

**Indexes:**
- `idx_referrals_referrer_id` on `referrer_id`

**Business Rules:**
- Referrer gets 3 ducks when `confirmed` = TRUE
- Referee gets 1 bonus duck on signup
- Confirmed after referee's first check-in

---

### `staff`
Admin and employee roles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | User account (unique) |
| `role` | TEXT | NO | 'employee' | 'owner' or 'employee' |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When staff was added |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last role update |

**Relationships:**
- `user_id` → `users(id)` (CASCADE DELETE, UNIQUE)

**Constraints:**
- `role` must be one of: 'owner', 'employee'
- `user_id` must be unique (one staff record per user)

**Permissions:**
- **Owner:** Full access to all admin features
- **Employee:** Can redeem rewards, add ducks, view customers

---

### `mini_games`
Configuration for mini-games.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `name` | TEXT | NO | - | Internal name (unique, e.g., 'scratch_card') |
| `display_name` | TEXT | NO | - | User-facing name (e.g., 'Scratch Card') |
| `description` | TEXT | YES | NULL | Game description |
| `icon` | TEXT | YES | NULL | Emoji or icon identifier |
| `enabled` | BOOLEAN | NO | TRUE | Whether game is currently active |
| `play_limit_per_day` | INTEGER | NO | 1 | Max plays per user per day |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

**Constraints:**
- `name` must be unique

**Seeded Games:**
- `scratch_card` - Scratch Card 🎫
- `spin_wheel` - Spin Wheel 🎡
- `duck_pond` - Duck Pond 🦆

---

### `game_prizes`
Prize definitions for each game.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `game_id` | UUID | NO | - | Associated game |
| `prize_type` | TEXT | NO | - | 'ducks', 'reward', or 'nothing' |
| `prize_value` | INTEGER | YES | NULL | Number of ducks (NULL for rewards/nothing) |
| `probability` | DECIMAL(5,4) | NO | - | Win probability (0.0 to 1.0) |
| `label` | TEXT | NO | - | Display text (e.g., "3 Bonus Ducks!") |
| `daily_limit` | INTEGER | YES | NULL | Max times this prize can be won per day (NULL = unlimited) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Creation timestamp |

**Relationships:**
- `game_id` → `mini_games(id)` (CASCADE DELETE)

**Constraints:**
- `prize_type` must be one of: 'ducks', 'reward', 'nothing'
- `probability` must be between 0 and 1
- Probabilities for a game should sum to 1.0

**Example Probabilities (Scratch Card):**
- 3 Ducks: 0.05 (5%)
- 2 Ducks: 0.20 (20%)
- 1 Duck: 0.55 (55%)
- Instant Reward: 0.15 (15%)
- Nothing: 0.05 (5%)

---

### `game_plays`
Log of all game plays.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Player |
| `game_id` | UUID | NO | - | Game played |
| `prize_type` | TEXT | NO | - | What was won |
| `prize_value` | INTEGER | YES | NULL | Number of ducks won |
| `reward_id` | UUID | YES | NULL | Reward won (if applicable) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Play timestamp |

**Relationships:**
- `user_id` → `users(id)` (CASCADE DELETE)
- `game_id` → `mini_games(id)` (CASCADE DELETE)
- `reward_id` → `rewards(id)` (no cascade)

**Indexes:**
- `idx_game_plays_user_id` on `user_id`
- `idx_game_plays_created_at` on `created_at`

---

### `transactions`
Audit log for all important actions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | User affected by action |
| `action` | TEXT | NO | - | Type of action |
| `details` | JSONB | YES | NULL | Additional action details |
| `staff_id` | UUID | YES | NULL | Staff member who performed action |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Action timestamp |

**Relationships:**
- `user_id` → `users(id)` (CASCADE DELETE)
- `staff_id` → `users(id)` (no cascade)

**Indexes:**
- `idx_transactions_user_id` on `user_id`
- `idx_transactions_created_at` on `created_at`

**Action Types:**
- `check_in` - Daily check-in
- `game_play` - Mini-game played
- `reward_earned` - Reward auto-issued
- `reward_redeemed` - Reward redeemed by staff
- `referral_confirmed` - Referral completed
- `manual_duck_add` - Admin added ducks
- `manual_duck_remove` - Admin removed ducks

**Constraints:**
- `action` must be one of the above types

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Customer Policies
- Users can **view and update** their own profile
- Users can **view** their own ducks, rewards, referrals, game plays, transactions
- Users can **view** active rewards and enabled games

### Staff Policies
- Staff can **view** the staff table (to check roles)
- Staff use service role key for admin operations (bypasses RLS)

### Public Policies
- Anyone can **view** active rewards
- Anyone can **view** enabled games and their prizes

---

## 🔧 Database Functions

### `can_check_in(p_user_id UUID) → BOOLEAN`
Checks if user can check in (24-hour cooldown).

**Returns:** `TRUE` if user can check in, `FALSE` otherwise

**Usage:**
```sql
SELECT can_check_in('user-uuid-here');
```

---

### `get_user_duck_count(p_user_id UUID) → INTEGER`
Returns total number of ducks for a user.

**Returns:** Duck count

**Usage:**
```sql
SELECT get_user_duck_count('user-uuid-here');
```

---

### `check_and_issue_rewards(p_user_id UUID) → VOID`
Checks if user is eligible for rewards and auto-issues them.

**Called automatically** after duck insert via trigger.

**Logic:**
1. Get user's duck count
2. Find eligible rewards (threshold met, stock available)
3. Issue rewards user doesn't already have
4. Decrement stock
5. Log transaction

---

### `can_play_game(p_user_id UUID, p_game_id UUID) → BOOLEAN`
Checks if user can play a game today.

**Returns:** `TRUE` if user hasn't reached daily limit, `FALSE` otherwise

**Usage:**
```sql
SELECT can_play_game('user-uuid', 'game-uuid');
```

---

## 🔄 Triggers

### `after_duck_insert`
**Table:** `ducks`  
**Event:** AFTER INSERT  
**Action:** Calls `check_and_issue_rewards()` to auto-issue rewards

### `update_*_updated_at`
**Tables:** `users`, `rewards`, `staff`, `mini_games`  
**Event:** BEFORE UPDATE  
**Action:** Sets `updated_at` to NOW()

---

## 📈 Common Queries

### Get user's duck count
```sql
SELECT COUNT(*) FROM ducks WHERE user_id = 'user-uuid';
-- OR use function:
SELECT get_user_duck_count('user-uuid');
```

### Get user's active rewards
```sql
SELECT ur.*, r.name, r.description, r.type, r.value
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = 'user-uuid' AND ur.status = 'active';
```

### Check if user checked in today
```sql
SELECT EXISTS (
  SELECT 1 FROM ducks 
  WHERE user_id = 'user-uuid' 
  AND created_at >= CURRENT_DATE
);
```

### Get user's referral stats
```sql
SELECT 
  COUNT(*) as total_referrals,
  COUNT(*) FILTER (WHERE confirmed = TRUE) as confirmed_referrals
FROM referrals
WHERE referrer_id = 'user-uuid';
```

### Get game play count for today
```sql
SELECT COUNT(*) FROM game_plays
WHERE user_id = 'user-uuid'
AND game_id = 'game-uuid'
AND created_at >= CURRENT_DATE;
```

---

## 🎯 Relationships Diagram

```
auth.users (Supabase)
    ↓
users ←──────────────────┐
    ↓                     │
    ├─→ ducks             │
    ├─→ user_rewards ─→ rewards
    ├─→ referrals (referrer & referee)
    ├─→ staff             │
    ├─→ game_plays ─→ mini_games ─→ game_prizes
    └─→ transactions ←────┘ (staff_id)
```

---

**Last Updated:** 2025-10-09  
**Schema Version:** 1.0
