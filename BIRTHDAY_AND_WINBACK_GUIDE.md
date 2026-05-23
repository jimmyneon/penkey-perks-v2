# 🎂 Birthday & Win-Back Rewards Guide

## ✅ What I Created

### **1. Birthday Email System**
- Birthday field added to users table
- Birthday reward email template
- Auto-sends on user's birthday
- Special reward: **Free Cake, Free Bake, or £5 off (excluding drinks)**
- Valid for 7 days from birthday

### **2. Dynamic Win-Back Rewards**
- Fully configurable in database
- Auto-claims rewards when user checks in
- Track which users received which offers
- Change rewards anytime without code changes

---

## 🎂 Birthday System

### **How It Works:**

1. **User adds birthday** to their profile
2. **System checks daily** via cron job
3. **On birthday:** Creates voucher + sends email
4. **User has 7 days** to redeem

### **Birthday Reward Options:**
```
🍰 Free Cake - Any cake from selection
🥐 Free Bake - Any pastry or baked good  
💰 £5 Off - Anything except drinks
```

### **Add Birthday to User:**
```sql
UPDATE users 
SET birthday = '1990-05-15'  -- Year optional, just month/day needed
WHERE id = 'user-id';
```

### **Run Birthday Cron (Daily):**
Add to your `send-reminders` API:
```typescript
const { data: birthdayEmails } = await supabase.rpc('send_birthday_emails')
```

---

## 🎁 Win-Back Rewards System

### **How It Works:**

1. **User inactive for X days** (30, 60, 90, etc.)
2. **System sends email** with special offer
3. **When user checks in again** → Reward auto-claimed!
4. **Stamps/points added** automatically

### **Current Win-Back Rewards:**

| Days Inactive | Reward | Auto-Claim |
|---------------|--------|------------|
| 30 days | 3 Bonus Stamps | ✅ Yes |
| 60 days | Free Coffee + 5 Stamps | ✅ Yes |
| 90 days | £10 Off voucher | ✅ Yes |

### **Change Win-Back Rewards:**

```sql
-- Update 30-day reward
UPDATE winback_rewards
SET reward_value = '5 Bonus Stamps'  -- Change from 3 to 5
WHERE days_inactive = 30;

-- Update 60-day reward
UPDATE winback_rewards
SET reward_value = 'Free Pastry + 10 Stamps'
WHERE days_inactive = 60;

-- Add new 90-day reward
INSERT INTO winback_rewards (
  name,
  description,
  days_inactive,
  reward_type,
  reward_value,
  auto_create_voucher,
  active
) VALUES (
  '90 Day VIP Return',
  'Special comeback offer',
  90,
  'discount',
  '£10 Off',
  true,
  true
);
```

### **Reward Types:**

| Type | Example | How It Works |
|------|---------|--------------|
| `stamps` | '5 Bonus Stamps' | Auto-adds stamps on check-in |
| `points` | '100 Bonus Points' | Auto-adds points on check-in |
| `free_item` | 'Free Coffee' | Creates voucher with QR code |
| `discount` | '£5 Off' | Creates discount voucher |
| `voucher` | 'Custom Voucher' | Creates custom voucher |

---

## 🔄 Auto-Claim Flow

```
User inactive 30 days
  ↓
System sends win-back email
  ↓
Tracks in user_winback_rewards table
  ↓
User checks in again
  ↓
Trigger: claim_winback_on_checkin
  ↓
Checks for unclaimed win-back rewards
  ↓
Auto-awards:
  - Stamps → Added to coffee_stamps
  - Points → Added via add_points()
  - Voucher → Already created, just marked claimed
  ↓
User sees reward immediately!
```

---

## 📊 Database Tables

### **winback_rewards** (Configuration)
```sql
id                  UUID
name                TEXT
description         TEXT
days_inactive       INTEGER  -- 30, 60, 90, etc.
reward_type         TEXT     -- 'stamps', 'points', 'free_item', 'discount'
reward_value        TEXT     -- '5 Bonus Stamps', 'Free Coffee', etc.
reward_id           UUID     -- Link to rewards table (optional)
auto_create_voucher BOOLEAN  -- Create voucher when email sent?
active              BOOLEAN
```

