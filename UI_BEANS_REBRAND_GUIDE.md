# UI Rebranding Guide: Points → Beans 🫘

## Overview

This guide covers all frontend changes needed to rebrand from "points" to "beans" throughout the application.

---

## 🎨 Design System Updates

### Colors

Add to your Tailwind config or global CSS:

```css
/* Bean-themed colors */
--bean-brown: #8B4513;
--bean-light: #D2691E;
--bean-dark: #654321;
--bean-gradient: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
```

### Icons

Replace all point icons with bean emoji or custom bean icon:
- **Emoji:** 🫘 (coffee bean)
- **Alternative:** ☕ (coffee cup)
- **Custom:** Create SVG bean icon

---

## 📝 Text Replacements

### Global Find & Replace

**Case-sensitive replacements needed:**

| Find | Replace | Notes |
|------|---------|-------|
| `points` | `beans` | Lowercase |
| `Points` | `Beans` | Capitalized |
| `POINTS` | `BEANS` | Uppercase |
| `point` | `bean` | Singular lowercase |
| `Point` | `Bean` | Singular capitalized |
| `pts` | `beans` | Abbreviation |

**Files to update:**
- All `.tsx` and `.ts` files in `/app`
- All `.tsx` files in `/components`
- Email templates in migrations
- Admin dashboard pages

---

## 🔧 Component Updates

### 1. Points Card Component

**File:** `/components/dashboard/points-card.tsx`

**Changes needed:**

```tsx
// Before
<h3>Your Points</h3>
<p>{points} pts</p>

// After
<h3>Your Beans</h3>
<p className="flex items-center gap-2">
  <span className="text-2xl">🫘</span>
  {beans} beans
</p>
```

**Full component update:**

```tsx
// Add bean icon and gradient
<div className="bg-gradient-to-br from-[#8B4513] to-[#D2691E] rounded-lg p-6 text-white">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Your Beans</h3>
    <span className="text-3xl">🫘</span>
  </div>
  
  <div className="text-4xl font-bold mb-2">
    {beans.toLocaleString()}
  </div>
  
  <p className="text-sm opacity-90">
    Keep collecting to unlock rewards!
  </p>
</div>
```

### 2. Rewards Page

**File:** `/app/rewards/page.tsx`

**Changes:**

```tsx
// Update reward costs display
<div className="flex items-center gap-2">
  <span className="text-xl">🫘</span>
  <span className="font-bold">{reward.points_required} beans</span>
</div>

// Update "Can afford" logic display
{userBeans >= reward.points_required ? (
  <Badge variant="success">You can afford this! 🎉</Badge>
) : (
  <Badge variant="secondary">
    Need {(reward.points_required - userBeans).toLocaleString()} more beans
  </Badge>
)}
```

### 3. Admin Points Config Page

**File:** `/app/admin/points-config/page.tsx`

**Changes:**

```tsx
// Update table headers
<TableHead>Beans Amount</TableHead>

// Update form labels
<Label htmlFor="points_amount">Beans Amount</Label>
<Input
  id="points_amount"
  name="points_amount"
  type="number"
  placeholder="e.g., 250"
/>

// Update display text
<span className="flex items-center gap-1">
  🫘 {config.points_amount} beans
</span>
```

### 4. Dashboard Stats

**File:** `/app/dashboard/page.tsx`

**Update stats cards:**

```tsx
<StatsCard
  title="Total Beans"
  value={totalBeans.toLocaleString()}
  icon="🫘"
  trend="+250 this week"
  color="brown"
/>

<StatsCard
  title="Beans to Next Reward"
  value={(nextRewardCost - totalBeans).toLocaleString()}
  icon="🎁"
  subtitle={`${nextRewardName} (${nextRewardCost} beans)`}
/>
```

### 5. Transaction History

**File:** `/app/account/transactions/page.tsx`

**Changes:**

```tsx
// Update transaction display
<div className="flex items-center gap-2">
  {transaction.amount > 0 ? (
    <span className="text-green-600">+{transaction.amount} beans 🫘</span>
  ) : (
    <span className="text-red-600">{transaction.amount} beans 🫘</span>
  )}
</div>

// Update source labels
const sourceLabels = {
  'daily_checkin': 'Daily Check-in',
  'game_win': 'Game Win',
  'signup_bonus': 'Welcome Bonus',
  'streak_7_days': '7-Day Streak Bonus',
  'streak_14_days': '14-Day Streak Bonus',
  'streak_30_days': '30-Day Streak Bonus',
  // ... etc
};
```

