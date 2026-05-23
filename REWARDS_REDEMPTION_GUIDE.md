# 🎁 Rewards Redemption System - Complete Guide

## 🎯 Overview

**Two separate pages:**
1. **Rewards Catalog** (`/rewards/catalog`) - Browse and redeem rewards with points
2. **My Rewards** (`/rewards`) - View redeemed rewards with QR codes

---

## ✨ New Features

### **1. Rewards Catalog Page**
- Browse all available rewards
- See points cost for each reward
- Redeem rewards with points
- Points automatically deducted
- Beautiful Amanda-style UI

### **2. Points Deduction**
- Points deducted when reward redeemed
- Transaction logged in database
- Refund if redemption fails
- Balance updated immediately

### **3. Reward Status Tracking**
- `active` - Not yet used
- `redeemed` - Used by staff
- QR code for staff to scan
- Expiry dates (30 days)

---

## 📱 User Flow

### **Step 1: Browse Rewards**
1. User goes to dashboard
2. Clicks "Redeem Points" button
3. Sees rewards catalog with prices

### **Step 2: Check Affordability**
- Green/clickable = Can afford
- Grayed out = Not enough points
- Shows "Need X more points"

### **Step 3: Redeem**
1. Click on reward
2. Confirmation dialog shows:
   - Reward details
   - Points cost
   - Points remaining after
3. Click "Yes, Redeem!"
4. Points deducted
5. Reward added to "My Rewards"

### **Step 4: Use Reward**
1. Go to "My Rewards"
2. Click on reward
3. Show QR code to staff
4. Staff scans and marks as redeemed

---

## 🎨 UI Features

### **Rewards Catalog:**
```
┌─────────────────────────────────────┐
│ ✨ Rewards Catalog     [500 points] │
├─────────────────────────────────────┤
│ ✨ Omg so many rewards! ✨          │
│ Use your points to redeem treats!   │
├─────────────────────────────────────┤
│ 🍰 Free Pastry                      │
│ Delicious pastry of your choice     │
│ ⭐ 50 points    [Redeem Now! 🎉]   │
├─────────────────────────────────────┤
│ ☕ Free Coffee                       │
│ Any coffee from our menu            │
│ ⭐ 75 points    [Redeem Now! 🎉]   │
├─────────────────────────────────────┤
│ 💰 20% Off Voucher                  │
│ 20% off your next purchase          │
│ ⭐ 100 points   [Need 50 more] 🔒  │
└─────────────────────────────────────┘
```

### **My Rewards:**
```
┌─────────────────────────────────────┐
│ 🎁 My Rewards                       │
├─────────────────────────────────────┤
│ Active Rewards (2)                  │
├─────────────────────────────────────┤
│ 🍰 Free Pastry                      │
│ Expires in 28 days                  │
│ [Show QR Code]                      │
├─────────────────────────────────────┤
│ ☕ Free Coffee                       │
│ Expires in 15 days                  │
│ [Show QR Code]                      │
└─────────────────────────────────────┘
```

---

## 💾 Database Changes

### **Points Transactions:**
```sql
-- When redeeming reward
INSERT INTO points_transactions (
  user_id,
  amount,        -- Negative (e.g., -50)
  source,        -- 'reward_redemption'
  description    -- 'Redeemed: Free Coffee'
)
```

### **User Rewards:**
```sql
-- When reward redeemed
INSERT INTO user_rewards (
  user_id,
  reward_id,
  qr_code,       -- 'REWARD-123456-ABC'
  status,        -- 'active'
  expires_at     -- 30 days from now
)
```

### **Status Flow:**
1. **active** - Just redeemed, not used yet
2. **redeemed** - Staff scanned QR, reward used
3. **expired** - Past expiry date (handled by cron)

---

## 🔄 Staff Workflow

### **When Customer Shows QR:**
1. Staff opens admin panel
2. Scans QR code or enters code manually
3. System shows reward details
4. Staff confirms redemption
5. Status changes to `redeemed`
6. Customer can't use again

---

## 🛡️ Security Features

### **Points Protection:**
- Points deducted atomically
- Refund if reward creation fails
- Transaction logged
- Can't redeem without enough points

### **Stock Management:**
- Optional stock limits
- Decrements on redemption
- Shows "Out of Stock" when empty
- Prevents over-redemption

### **Expiry Handling:**
- All rewards expire in 30 days
- Shows countdown
- Highlights when < 3 days left
- Cron job marks expired rewards

---

## 📊 Admin View

### **Rewards Table:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Reward name |
| `description` | TEXT | What it is |
| `type` | TEXT | food, drink, discount |
| `value` | TEXT | Display value (e.g., "£5") |
| `points_cost` | INT | Points to redeem |
| `stock` | INT | NULL = unlimited |
| `active` | BOOL | Available to redeem |

### **User Rewards Table:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Who redeemed |
| `reward_id` | UUID | What reward |
| `qr_code` | TEXT | Unique code |
| `status` | TEXT | active/redeemed/expired |
| `created_at` | TIMESTAMP | When redeemed |
| `redeemed_at` | TIMESTAMP | When used |
| `expires_at` | TIMESTAMP | Expiry date |

---

## 🎉 Amanda-Style Messages

### **Catalog Header:**
"✨ Omg so many rewards to choose from! ✨  
Use your points to redeem amazing treats! Each reward costs different points - pick your fave! 💕"

### **After Redemption:**
"🎉 Yaaas! Reward Redeemed!  
[Reward Name] is now in your rewards! Go check it out! 💕"

### **Not Enough Points:**
"Need [X] more points to redeem this! Keep earning! 🌟"

### **Out of Stock:**
"Oh no! This reward is out of stock right now. Try another one! 💫"

---

## 🚀 Setup Steps

### **1. Add Rewards to Database:**
```sql
INSERT INTO rewards (name, description, type, value, points_cost, active) VALUES
('Free Coffee', 'Any coffee from our menu', 'drink', '£3.50', 75, true),
('Free Pastry', 'Delicious pastry of your choice', 'food', '£2.50', 50, true),
('20% Off Voucher', '20% off your next purchase', 'discount', '20%', 100, true),
('£5 Off Voucher', '£5 off any purchase over £10', 'discount', '£5', 150, true);
```

### **2. Test Redemption:**
1. Give user some points
2. Go to `/rewards/catalog`
3. Click on reward
4. Confirm redemption
5. Check points deducted
6. Check reward in `/rewards`

### **3. Test Staff Workflow:**
1. Customer shows QR code
2. Staff scans in admin
3. Marks as redeemed
4. Status updates

---

## 📱 Navigation

### **From Dashboard:**
- "Redeem Points" → `/rewards/catalog`
- "My Rewards" → `/rewards`

### **From Catalog:**
- "My Rewards" button at bottom

### **From My Rewards:**
- Back button → Dashboard

---

## 🎯 Benefits

### **For Customers:**
- ✅ See all rewards in one place
- ✅ Know exactly what they can afford
- ✅ Instant redemption
- ✅ QR codes easy to use
- ✅ Track active rewards

### **For Penkey:**
- ✅ Automated points deduction
- ✅ No manual tracking needed
- ✅ Stock management
- ✅ Transaction logs
- ✅ Expiry handling

---

## 🔮 Future Enhancements

- [ ] Limited-time rewards
- [ ] Seasonal rewards
- [ ] Reward categories/filters
- [ ] Reward history
- [ ] Gift rewards to friends
- [ ] Combo deals
- [ ] Birthday rewards

---

**The rewards system is now complete and ready to use! 🎁✨**
