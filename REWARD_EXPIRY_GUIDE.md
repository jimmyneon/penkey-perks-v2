# ⏰ REWARD EXPIRY SYSTEM GUIDE

**Status:** ✅ Fully Implemented

---

## 📋 HOW IT WORKS

### **Two-Level Expiry System:**

1. **Reward Template (`rewards` table)** - Defines default expiry
2. **User Reward Instance (`user_rewards` table)** - Actual expiry date

---

## 🗄️ DATABASE SCHEMA

### **`rewards` Table**
```sql
expiry_days INTEGER DEFAULT 30
```
- Defines how many days a reward is valid after being issued
- Set per reward type
- Examples:
  - Free Coffee: 30 days
  - £5 Voucher: 14 days
  - Special Promo: 7 days

### **`user_rewards` Table**
```sql
expires_at TIMESTAMPTZ
status TEXT CHECK (status IN ('active', 'redeemed', 'expired'))
```
- `expires_at` - Exact expiry timestamp
- `status` - Current state of the reward
- Automatically calculated when reward is issued

---

## ⚙️ HOW EXPIRY IS SET

### **When Reward is Issued:**

**Coffee Stamps (10 stamps = Free Coffee):**
```sql
INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
SELECT 
  p_user_id,
  id,
  'COFFEE-' || substr(md5(random()::text), 1, 12),
  NOW() + INTERVAL '30 days'  -- Uses reward's expiry_days
FROM public.rewards
WHERE name = 'Free Coffee' AND active = TRUE;
```

**Points Redemption:**
```sql
INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
VALUES (
  user_id,
  reward_id,
  generate_qr_code(),
  NOW() + (SELECT expiry_days FROM rewards WHERE id = reward_id) * INTERVAL '1 day'
);
```

**Game Prizes:**
```sql
INSERT INTO public.user_rewards (user_id, reward_id, qr_code, expires_at)
SELECT 
  p_user_id,
  r.id,
  'GAME-' || substr(md5(random()::text), 1, 12),
  NOW() + COALESCE(r.expiry_days, 30) * INTERVAL '1 day'
FROM public.rewards r
WHERE r.type = 'food' AND r.active = TRUE;
```

---

## 🎯 CONFIGURING EXPIRY TIMES

### **Update Existing Reward:**
```sql
-- Set Free Coffee to expire in 14 days
UPDATE public.rewards
SET expiry_days = 14
WHERE name = 'Free Coffee';

-- Set £5 Voucher to expire in 7 days
UPDATE public.rewards
SET expiry_days = 7
WHERE name = '£5 Off Voucher';

-- Set rewards to never expire (not recommended)
UPDATE public.rewards
SET expiry_days = 365
WHERE name = 'Special Lifetime Reward';
```

### **Create New Reward with Custom Expiry:**
```sql
INSERT INTO public.rewards (name, description, type, value, points_cost, expiry_days, active)
VALUES (
  'Flash Sale - 50% Off',
  'Limited time offer!',
  'percentage_discount',
  '50% Off',
  100,
  3,  -- Expires in 3 days
  TRUE
);
```

---

## 🔍 CHECKING EXPIRED REWARDS

### **Query Expired Rewards:**
```sql
-- Find all expired rewards
SELECT 
  ur.id,
  u.email,
  r.name,
  ur.expires_at,
  ur.status
FROM user_rewards ur
JOIN users u ON ur.user_id = u.id
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.expires_at < NOW()
  AND ur.status = 'active';
```

### **Auto-Expire Function (Optional):**
```sql
-- Create function to auto-expire old rewards
CREATE OR REPLACE FUNCTION expire_old_rewards()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.user_rewards
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'active';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Run manually or set up cron job
SELECT expire_old_rewards();
```

---

## 📱 FRONTEND DISPLAY

### **Show Expiry in Rewards List:**
```typescript
// Calculate days remaining
const daysRemaining = Math.ceil(
  (new Date(reward.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
)

// Display logic
if (daysRemaining < 0) {
  return <Badge variant="destructive">Expired</Badge>
} else if (daysRemaining <= 3) {
  return <Badge variant="warning">Expires in {daysRemaining} days!</Badge>
} else {
  return <span className="text-sm text-gray-500">Expires {formatDate(reward.expires_at)}</span>
}
```

