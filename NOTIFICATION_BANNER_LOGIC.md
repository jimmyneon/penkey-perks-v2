# 🔔 NOTIFICATION BANNER LOGIC

**File:** `components/dashboard/notification-banner.tsx`

---

## 📋 HOW IT WORKS

The notification banner shows **dynamic messages** based on user activity. It uses a **priority system** to show the most important message.

---

## 🎯 PRIORITY ORDER (Highest to Lowest)

### **1. Streak at Risk** 🔥 (Highest Priority)
**Condition:** User has 7+ day streak AND hasn't checked in today

**Message:**
```
🔥 7 Day Streak!
Visit today to keep your streak alive and earn bonus points!
[Check In Now]
```

**Badge:** Shows streak badge (Weekly Hero, Fortnight Champion, Monthly Warrior)

---

### **2. Haven't Checked In** 📍
**Condition:** User hasn't checked in today

**Message:**
```
📍 Ready for Your Visit?
Check in at Penkey today to earn 5 points!
[Check In]
```

---

### **3. Haven't Added Coffee Stamp** ☕
**Condition:** User checked in today BUT hasn't added coffee stamp

**Message:**
```
☕ Had Your Coffee Yet?
Don't forget to add a stamp when you buy coffee!
[Add Stamp]
```

---

### **4. Haven't Played Game** ✨
**Condition:** User hasn't played today's game (no check-in required)

**Message:**
```
✨ Play Today's Game!
Win bonus points, stamps, or prizes! No check-in needed.
[Play Now]
```

---

### **5. Milestone Approaching** 🏆
**Condition:** User is close to unlocking a reward

**Message:**
```
🏆 Almost There!
5 more visits to unlock a reward!
[View Rewards]
```

---

### **6. All Done** 🎉 (Lowest Priority)
**Condition:** User completed all daily activities

**Message:**
```
🎉 All Done for Today!
You've completed all daily activities. Come back tomorrow!
[View Rewards]
```

---

## 🎨 VISUAL STYLES

### **Variant Types:**

| Variant | Color | When Used |
|---------|-------|-----------|
| `streak` | Orange gradient + pulse | Streak at risk |
| `default` | Orange/cream | Normal messages |
| `success` | Green gradient | All done |

---

## 🔥 STREAK BADGES

Automatically shown when user has a streak:

| Days | Badge | Icon | Color |
|------|-------|------|-------|
| 3-6 | On Fire | 🔥 | Orange |
| 7-13 | Weekly Hero | ⭐ | Green |
| 14-29 | Fortnight Champion | 💪 | Blue |
| 30+ | Monthly Warrior | 🏆 | Purple |

---

## 📊 STREAK PROGRESS BAR

Shows when user has 1-29 day streak:

```
Current Streak: 7 days
7 more for Fortnight Champion
[Progress Bar: 23%]
```

---

## 💻 CODE STRUCTURE

```typescript
const getNotification = () => {
  // Priority 1: Streak bonus
  if (currentStreak >= 7 && !hasCheckedInToday) {
    return { /* streak message */ }
  }

  // Priority 2: Check-in
  if (!hasCheckedInToday) {
    return { /* check-in message */ }
  }

  // Priority 3: Coffee stamp
  if (!hasCoffeeStampToday && hasCheckedInToday) {
    return { /* coffee message */ }
  }

  // Priority 4: Game
  if (!hasPlayedGameToday) {
    return { /* game message */ }
  }

  // Priority 5: Milestone
  if (nextMilestone) {
    return { /* milestone message */ }
  }

  // Priority 6: All done
  return { /* success message */ }
}
```

---

## 🔧 HOW TO CUSTOMIZE

### **Add New Message:**

1. Open `components/dashboard/notification-banner.tsx`
2. Add new condition in `getNotification()` function
3. Return object with:
   - `icon` - Lucide icon component
   - `title` - Bold headline
   - `message` - Description text
   - `action` - Button text & link
   - `variant` - Style variant
   - `badge` (optional) - Badge to display

### **Example:**
```typescript
// Priority X: New condition
if (someCondition) {
  return {
    icon: <Star className="w-6 h-6 text-penkey-orange" />,
    title: 'Special Offer!',
    message: 'Get 2x points today only!',
    action: { text: 'Claim Now', href: '/offers' },
    variant: 'default' as const
  }
}
```

---

## 📝 PROPS REQUIRED

```typescript
interface NotificationBannerProps {
  hasCheckedInToday: boolean      // From check-in status
  hasCoffeeStampToday: boolean    // TODO: Track this
  hasPlayedGameToday: boolean     // From game_plays table
  currentStreak: number           // TODO: From database
  streakType: 'daily' | 'weekly' | 'monthly' | null
  nextMilestone?: {
    type: string
    value: number
    current: number
  }
}
```

---

## 🎯 CURRENT STATUS

### **Working:**
- ✅ Priority system
- ✅ Dynamic messages
- ✅ Action buttons
- ✅ Visual variants
- ✅ Streak badges UI

### **TODO:**
- [ ] Track `hasCoffeeStampToday` in database
- [ ] Implement streak tracking in database
- [ ] Calculate `currentStreak` from visits
- [ ] Add milestone tracking

---

## 🚀 FUTURE ENHANCEMENTS

1. **Time-based messages**
   - Morning: "Good morning! Start your day with coffee"
   - Evening: "Evening visit? Get bonus points!"

2. **Personalized messages**
   - Birthday: "Happy Birthday! Free coffee today!"
   - Anniversary: "You've been with us for 1 year!"

3. **Special events**
   - "Double points weekend!"
   - "New game available!"

4. **Weather-based**
   - Rainy: "Cozy up with a hot coffee!"
   - Sunny: "Perfect day for iced coffee!"

---

## 📖 SUMMARY

The notification banner is **smart** and **dynamic**:
- Shows the most relevant message
- Encourages user engagement
- Celebrates achievements
- Guides next actions

**It's the main communication tool on the dashboard!**