### 6. Notification Banner

**File:** `/components/dashboard/notification-banner.tsx`

**Update pending rewards messaging:**

```tsx
// Before
<p>You have {pendingCount} pending rewards worth {pendingPoints} points!</p>

// After
<p className="flex items-center gap-2">
  You have {pendingCount} pending rewards worth 
  <span className="font-bold flex items-center gap-1">
    🫘 {pendingBeans} beans
  </span>
  waiting for you!
</p>
```

---

## 🎯 API Response Updates

### Type Definitions

**File:** `/types/database.ts`

**Update interfaces:**

```typescript
// Add beans-specific types
export interface BeansBalance {
  user_id: string;
  total_beans: number;
  last_transaction: string;
}

export interface BeansTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  source: string;
  description: string;
  created_at: string;
}

export interface BeansReward {
  id: string;
  name: string;
  description: string;
  beans_required: number; // Renamed from points_required
  reward_type: string;
  active: boolean;
}

// Update existing types
export interface PointsConfig {
  action_type: string;
  beans_amount: number; // Renamed from points_amount
  description: string;
  active: boolean;
}
```

### API Routes

**Update all API responses to use "beans" terminology:**

```typescript
// app/api/points/balance/route.ts
export async function GET(request: Request) {
  // ... auth logic
  
  const balance = await getBeansBalance(userId);
  
  return NextResponse.json({
    beans: balance, // Changed from "points"
    currency: "beans",
    icon: "🫘"
  });
}
```

---

## 📧 Email Template Updates

### Template Variables

Update all email templates to use beans terminology:

```html
<!-- Before -->
<p>You earned {{points}} points!</p>

<!-- After -->
<p>You earned {{beans}} beans! 🫘</p>
```

### Welcome Email

```html
<h2>Welcome to Penkey Perks! 🎉</h2>
<p>You've received your welcome bonus:</p>
<ul>
  <li>🫘 250 beans (pending)</li>
  <li>☕ 1 Free Coffee (pending)</li>
</ul>
<p>Visit us to claim your rewards!</p>
```

---

## 🎨 Visual Enhancements

### Bean Counter Animation

