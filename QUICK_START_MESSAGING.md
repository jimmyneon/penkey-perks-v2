# ⚡ QUICK START: Server-Driven Messaging
**Get started in 1 day - eliminate hardcoded messages**

---

## 🎯 GOAL

Remove all hardcoded messages from `notification-banner.tsx` and make everything database-driven.

**Before:** 285 lines of hardcoded fallback logic  
**After:** 100% server-driven, admin-controlled messages

---

## 📋 STEP 1: Create Migration SQL (30 mins)

Create file: `supabase/migrations/20251011_migrate_hardcoded_notifications.sql`

```sql
-- =============================================
-- MIGRATE HARDCODED NOTIFICATIONS TO DATABASE
-- =============================================

-- Delete existing default notifications (we'll recreate them properly)
DELETE FROM public.notifications WHERE created_at < NOW();

-- =============================================
-- PRIORITY 1: REWARD EXPIRY NOTIFICATIONS
-- =============================================

-- Critical: < 3 hours left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 1, '🚨 LAST CHANCE!', 'Only {{hoursUntilExpiry}} hours left! Your free coffee expires VERY soon! Rush in NOW! 🏃‍♀️💨', '🎁', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"max": 3}}', 'streak', false);

-- Urgent: 4-12 hours
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 2, '⚠️ EXPIRING TODAY!', 'Your free coffee expires in {{hoursUntilExpiry}} hours! Come redeem it today or lose it! 🏃‍♀️', '🎁', 
 '{"hasUnredeemedRewards": true, "hoursUntilExpiry": {"min": 4, "max": 12}}', 'streak', false);

-- Urgent: 13-24 hours (today)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 3, '⏰ Expires Today!', 'Your free coffee expires tonight! Pop in today before it''s too late! ☕', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 0, "hoursUntilExpiry": {"min": 13}}', 'streak', false);

-- Tomorrow expiry
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 4, '⏰ Expires Tomorrow!', 'Your free coffee expires tomorrow! Don''t forget to redeem it! 💨', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 1}', 'reward', false);

-- 2 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 5, '⏳ 2 Days Left!', 'Your free coffee expires in 2 days! Make sure to pop in soon! ☕✨', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 2}', 'reward', true);

-- 3 days left
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 6, '⏳ 3 Days Left', 'Your free coffee expires in 3 days. Don''t miss out! Come visit us! ☕', '🎁', 
 '{"hasUnredeemedRewards": true, "daysUntilExpiry": 3}', 'reward', true);

-- General reward ready
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('reward', 7, '🎁 Yaaas! Rewards Ready!', 'You''ve got treats waiting! Pop in and redeem them! 💕', '🎁', 
 '{"hasUnredeemedRewards": true}', 'reward', true);

-- =============================================
-- PRIORITY 2: STREAK AT RISK
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('streak', 8, '🔥 {{currentStreak}} Day Streak at Risk!', 'Don''t lose your streak! Pop in today to keep it alive! 💪', '🔥', 
 '{"currentStreak": {"min": 7}, "hasCheckedInToday": false}', 'streak', false);

-- =============================================
-- PRIORITY 3: COFFEE STAMPS
-- =============================================

-- ONE MORE STAMP!
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 9, '🎊 ONE MORE STAMP!!!', 'Eeeek! Just ONE more for FREE COFFEE! You HAVE to come in today! 💕', '☕', 
 '{"stampsUntilReward": 1, "hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'reward', false);

-- 2 stamps away
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 10, '🔥 SO CLOSE!', 'Only 2 stamps away from free coffee! Come get yours today! ✨', '☕', 
 '{"stampsUntilReward": 2, "hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true);

-- 3 stamps away
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 11, '💫 Almost There!', 'Just 3 more stamps! Your free coffee is waiting! 🎉', '☕', 
 '{"stampsUntilReward": 3, "hasCoffeeStampToday": false, "hasCheckedInToday": true}', 'default', true);

-- =============================================
-- PRIORITY 4: CHECK-IN REMINDERS (Time-based)
-- =============================================

-- Morning (5am-10am)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 12, '☀️ Good Morning!', 'Start your day with us! Pop in for your check-in and earn 5 points! ✨', '☀️', 
 '{"hasCheckedInToday": false, "timeOfDay": "morning"}', 'default', true);

-- Midday (10am-2pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 13, '☕ Lunchtime Visit?', 'Perfect time for a coffee break! Check in and earn points! 🎉', '☕', 
 '{"hasCheckedInToday": false, "timeOfDay": "midday"}', 'default', true);

-- Afternoon (2pm-5pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 14, '🌤️ Afternoon Pick-Me-Up?', 'Beat the afternoon slump! Check in and grab a coffee! ✨', '☕', 
 '{"hasCheckedInToday": false, "timeOfDay": "afternoon"}', 'default', true);

-- Evening (5pm-9pm)
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('checkin', 15, '🌙 Evening Visit?', 'Quick! Check in before we close! Don''t miss out on points! ⏰', '🌙', 
 '{"hasCheckedInToday": false, "timeOfDay": "evening"}', 'default', true);

-- =============================================
-- PRIORITY 5: COFFEE STAMP REMINDERS (Time-based)
-- =============================================

-- Morning coffee
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 16, '☕ Morning Coffee Stamp?', 'Grab your morning brew and collect your stamp! ✨', '☕', 
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "morning"}', 'default', true);

-- Afternoon coffee
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 17, '☕ Afternoon Coffee Run?', 'Time for a coffee break! Don''t forget your stamp! 🎉', '☕', 
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "afternoon"}', 'default', true);

-- Evening coffee
INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('stamp', 18, '☕ Last Call for Stamps!', 'Get your coffee stamp before we close! ⏰', '☕', 
 '{"hasCoffeeStampToday": false, "hasCheckedInToday": true, "timeOfDay": "evening"}', 'default', true);

-- =============================================
-- PRIORITY 6: GAME REMINDERS
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('game', 19, '🎮 Daily Game Ready!', 'Play now for a chance to win points, stamps, or prizes! 🎉', '🎮', 
 '{"hasPlayedGameToday": false}', 'default', true);

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('game', 20, '🎲 Feeling Lucky?', 'Try today''s game! You might win something amazing! ✨', '🎲', 
 '{"hasPlayedGameToday": false}', 'default', true);

-- =============================================
-- PRIORITY 7: ALL DONE (Success)
-- =============================================

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 21, '🌟 You''re Amazing!', 'All done for today! You''re crushing it! See you tomorrow! 💕', '🌟', 
 '{"allComplete": true}', 'success', true);

INSERT INTO public.notifications (type, priority, title, message, icon, conditions, variant, dismissible) VALUES
('custom', 22, '✅ All Caught Up!', 'You''ve done everything! Take a break, you earned it! ✨', '✅', 
 '{"allComplete": true}', 'success', true);

-- Success message
SELECT 'Hardcoded notifications migrated successfully!' as message;
```