### **user_winback_rewards** (Tracking)
```sql
id                  UUID
user_id             UUID
winback_reward_id   UUID
email_sent_at       TIMESTAMP
claimed             BOOLEAN
claimed_at          TIMESTAMP
user_reward_id      UUID     -- Link to created voucher
expires_at          TIMESTAMP
```

---

## 🎯 Examples

### **Change 30-Day Offer:**
```sql
UPDATE winback_rewards
SET reward_value = '5 Bonus Stamps + Free Coffee',
    reward_type = 'free_item',
    auto_create_voucher = true
WHERE days_inactive = 30;
```

### **Add 45-Day Offer:**
```sql
INSERT INTO winback_rewards (
  name, description, days_inactive, reward_type, reward_value, active
) VALUES (
  '45 Day Special',
  'Mid-range comeback offer',
  45,
  'stamps',
  '7 Bonus Stamps',
  true
);
```

### **Disable a Win-Back Offer:**
```sql
UPDATE winback_rewards
SET active = false
WHERE days_inactive = 90;
```

### **See Who Got Win-Back Offers:**
```sql
SELECT 
  u.name,
  u.email,
  wr.reward_value,
  uwr.email_sent_at,
  uwr.claimed,
  uwr.claimed_at
FROM user_winback_rewards uwr
JOIN users u ON uwr.user_id = u.id
JOIN winback_rewards wr ON uwr.winback_reward_id = wr.id
ORDER BY uwr.email_sent_at DESC;
```

---

## 🚀 Setup Instructions

### **1. Run Migrations:**
```sql
-- In Supabase SQL Editor:
1. 20251011_birthday_email_system.sql
2. 20251011_dynamic_winback_rewards.sql
```

### **2. Update API Route:**

Add to `app/api/emails/send-reminders/route.ts`:

```typescript
// Birthday emails
const { data: birthdayData } = await supabase.rpc('send_birthday_emails')
const birthdayCount = birthdayData?.[0]?.emails_queued || 0

// Update response
return NextResponse.json({
  success: true,
  message: `Queued ${totalEmails} emails`,
  details: {
    // ... existing counts
    birthdays: birthdayCount,
    total: totalEmails
  }
})
```

### **3. Test Birthday Email:**

```sql
-- Set your birthday to today
UPDATE users 
SET birthday = CURRENT_DATE
WHERE email = 'your-email@example.com';

-- Run birthday function
SELECT * FROM send_birthday_emails();

-- Check queue
SELECT * FROM email_queue WHERE subject LIKE '%Birthday%';
```

### **4. Test Win-Back:**

```sql
-- Simulate 30-day inactive user
UPDATE transactions
SET created_at = NOW() - INTERVAL '30 days'
WHERE user_id = 'your-user-id' AND action = 'check_in'
ORDER BY created_at DESC
LIMIT 1;

-- Run win-back function
SELECT * FROM send_winback_30_emails();

-- Check if reward was tracked
SELECT * FROM user_winback_rewards WHERE user_id = 'your-user-id';
```

---

## ✅ Summary

### **Birthday System:**
- ✅ Auto-sends on birthday
- ✅ 3 reward options (cake/bake/£5 off)
- ✅ 7-day validity
- ✅ QR code voucher

### **Win-Back System:**
- ✅ Fully configurable in database
- ✅ Auto-claims on check-in
- ✅ Tracks who received what
- ✅ Change rewards anytime
- ✅ No code changes needed

### **To Change Rewards:**
Just update the `winback_rewards` table! 🎉

```sql
-- Example: Make 30-day offer better
UPDATE winback_rewards
SET reward_value = '10 Bonus Stamps'
WHERE days_inactive = 30;
```

That's it! The system handles the rest automatically! 🚀
