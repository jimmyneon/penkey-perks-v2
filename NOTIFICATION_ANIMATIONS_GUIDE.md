# 🎬 NOTIFICATION ANIMATIONS - IMPLEMENTATION GUIDE

**Features:**
- Slide in from left
- Slide out to right
- Rotate through multiple notifications every 15 seconds
- 30-minute dismiss timeout

---

## 🎯 WHAT'S NEEDED

### 1. Install Framer Motion
```bash
npm install framer-motion
```

### 2. Update API to Return Multiple Notifications

**File:** `app/api/notifications/get-for-user/route.ts`

**Change from:**
```typescript
// Return the notification (or null if none match)
return NextResponse.json(data?.[0] || null)
```

**Change to:**
```typescript
// Return ALL matching notifications (for rotation)
return NextResponse.json(data || [])
```

### 3. Add Animation Wrapper

**In:** `components/dashboard/notification-banner.tsx`

**Add imports:**
```typescript
import { motion, AnimatePresence } from 'framer-motion'
```

**Wrap the Card component:**
```typescript
return (
  <AnimatePresence mode="wait">
    <motion.div
      key={currentNotification?.id}
      initial={{ x: -100, opacity: 0 }}  // Start off-screen left
      animate={{ x: 0, opacity: 1 }}      // Slide in
      exit={{ x: 100, opacity: 0 }}       // Slide out right
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="...">
        {/* Existing notification content */}
      </Card>
    </motion.div>
  </AnimatePresence>
)
```

### 4. Add Rotation Logic

**Add state:**
```typescript
const [allNotifications, setAllNotifications] = useState<any[]>([])
const [currentIndex, setCurrentIndex] = useState(0)
```

**Add rotation effect:**
```typescript
useEffect(() => {
  if (allNotifications.length <= 1) return

  const interval = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % allNotifications.length)
  }, 15000) // Rotate every 15 seconds

  return () => clearInterval(interval)
}, [allNotifications.length])
```

**Use current notification:**
```typescript
const currentNotification = allNotifications[currentIndex] || notification
```

### 5. Update Dismissal to 30-Minute Timeout

**Change dismiss handler:**
```typescript
const handleDismiss = async () => {
  // Store with 30-minute expiry
  const dismissData = {
    dismissedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  }
  localStorage.setItem(`notification-dismissed-${id}`, JSON.stringify(dismissData))
  
  // Animate out
  setIsAnimating(true)
  setTimeout(() => {
    setIsDismissed(true)
  }, 500)
}
```

**Check expiry:**
```typescript
const checkDismissed = () => {
  const dismissDataStr = localStorage.getItem(dismissKey)
  if (dismissDataStr) {
    const dismissData = JSON.parse(dismissDataStr)
    const expiresAt = new Date(dismissData.expiresAt)
    const isExpired = Date.now() > expiresAt.getTime()
    
    if (isExpired) {
      localStorage.removeItem(dismissKey)
      return false // Show again
    }
    return true // Still dismissed
  }
  return false
}
```

---

## 🎨 ANIMATION DETAILS

### Slide In (From Left):
```typescript
initial={{ x: -100, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
```
- Starts 100px to the left
- Fades in from transparent
- Smooth spring animation

### Slide Out (To Right):
```typescript
exit={{ x: 100, opacity: 0 }}
```
- Slides 100px to the right
- Fades out
- Happens on dismiss or rotation

### Timing:
- **Animation duration:** 500ms
- **Rotation interval:** 15 seconds
- **Dismiss timeout:** 30 minutes

---

## 🔄 ROTATION BEHAVIOR

### Multiple Notifications:
If user matches 3 notifications:
1. Show notification #1 for 15 seconds
2. Slide out right, slide in #2 from left
3. Show notification #2 for 15 seconds
4. Slide out right, slide in #3 from left
5. Show notification #3 for 15 seconds
6. Loop back to #1

### Single Notification:
- No rotation
- Just shows static
- Still has slide-in animation on load

### Dismissal:
- Slides out to right
- Removed from rotation
- Reappears after 30 minutes

