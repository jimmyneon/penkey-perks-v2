# 🎨 Dashboard UI Components - Complete Guide

## ✅ New Components Created

I've created 3 beautiful, production-ready components for the dashboard:

---

## 1️⃣ **PendingRewardsBanner** 🎁

**File:** `components/dashboard/pending-rewards-banner.tsx`

### **What It Does:**
- Shows eye-catching banner when user has pending rewards
- Displays total count and urgency
- Shows summary of points, stamps, vouchers
- Lists first 3 pending rewards
- Big CTA button to check in

### **Features:**
- ✅ Animated gradient background
- ✅ Urgency colors (green → yellow → orange → red)
- ✅ Days left countdown
- ✅ Auto-hides if no pending rewards
- ✅ Responsive design
- ✅ Real-time data from Supabase

### **Usage:**
```tsx
import { PendingRewardsBanner } from '@/components/dashboard/pending-rewards-banner'

export default function Dashboard() {
  return (
    <div>
      <PendingRewardsBanner />
      {/* Rest of dashboard */}
    </div>
  )
}
```

### **Visual:**
```
┌─────────────────────────────────────────────────┐
│ 🎁 You Have 3 Pending Rewards!        ⏰ 2 days │
│ Check in at Penkey to claim them all            │
│                                                  │
│ ┌─────┐  ┌─────┐  ┌─────┐                      │
│ │  15 │  │  5  │  │  1  │                      │
│ │Points│  │Stamps│  │Voucher│                  │
│ └─────┘  └─────┘  └─────┘                      │
│                                                  │
│ ✨ 5 Stamps from Scratch Card           2d      │
│ ✨ 10 Points from Referral              3d      │
│ ✨ Free Coffee Voucher                  5d      │
│                                                  │
│ [🎁 Check In to Claim All Rewards →]           │
└─────────────────────────────────────────────────┘
```

---

## 2️⃣ **PendingRewardsCard** 📋

**File:** `components/dashboard/pending-rewards-card.tsx`

### **What It Does:**
- Detailed list of ALL pending rewards
- Shows progress bar for each reward
- Source badges (game win, referral, etc.)
- Urgency indicators
- Instructions on how to claim

### **Features:**
- ✅ Individual reward cards
- ✅ Progress bars showing time left
- ✅ Source icons and labels
- ✅ Amount badges
- ✅ Urgency messages for expiring soon
- ✅ Empty state with helpful message
- ✅ How-to-claim instructions

### **Usage:**
```tsx
import { PendingRewardsCard } from '@/components/dashboard/pending-rewards-card'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PendingRewardsCard />
      {/* Other cards */}
    </div>
  )
}
```

### **Visual:**
```
┌─────────────────────────────────────────────────┐
│ 🎁 Pending Rewards (3)                          │
│ Check in at Penkey to claim these rewards       │
├─────────────────────────────────────────────────┤
│ ☕ 5 Stamps from Scratch Card                   │
│ From game win                         ⏰ 2 days │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 45%     │
│ Earned Oct 1 • Expires Oct 15                   │
│ ⚠️ Only 2 days left to claim!                   │
├─────────────────────────────────────────────────┤
│ 💰 10 Points from Referral                      │
│ From referral                         ⏰ 3 days │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░ 60%      │
│ Earned Oct 3 • Expires Oct 17                   │
├─────────────────────────────────────────────────┤
│ 📍 How to Claim Your Rewards                    │
│ 1. Visit Penkey Deli                            │
│ 2. Open the Penkey Perks app                    │
│ 3. Tap "Check In"                               │
│ 4. All rewards claimed automatically! 🎉        │
└─────────────────────────────────────────────────┘
```

---

## 3️⃣ **StreakCard** 🔥

**File:** `components/dashboard/streak-card.tsx`

### **What It Does:**
- Shows current check-in streak
- Displays points multiplier
- Progress to next milestone
- Longest streak and total check-ins
- Motivational messages

### **Features:**
- ✅ Gradient streak counter
- ✅ Multiplier badge (1x → 2x)
- ✅ Progress bar to next level
- ✅ Milestone indicators (3, 5, 7 days)
- ✅ Stats (longest streak, total check-ins)
- ✅ Dynamic motivation messages
- ✅ Color-coded by streak level

### **Usage:**
```tsx
import { StreakCard } from '@/components/dashboard/streak-card'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StreakCard />
      {/* Other cards */}
    </div>
  )
}
```

### **Visual:**
```
┌─────────────────────────────────────────────────┐
│ 🔥 Check-In Streak                              │
│ Visit daily to increase your points multiplier  │
├─────────────────────────────────────────────────┤
│                      5                           │
│                  Days Streak ⭐                  │
│                                                  │
│              🔥 1.5x Points Multiplier           │
│                                                  │
│ Progress to Gold Streak                   5/7   │
│ ████████████████████████░░░░░░░░░░░░░░░ 71%    │
│ 2 more days to unlock 2x multiplier!            │
│                                                  │
│ ┌─────┐  ┌─────┐  ┌─────┐                      │
│ │  ✅ │  │  ✅ │  │  🔒 │                      │
│ │3 Days│  │5 Days│  │7 Days│                   │
│ │1.25x │  │1.5x  │  │2.0x  │                   │
│ └─────┘  └─────┘  └─────┘                      │
│                                                  │
│ 🏆 Longest: 8 days    📅 Total: 42 visits      │
│                                                  │
│ 🌟 Amazing! 2 more days to unlock 2x points!   │
└─────────────────────────────────────────────────┘
```

---

## 🎨 How to Integrate into Dashboard

### **Option 1: Full Dashboard Layout**