Add a fun bean counter animation when points are awarded:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function BeansCounter({ value, previousValue }: { value: number; previousValue: number }) {
  const [showIncrease, setShowIncrease] = useState(false);
  const increase = value - previousValue;
  
  useEffect(() => {
    if (increase > 0) {
      setShowIncrease(true);
      setTimeout(() => setShowIncrease(false), 2000);
    }
  }, [increase]);
  
  return (
    <div className="relative">
      <motion.div
        className="text-4xl font-bold"
        animate={{ scale: increase > 0 ? [1, 1.1, 1] : 1 }}
      >
        {value.toLocaleString()}
      </motion.div>
      
      {showIncrease && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -30 }}
          className="absolute -top-8 left-0 text-green-600 font-bold"
        >
          +{increase} 🫘
        </motion.div>
      )}
    </div>
  );
}
```

### Bean Progress Bar

```tsx
export function BeansProgressBar({ 
  current, 
  target, 
  label 
}: { 
  current: number; 
  target: number; 
  label: string;
}) {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">
          {current.toLocaleString()} / {target.toLocaleString()} beans
        </span>
      </div>
      
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#8B4513] to-[#D2691E]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      <div className="text-xs text-gray-600 text-right">
        {(100 - percentage).toFixed(0)}% to go
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Visual Testing

- [ ] All "points" text replaced with "beans"
- [ ] Bean emoji (🫘) displays correctly on all devices
- [ ] Brown color scheme applied consistently
- [ ] Numbers format correctly with commas (e.g., 1,500 beans)
- [ ] Singular vs plural handled correctly (1 bean vs 2 beans)

### Functional Testing

- [ ] Points balance displays as beans
- [ ] Transactions show correct bean amounts
- [ ] Rewards show correct bean costs
- [ ] Admin panel updates bean configs correctly
- [ ] Emails use beans terminology
- [ ] Notifications use beans terminology

### Database Testing

- [ ] Existing balances multiplied by 10x
- [ ] New point configs have correct values
- [ ] Reward costs updated correctly
- [ ] Signup bonus triggers correctly
- [ ] Streak bonuses award correct amounts

---

## 📱 Mobile Considerations

### Responsive Bean Display

```tsx
// Adjust bean display for mobile
<div className="flex items-center gap-1 sm:gap-2">
  <span className="text-xl sm:text-2xl">🫘</span>
  <span className="text-lg sm:text-xl font-bold">
    {beans.toLocaleString()}
  </span>
  <span className="text-xs sm:text-sm text-gray-600">
    beans
  </span>
</div>
```

### Touch-Friendly Bean Counter

```tsx
// Make bean displays tappable for details
<button 
  onClick={() => setShowDetails(true)}
  className="flex items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-[#8B4513] to-[#D2691E] text-white active:scale-95 transition-transform"
>
  <span className="text-3xl">🫘</span>
  <div className="text-left">
    <div className="text-2xl font-bold">{beans}</div>
    <div className="text-xs opacity-90">Tap for details</div>
  </div>
</button>
```

---

## 🚀 Deployment Steps

1. **Test locally:**
   ```bash
   npm run dev
   # Check all pages for "points" → "beans" conversion
   ```

2. **Run migration:**
   ```bash
   # Apply SQL migration
   supabase db push
   ```

3. **Deploy frontend:**
   ```bash
   npm run build
   npm run start
   # Or deploy to Vercel
   ```

4. **Verify:**
   - Check all user-facing pages
   - Test admin dashboard
   - Verify emails
   - Check mobile responsiveness

5. **Monitor:**
   - Watch for user feedback
   - Check error logs
   - Monitor bean transactions

---

## 🎉 Launch Announcement

### In-App Banner

```tsx
<div className="bg-gradient-to-r from-[#8B4513] to-[#D2691E] text-white p-6 rounded-lg mb-6">
  <div className="flex items-center gap-4">
    <span className="text-6xl">🫘</span>
    <div>
      <h2 className="text-2xl font-bold mb-2">We've Upgraded to Beans!</h2>
      <p className="text-lg opacity-90">
        Your points have been converted to beans at 10:1 ratio. 
        You now have <strong>{beans.toLocaleString()} beans</strong>!
      </p>
      <p className="text-sm mt-2 opacity-75">
        Same great rewards, better value! 🎁
      </p>
    </div>
  </div>
</div>
```

### Social Media Posts

**Instagram/Facebook:**
```
🫘 BIG NEWS! We're now counting BEANS instead of points!

All your points have been upgraded 10x! 

✨ New signup bonus: 250 beans + FREE coffee
🎁 New rewards: Hoodies, Reusable Cups, and more!
🔥 Bigger bonuses for streaks and games

Visit us today to start collecting beans! ☕

#PenkeyPerks #CoffeeBeans #LoyaltyRewards
```

---

## 📊 Success Metrics

Track these metrics post-launch:

- **Engagement:**
  - Daily active users
  - Check-in frequency
  - Game plays per user

- **Acquisition:**
  - New signups
  - Signup bonus claim rate
  - First-visit conversion

- **Retention:**
  - 7-day streak completion rate
  - 14-day streak completion rate
  - 30-day streak completion rate

- **Monetization:**
  - Average beans earned per user
  - Reward redemption rate
  - Time to first redemption

---

## 🐛 Common Issues & Fixes

### Issue: Bean emoji not displaying

**Fix:** Use fallback text or SVG icon

```tsx
const BeanIcon = () => {
  const [emojiSupported, setEmojiSupported] = useState(true);
  
  return emojiSupported ? (
    <span onError={() => setEmojiSupported(false)}>🫘</span>
  ) : (
    <span className="text-[#8B4513] font-bold">B</span>
  );
};
```

### Issue: Singular/plural grammar

**Fix:** Use helper function

```typescript
export function formatBeans(amount: number): string {
  return `${amount.toLocaleString()} ${amount === 1 ? 'bean' : 'beans'}`;
}
```

### Issue: Old "points" text still showing

**Fix:** Global search and replace, check:
- Email templates in database
- Hardcoded strings in components
- Error messages
- Toast notifications
- Meta descriptions

---

## ✅ Final Checklist

- [ ] SQL migration applied
- [ ] All components updated
- [ ] All API routes updated
- [ ] Email templates updated
- [ ] Admin dashboard updated
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] Emails tested
- [ ] Signup bonus tested
- [ ] Streak bonuses tested
- [ ] Launch announcement ready
- [ ] Social media posts scheduled
- [ ] User communication sent
- [ ] Monitoring dashboard set up

---

**Ready to launch! 🚀🫘**