---

## 📋 STEP 2: Enhance Conditions Matching (1 hour)

Update: `app/api/notifications/get-for-user/route.ts`

Add better condition matching logic:

```typescript
// Add this helper function at the top
function matchesConditions(notification: any, userState: any): boolean {
  const conditions = notification.conditions || {}
  
  for (const [key, value] of Object.entries(conditions)) {
    const stateValue = userState[key]
    
    // Direct equality check
    if (typeof value !== 'object') {
      if (stateValue !== value) return false
      continue
    }
    
    // Numeric comparisons
    if ('min' in value && stateValue < value.min) return false
    if ('max' in value && stateValue > value.max) return false
    if ('equals' in value && stateValue !== value.equals) return false
    if ('lte' in value && stateValue > value.lte) return false
    if ('gte' in value && stateValue < value.gte) return false
  }
  
  return true
}

// Update the POST function to use client-side filtering
export async function POST(request: Request) {
  try {
    const { userId, userState } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get ALL active notifications (we'll filter client-side)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Filter by conditions
    const matchingNotifications = (data || []).filter(notification =>
      matchesConditions(notification, userState)
    )

    // Filter to prevent duplicate types
    const filteredNotifications = filterDuplicateTypes(matchingNotifications)
    
    // Return top 3 for rotation
    const topNotifications = filteredNotifications.slice(0, 3)
    return NextResponse.json(topNotifications)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 📋 STEP 3: Update Notification Banner (30 mins)

Update: `components/dashboard/notification-banner.tsx`

**DELETE lines 288-573** (the entire `getNotification()` function)

Replace with minimal fallback:

```typescript
// Remove the entire getNotification() function
// Replace lines 584-596 with:

const notification = (!loading && allNotifications.length > 0) 
  ? allNotifications[currentIndex] 
  : null

