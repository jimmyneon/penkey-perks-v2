# 🎯 How to Add Milestones (Database-Driven)

## ✅ You're Right - Milestones Are Now Database-Driven!

The milestone email system now uses the **existing `milestones` table** - no hardcoding!

---

## 📋 How It Works

### 1. **Milestones Table** (Already Exists)
```sql
-- Table: public.milestones
-- Columns:
- id (UUID)
- name (TEXT) - e.g., "First 100 Points"
- description (TEXT) - e.g., "You've earned your first 100 points!"
- requirement_type (TEXT) - 'points', 'visits', 'stamps', 'referrals', 'games_played'
- requirement_value (INTEGER) - e.g., 100
- reward_type (TEXT) - 'points', 'voucher', 'badge', 'free_item', 'custom'
- reward_value (TEXT) - e.g., "10" (for 10 bonus points)
- one_time (BOOLEAN) - Can only be earned once
- active (BOOLEAN) - Is this milestone active?
```

### 2. **Automatic Flow**
```
User earns points
  ↓
Trigger: auto_check_milestones_on_points()
  ↓
Calls: check_milestones(user_id)
  ↓
Checks all active milestones in database
  ↓
If milestone achieved → Insert into user_milestones
  ↓
Trigger: send_milestone_email()
  ↓
Email queued with milestone details from database
  ↓
Cron job sends email
```

---

## 🎯 Add Milestones via SQL

### Example: Add Points Milestones

```sql
-- 50 Points Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'First 50 Points',
  'You''ve earned your first 50 points! Keep it up!',
  'points',
  50,
  'points',
  '5',  -- Bonus 5 points
  true,
  true
);

-- 100 Points Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'Century Club',
  'Amazing! You''ve reached 100 points!',
  'points',
  100,
  'points',
  '10',  -- Bonus 10 points
  true,
  true
);

-- 250 Points Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'Quarter Master',
  'Incredible! 250 points earned!',
  'points',
  250,
  'points',
  '25',  -- Bonus 25 points
  true,
  true
);

-- 500 Points Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'Half Thousand Hero',
  'You''re on fire! 500 points!',
  'points',
  500,
  'free_item',
  'Free Coffee',  -- Free coffee reward
  true,
  true
);

-- 1000 Points Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'Penkey Legend',
  'You''re a legend! 1000 points achieved!',
  'points',
  1000,
  'points',
  '100',  -- Bonus 100 points
  true,
  true
);
```

### Example: Add Visit Milestones

```sql
-- 10 Visits Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'Regular Customer',
  'You''ve visited us 10 times! Thanks for your loyalty!',
  'visits',
  10,
  'points',
  '20',
  true,
  true
);

-- 50 Visits Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'VIP Customer',
  'Wow! 50 visits! You''re part of the family now!',
  'visits',
  50,
  'free_item',
  'Free Coffee',
  true,
  true
);
```

### Example: Add Referral Milestones

```sql
-- 5 Referrals Milestone
INSERT INTO public.milestones (
  name,
  description,
  requirement_type,
  requirement_value,
  reward_type,
  reward_value,
  one_time,
  active
) VALUES (
  'Social Butterfly',
  'You''ve referred 5 friends! Amazing!',
  'referrals',
  5,
  'points',
  '50',
  true,
  true
);
```

---

## 🎨 Email Template Variables

The milestone email will receive these variables:

- `{{name}}` - User's name
- `{{milestone}}` - Formatted milestone (e.g., "100 Points", "10 Visits")
- `{{milestoneName}}` - Milestone name from database (e.g., "Century Club")
- `{{milestoneDescription}}` - Milestone description from database
- `{{appUrl}}` - App URL

---

## 🔧 Manage Milestones

### View All Milestones
```sql
SELECT * FROM public.milestones ORDER BY requirement_value;
```

### Disable a Milestone
```sql
UPDATE public.milestones 
SET active = false 
WHERE name = 'First 50 Points';
```

### Update Milestone Reward
```sql
UPDATE public.milestones 
SET reward_value = '15' 
WHERE name = 'Century Club';
```

### Delete a Milestone
```sql
DELETE FROM public.milestones 
WHERE name = 'First 50 Points';
```

---

## ✅ Benefits of Database-Driven Milestones

1. **No Code Changes** - Add/edit milestones via SQL
2. **Flexible** - Support 5 types: points, visits, stamps, referrals, games
3. **Dynamic Rewards** - Points, free items, badges, vouchers
4. **Easy Management** - Enable/disable anytime
5. **Automatic Emails** - Email sent when milestone achieved
6. **No Duplicates** - One-time milestones only awarded once

---

## 🚀 Quick Start

Run this migration to enable milestone emails:
```
20251011_add_milestone_email_trigger.sql
```

Then add your milestones using the SQL examples above!