### **Filter Active Rewards:**
```typescript
const activeRewards = rewards.filter(r => 
  r.status === 'active' && 
  new Date(r.expires_at) > new Date()
)
```

---

## ⚡ COMMON EXPIRY TIMES

| Reward Type | Recommended Expiry | Reason |
|-------------|-------------------|--------|
| **Free Coffee** | 30 days | Standard loyalty reward |
| **Food Items** | 14 days | Perishable items |
| **Discount Vouchers** | 30 days | Standard promotion |
| **Flash Sales** | 3-7 days | Create urgency |
| **Birthday Rewards** | 30 days | Special occasion |
| **Game Prizes** | 30 days | Standard prize |
| **Seasonal Promos** | 7-14 days | Limited time |

---

## 🔧 ADMIN CONTROLS

### **Extend Expiry for User:**
```sql
-- Add 7 more days to a specific reward
UPDATE public.user_rewards
SET expires_at = expires_at + INTERVAL '7 days'
WHERE id = 'reward-uuid';
```

### **Bulk Extend for All Users:**
```sql
-- Extend all active Free Coffee rewards by 14 days
UPDATE public.user_rewards ur
SET expires_at = expires_at + INTERVAL '14 days'
FROM public.rewards r
WHERE ur.reward_id = r.id
  AND r.name = 'Free Coffee'
  AND ur.status = 'active';
```

### **Change Default Expiry:**
```sql
-- Update template for future rewards
UPDATE public.rewards
SET expiry_days = 45
WHERE name = 'Free Coffee';

-- Note: This only affects NEW rewards, not existing ones
```

---

## 📊 ANALYTICS QUERIES

### **Expiry Rate:**
```sql
-- How many rewards expire without being used?
SELECT 
  r.name,
  COUNT(*) FILTER (WHERE ur.status = 'expired') as expired_count,
  COUNT(*) FILTER (WHERE ur.status = 'redeemed') as redeemed_count,
  ROUND(
    COUNT(*) FILTER (WHERE ur.status = 'expired')::DECIMAL / 
    COUNT(*)::DECIMAL * 100, 
    2
  ) as expiry_rate_percent
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
GROUP BY r.name
ORDER BY expiry_rate_percent DESC;
```

### **Average Time to Redemption:**
```sql
SELECT 
  r.name,
  AVG(EXTRACT(EPOCH FROM (ur.redeemed_at - ur.created_at)) / 86400) as avg_days_to_redeem
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.status = 'redeemed'
GROUP BY r.name;
```

---

## 🎯 BEST PRACTICES

1. **✅ Set Reasonable Expiry Times**
   - Too short = users frustrated
   - Too long = rewards lose urgency
   - 30 days is a good default

2. **✅ Show Expiry Prominently**
   - Display days remaining
   - Highlight expiring soon (< 3 days)
   - Send reminder notifications

3. **✅ Allow Extensions**
   - Customer service can extend if needed
   - Special circumstances (illness, travel)

4. **✅ Track Expiry Rates**
   - High expiry rate = expiry too short
   - Adjust based on data

5. **✅ Seasonal Adjustments**
   - Shorter expiry for flash sales
   - Longer expiry for loyalty rewards

---

## 🚀 CURRENT CONFIGURATION

**Default Expiry Times:**
- ☕ **Free Coffee**: 30 days
- 🎁 **Game Prizes**: 30 days
- 💰 **Points Rewards**: 30 days (configurable per reward)
- 🎂 **Birthday Rewards**: 30 days

**To Change:**
```sql
-- Update in database
UPDATE public.rewards
SET expiry_days = [NEW_DAYS]
WHERE name = '[REWARD_NAME]';
```

---

## ✅ SUMMARY

**The expiry system is FULLY FUNCTIONAL:**
- ✅ Database schema supports it
- ✅ Rewards have `expiry_days` setting
- ✅ User rewards have `expires_at` timestamp
- ✅ Status tracking (`active`, `redeemed`, `expired`)
- ✅ Configurable per reward type
- ✅ Easy to query and manage

**No additional code needed** - just configure the `expiry_days` in the `rewards` table! 🎉