// Don't show if no notification from database
if (!notification) {
  return null
}
```

---

## 📋 STEP 4: Add Variable Substitution (30 mins)

Update: `components/dashboard/notification-banner.tsx`

Add this function before the return statement:

```typescript
// Add variable substitution
function substituteVariables(text: string, userState: any): string {
  let result = text
  
  // Replace {{variable}} with actual values
  const variables = {
    currentStreak: userState.currentStreak || 0,
    hoursUntilExpiry: userState.hoursUntilExpiry || 0,
    daysUntilExpiry: userState.daysUntilExpiry || 0,
    stampsUntilReward: userState.stampsUntilReward || 10,
    currentPoints: userState.currentPoints || 0,
    lifetimePoints: userState.lifetimePoints || 0,
  }
  
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }
  
  return result
}

// Use it when rendering:
const displayTitle = substituteVariables(currentNotification.title, userState)
const displayMessage = substituteVariables(currentNotification.message, userState)

// Then in JSX:
<h3 className="font-bold text-penkey-dark text-lg leading-tight">{displayTitle}</h3>
<p className="text-base text-penkey-gray leading-relaxed pr-8">{displayMessage}</p>
```

---

## 📋 STEP 5: Calculate Time of Day (15 mins)

Update: `components/dashboard/notification-banner.tsx`

In the `fetchNotification` function, enhance the `userState`:

```typescript
// Calculate time of day
const hour = new Date().getHours()
let timeOfDay = 'night'
if (hour >= 5 && hour < 10) timeOfDay = 'morning'
else if (hour >= 10 && hour < 14) timeOfDay = 'midday'
else if (hour >= 14 && hour < 17) timeOfDay = 'afternoon'
else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
else timeOfDay = 'night'

const userState = {
  hasUnredeemedRewards,
  currentStreak,
  hasCheckedInToday,
  hasCoffeeStampToday,
  hasPlayedGameToday,
  stampsUntilReward,
  rewardExpiryDate,
  currentPoints,
  lifetimePoints,
  timeOfDay, // ← Add this
  hoursUntilExpiry: rewardExpiryDate 
    ? Math.floor((new Date(rewardExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60))
    : null,
  daysUntilExpiry: rewardExpiryDate
    ? Math.floor((new Date(rewardExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null,
  allComplete: hasCheckedInToday && hasCoffeeStampToday && hasPlayedGameToday
}
```

---

## 📋 STEP 6: Run Migration (5 mins)

```bash
# Apply the migration
cd /Users/johnhopwood/penkeygameapp
supabase db push

# Or if using Supabase CLI:
supabase migration up
```

---

## 📋 STEP 7: Test (30 mins)

1. **Clear cache:**
   ```javascript
   // In browser console
   sessionStorage.clear()
   localStorage.clear()
   ```

2. **Test different scenarios:**
   - User with unredeemed reward expiring soon
   - User with high streak who hasn't checked in
   - User who needs one more stamp
   - User who hasn't checked in (morning vs afternoon)
   - User who completed everything

3. **Verify database notifications show:**
   - Check browser console for "Database notifications fetched"
   - Should see NO fallback messages
   - All messages should come from database

4. **Test admin UI:**
   - Go to `/admin/notifications`
   - Edit a notification
   - Change the message
   - Verify it updates immediately (after cache expires)

---

## ✅ VERIFICATION CHECKLIST

- [ ] Migration SQL runs without errors
- [ ] All hardcoded messages deleted from code
- [ ] Notifications show from database
- [ ] Variable substitution works ({{currentStreak}} shows actual number)
- [ ] Time-based messages show correctly (morning vs afternoon)
- [ ] Expiry urgency works (3 hours vs 3 days)
- [ ] Admin can edit messages without code changes
- [ ] Cache expires correctly (5 minutes)
- [ ] No console errors
- [ ] Fallback only triggers on actual errors

---

## 🎯 WHAT YOU ACHIEVED

**Before:**
- ❌ 285 lines of hardcoded messages
- ❌ Cannot update without deployment
- ❌ No analytics on message performance
- ❌ Inconsistent behavior

**After:**
- ✅ 100% database-driven
- ✅ Update messages via admin UI
- ✅ Full analytics tracking
- ✅ Consistent, predictable behavior
- ✅ A/B testing ready
- ✅ Variable substitution
- ✅ Time-based messaging

---

## 🚀 NEXT STEPS

1. **Monitor for 24 hours** - Ensure no errors
2. **Gather feedback** - Are messages showing correctly?
3. **Optimize conditions** - Fine-tune based on user behavior
4. **Move to Phase 2** - Email templates to database
5. **Plan Phase 3** - Push notifications

---

## 📚 RELATED DOCS

- `MESSAGING_SYSTEM_AUDIT.md` - Full system analysis
- `UNIFIED_MESSAGING_PLAN.md` - Complete roadmap
- `/admin/notifications` - Manage notifications

---

**Questions? Issues? Check the audit document or admin UI.**