```tsx
// app/dashboard/page.tsx
import { PendingRewardsBanner } from '@/components/dashboard/pending-rewards-banner'
import { PendingRewardsCard } from '@/components/dashboard/pending-rewards-card'
import { StreakCard } from '@/components/dashboard/streak-card'
// ... other imports

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Pending Rewards Banner - Shows at top if user has pending rewards */}
      <PendingRewardsBanner />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Streak Card */}
        <StreakCard />

        {/* Points Card (existing) */}
        <YourExistingPointsCard />

        {/* Stamps Card (existing) */}
        <YourExistingStampsCard />

        {/* Pending Rewards Card - Full width on mobile, spans 2 cols on desktop */}
        <div className="md:col-span-2 lg:col-span-3">
          <PendingRewardsCard />
        </div>

        {/* Other existing cards */}
      </div>
    </div>
  )
}
```

### **Option 2: Minimal Integration**

```tsx
// Just add the banner at the top
import { PendingRewardsBanner } from '@/components/dashboard/pending-rewards-banner'

export default function DashboardPage() {
  return (
    <div>
      <PendingRewardsBanner />
      {/* Your existing dashboard */}
    </div>
  )
}
```

---

## 🎯 Component Behavior

### **PendingRewardsBanner:**
- ✅ Auto-hides if `pending_rewards_count = 0`
- ✅ Updates in real-time when rewards are claimed
- ✅ Shows urgency based on closest expiry date
- ✅ Links to check-in page

### **PendingRewardsCard:**
- ✅ Shows empty state if no pending rewards
- ✅ Sorts by expiry date (soonest first)
- ✅ Progress bars show time elapsed
- ✅ Urgency warnings for rewards expiring soon

### **StreakCard:**
- ✅ Updates after each check-in
- ✅ Shows current multiplier
- ✅ Progress to next milestone
- ✅ Motivational messages based on streak level

---

## 🎨 Styling

All components use:
- ✅ Tailwind CSS classes
- ✅ shadcn/ui components (Card, Button, Badge, Progress)
- ✅ Lucide icons
- ✅ Penkey brand colors:
  - `penkey-orange`: #FF8C42
  - `penkey-dark`: #2C3E50
  - `penkey-cream`: #F5F1E8
- ✅ Responsive design (mobile-first)
- ✅ Smooth animations and transitions

---

## 📱 Responsive Design

### **Mobile (< 768px):**
- Single column layout
- Banner stacks vertically
- Cards full width

### **Tablet (768px - 1024px):**
- 2 column grid
- Banner spans full width
- Cards side-by-side

### **Desktop (> 1024px):**
- 3 column grid
- Banner spans full width
- Optimal spacing

---

## 🔄 Real-Time Updates

All components fetch data on mount and can be refreshed:

```tsx
// Force refresh after check-in
const handleCheckIn = async () => {
  // ... check-in logic
  
  // Refresh components
  window.location.reload() // Simple approach
  
  // Or use state management for smoother UX
}
```

---

## 🎁 Additional Features

### **Toast Notifications:**
Add toast when rewards are claimed:

```tsx
import { toast } from 'sonner'

// After successful check-in
toast.success('You claimed 3 rewards!', {
  description: '15 points, 5 stamps, and 1 voucher added to your account'
})
```

### **Confetti Animation:**
Add celebration when claiming rewards:

```tsx
import confetti from 'canvas-confetti'

// After claiming rewards
if (claimedCount > 0) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}
```

---

## 📊 Data Flow

```
Database (pending_rewards table)
  ↓
Supabase Client (real-time fetch)
  ↓
React Component (useState)
  ↓
UI Render (Tailwind + shadcn)
  ↓
User Interaction (check-in button)
  ↓
API Call (claim_pending_rewards)
  ↓
Database Update
  ↓
Component Re-fetch
  ↓
UI Update (rewards claimed!)
```

---

## ✅ Testing Checklist

- [ ] Banner shows when pending rewards exist
- [ ] Banner hides when no pending rewards
- [ ] Urgency colors change based on days left
- [ ] Progress bars animate correctly
- [ ] Streak card shows correct multiplier
- [ ] Milestone indicators update
- [ ] Empty states display properly
- [ ] Mobile responsive layout works
- [ ] Links navigate correctly
- [ ] Real-time data updates

---

## 🚀 Quick Start

1. **Copy the 3 component files** to your project
2. **Import into your dashboard page**
3. **Add at the top of your dashboard:**
   ```tsx
   <PendingRewardsBanner />
   ```
4. **Add to your grid:**
   ```tsx
   <StreakCard />
   <PendingRewardsCard />
   ```
5. **Done!** 🎉

---

## 🎨 Customization

### **Change Colors:**
```tsx
// In component files, replace:
bg-penkey-orange → bg-blue-500
text-penkey-dark → text-gray-900
```

### **Change Urgency Thresholds:**
```tsx
// In getUrgencyColor function:
if (daysLeft <= 1) return 'red'  // Change from 1 to 2
if (daysLeft <= 3) return 'orange'  // Change from 3 to 5
```

### **Change Streak Milestones:**
```tsx
// In StreakCard component:
if (currentStreak < 3) return { target: 3, multiplier: 1.25 }
// Change to:
if (currentStreak < 5) return { target: 5, multiplier: 1.5 }
```

---

## 🎉 You're All Set!

Your dashboard now has:
- ✅ Eye-catching pending rewards banner
- ✅ Detailed pending rewards list
- ✅ Streak tracking with multipliers
- ✅ Beautiful, responsive UI
- ✅ Real-time data updates
- ✅ Urgency indicators
- ✅ Motivational messages

**Users will love it!** 🚀