---

## 🎯 USER EXPERIENCE

### Scenario 1: Multiple Matching Notifications
**User:** Has rewards + hasn't checked in + one stamp away

**Experience:**
1. **0-15s:** "🎁 Rewards Ready!" (slides in from left)
2. **15-30s:** Slides out right, "☀️ Good Morning!" slides in from left
3. **30-45s:** Slides out right, "☕ One More Stamp!" slides in from left
4. **45-60s:** Loops back to rewards

**Result:** User sees all relevant messages, stays engaged

### Scenario 2: Dismiss Notification
**User:** Clicks X on "Good Morning"

**Experience:**
1. Notification slides out to right (500ms)
2. Disappears
3. Next notification slides in from left
4. Dismissed notification won't show for 30 minutes
5. After 30 minutes, it can appear again

**Result:** Not annoying, but reminder comes back

### Scenario 3: Single Notification
**User:** Only matches one notification

**Experience:**
1. Notification slides in from left on page load
2. Stays static (no rotation)
3. Can dismiss for 30 minutes

**Result:** Clean, simple

---

## 📊 BENEFITS

### Engagement:
- ✅ Movement catches attention
- ✅ Multiple messages seen
- ✅ Feels dynamic and alive
- ✅ Not overwhelming (15s intervals)

### User Control:
- ✅ Can dismiss anytime
- ✅ Comes back after 30 min (not forgotten)
- ✅ Smooth animations (not jarring)
- ✅ Professional feel

### Business:
- ✅ More messages delivered
- ✅ Higher action rate
- ✅ Better engagement
- ✅ Modern UX

---

## 🔧 CUSTOMIZATION

### Change Rotation Speed:
```typescript
// From 15 seconds to 10 seconds
setInterval(() => {
  // ...
}, 10000) // Changed from 15000
```

### Change Animation Style:
```typescript
// Fade only (no slide)
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}

// Slide from top
initial={{ y: -100, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
exit={{ y: -100, opacity: 0 }}

// Scale + fade
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.8, opacity: 0 }}
```

### Change Dismiss Timeout:
```typescript
// From 30 minutes to 1 hour
new Date(Date.now() + 60 * 60 * 1000) // 60 minutes

// From 30 minutes to 10 minutes
new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
```

---

## 🧪 TESTING

### Test Rotation:
1. Create user that matches 3+ notifications
2. Watch dashboard
3. Should see notifications rotate every 15 seconds
4. Should slide out right, new one slides in from left

### Test Dismissal:
1. Click X on notification
2. Should slide out to right
3. Next notification should slide in from left
4. Wait 30 minutes (or change timeout to 1 minute for testing)
5. Refresh page
6. Dismissed notification should reappear

### Test Single Notification:
1. Create user that matches only 1 notification
2. Should slide in on load
3. Should stay static (no rotation)
4. Can still dismiss

---

## ⚡ PERFORMANCE

### Optimizations:
- Uses CSS transforms (GPU accelerated)
- Framer Motion optimized for React
- Only animates when changing
- No performance impact

### Bundle Size:
- Framer Motion: ~30KB gzipped
- Worth it for smooth animations
- Industry standard

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Install framer-motion
- [ ] Update API to return array
- [ ] Add AnimatePresence wrapper
- [ ] Add motion.div with animations
- [ ] Add rotation state & effect
- [ ] Update dismissal to 30-min timeout
- [ ] Test rotation with multiple notifications
- [ ] Test dismissal timeout
- [ ] Test single notification
- [ ] Deploy

---

## 🎉 RESULT

### Before:
- Static notification
- One message at a time
- Dismissed forever (or 24 hours)
- Boring

### After:
- ✅ Slides in smoothly from left
- ✅ Rotates through multiple messages
- ✅ Slides out to right on change
- ✅ Dismisses for 30 minutes (not forever)
- ✅ Professional, modern feel
- ✅ Higher engagement

---

**Total implementation time: 30 minutes**  
**Impact: Significantly better UX** 🎬
