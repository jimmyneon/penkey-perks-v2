# 🚀 Notification System Improvement Plan

**Date:** October 14, 2025  
**Goal:** Make the rotating messages system work better with fresh, relevant content

---

## 🎯 Quick Wins (Do These First - 1 Hour Total)

### 1. Fix Dismissal Timeout (5 minutes) ⭐⭐⭐

**Problem:** Dismissed notifications come back after 24 hours  
**Impact:** HIGH - Users get annoyed seeing same messages  
**Difficulty:** EASY - One line change

**Solution A: Configurable Per-Notification**
```sql
-- Add column to notifications table
ALTER TABLE notifications 
ADD COLUMN dismissal_duration INTERVAL DEFAULT INTERVAL '7 days';

-- Update the function
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id UUID,
  p_user_state JSONB
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  WHERE n.active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id
      AND nd.notification_id = n.id
      AND nd.dismissed_at > NOW() - COALESCE(n.dismissal_duration, INTERVAL '7 days')
    )
    ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Solution B: Simple 7-Day Default**
```sql
-- Just change the interval in the existing function
-- File: /supabase/migrations/20251010_notifications_system.sql line 161
AND nd.dismissed_at > NOW() - INTERVAL '7 days'  -- Changed from '1 day'
```

**Recommendation:** Use Solution A for flexibility

---

### 2. Reduce Cache Duration (2 minutes) ⭐⭐⭐

**Problem:** 5-minute cache = stale messages  
**Impact:** MEDIUM - Users see old content  
**Difficulty:** EASY - Change one number

**File:** `/components/dashboard/notification-banner.tsx` line 87

**Change:**
```typescript
// FROM:
if (age < 5 * 60 * 1000) { // 5 minutes

// TO:
if (age < 2 * 60 * 1000) { // 2 minutes
```

**Also change line 203:**
```typescript
// FROM:
const cacheKey = `notifications-${userId}-${hasCheckedInToday}-${hasUnredeemedRewards}`

// TO: Add timestamp to force refresh
const cacheKey = `notifications-${userId}-${Math.floor(Date.now() / (2 * 60 * 1000))}`
```

---

### 3. Add Variety to Rotation (10 minutes) ⭐⭐

**Problem:** Only 1-5 notifications rotate  
**Impact:** MEDIUM - Gets boring  
**Difficulty:** EASY - Change one number

**File:** `/app/api/notifications/get-for-user/route.ts` line 131

**Change:**
```typescript
// FROM:
const topNotifications = filteredNotifications.slice(0, 5)

// TO:
const topNotifications = filteredNotifications.slice(0, 10)  // More variety
```

**Better: Randomize the selection**
```typescript
// Shuffle and take random 5-10
const shuffled = filteredNotifications
  .sort(() => Math.random() - 0.5)
  .slice(0, Math.min(10, filteredNotifications.length))

return NextResponse.json(shuffled)
```

---

### 4. Speed Up Rotation (2 minutes) ⭐

**Problem:** 10 seconds between rotations is slow  
**Impact:** LOW - But easy fix  
**Difficulty:** EASY

**File:** `/components/dashboard/notification-banner.tsx` line 126

**Change:**
```typescript
// FROM:
}, 10000) // Rotate every 10 seconds

// TO:
}, 6000) // Rotate every 6 seconds (faster, more engaging)
```

---

## 🔧 Medium Improvements (2-3 Hours Total)

### 5. Connect Dynamic Message System (1 hour) ⭐⭐⭐

**Problem:** `message_templates` table exists but not used  
**Impact:** HIGH - Would give fresh rotating messages  
**Difficulty:** MEDIUM - Need to update components

**Implementation:**

#### A. Coffee Stamp Card
**File:** `/app/dashboard/new-dashboard-client.tsx`

**Add at top:**
```typescript
import { useDynamicMessage } from '@/hooks/use-dynamic-message'
```

**Add in component:**
```typescript
// Get dynamic coffee message
const { message: coffeeMessage, loading: coffeeLoading } = useDynamicMessage({
  category: 'coffee',
  context: isAtPenkey ? 'at_penkey' : isNear ? 'nearby' : 'default',
  refreshInterval: 2 * 60 * 1000 // 2 minutes
})
```

**Use in JSX:**
```typescript
<CardDescription>
  {coffeeMessage || getCoffeeMessage(stats.stamps, isNear, isAtPenkey)}
</CardDescription>
```

#### B. Referral Card
```typescript
const { message: referralMessage } = useDynamicMessage({
  category: 'referral',
  context: 'default'
})
```

#### C. Points Card
```typescript
const { message: pointsMessage } = useDynamicMessage({
  category: 'points',
  context: 'default'
})
```

#### D. Game Card
```typescript
const { message: gameMessage } = useDynamicMessage({
  category: 'games',
  context: 'default'
})
```

**Benefits:**
- ✅ Fresh messages every 2 minutes
- ✅ Random selection from pool
- ✅ Easy to add new messages via database
- ✅ Fallback to hardcoded if database fails

---

### 6. Add Weather-Based Messages (30 minutes) ⭐⭐

**Problem:** No weather-aware messages  
**Impact:** MEDIUM - Would be cool and contextual  
**Difficulty:** EASY - Just SQL inserts

**Add to database:**
```sql
-- Weather-based coffee messages
INSERT INTO message_templates (category, context, message, emoji, weight, conditions) VALUES
('coffee', 'rainy', '🌧️ Rainy day? Perfect for a cozy coffee at Penkey! ☕', '☕', 3, '{"weather": "rain"}'),
('coffee', 'rainy', '☔ Wet outside? Warm up with Coffee Mongers magic! 💕', '☕', 3, '{"weather": "rain"}'),
('coffee', 'cold', '❄️ Brrr! Warm up with our fresh coffee! Come in love! ☕', '☕', 3, '{"temperature": {"max": 10}}'),
('coffee', 'cold', '🧊 Cold day calls for hot coffee! We''re ready for you! ✨', '☕', 3, '{"temperature": {"max": 10}}'),
('coffee', 'sunny', '☀️ Gorgeous day! Grab a coffee and enjoy the sunshine! 🌞', '☕', 3, '{"weather": "clear"}'),
('coffee', 'sunny', '🌤️ Beautiful weather! Perfect for coffee on New Street! 💫', '☕', 3, '{"weather": "clear"}'),
('coffee', 'hot', '🌡️ Hot day? Try our iced coffee! Refreshing! 🧊☕', '☕', 3, '{"temperature": {"min": 25}}');

-- Weather-based general messages
INSERT INTO message_templates (category, context, message, emoji, weight, conditions) VALUES
('points', 'rainy', '🌧️ Rainy day points! Pop in and earn while staying dry! 💕', '🌟', 2, '{"weather": "rain"}'),
('games', 'rainy', '☔ Rainy day game time! Play and win! 🎮', '🎮', 2, '{"weather": "rain"}');
```

**Then update the hook to pass weather:**
```typescript
const { message: coffeeMessage } = useDynamicMessage({
  category: 'coffee',
  context: weather?.weather === 'rain' ? 'rainy' 
         : weather?.temperature < 10 ? 'cold'
         : weather?.temperature > 25 ? 'hot'
         : weather?.weather === 'clear' ? 'sunny'
         : 'default',
  refreshInterval: 2 * 60 * 1000
})
```

---

### 7. Add Time-Based Messages (30 minutes) ⭐⭐

**Problem:** Same messages morning and evening  
**Impact:** MEDIUM - More contextual  
**Difficulty:** EASY - SQL inserts

```sql
-- Morning messages (5am-12pm)
INSERT INTO message_templates (category, context, message, emoji, weight, conditions) VALUES
('coffee', 'morning', '☀️ Good morning! Start your day with Coffee Mongers! 💕', '☕', 3, '{"timeOfDay": "morning"}'),
('coffee', 'morning', '🌅 Morning love! Fresh coffee brewing just for you! ✨', '☕', 3, '{"timeOfDay": "morning"}'),
('coffee', 'morning', '🥐 Breakfast time! Coffee + fresh pastries = perfect! 🎉', '☕', 3, '{"timeOfDay": "morning"}');

-- Afternoon messages (12pm-5pm)
INSERT INTO message_templates (category, context, message, emoji, weight, conditions) VALUES
('coffee', 'afternoon', '☕ Afternoon pick-me-up? We got you! Come in! 💫', '☕', 3, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', '🌤️ Lunch break coffee? Perfect timing! See you soon! ✨', '☕', 3, '{"timeOfDay": "afternoon"}'),
('coffee', 'afternoon', '⏰ 3pm slump? Coffee to the rescue! Pop in! 🎉', '☕', 3, '{"timeOfDay": "afternoon"}');

-- Evening messages (5pm-9pm) - if open late
INSERT INTO message_templates (category, context, message, emoji, weight, conditions) VALUES
('coffee', 'evening', '🌆 Evening coffee? We''re still here! Come say hi! 💕', '☕', 2, '{"timeOfDay": "evening"}'),
('coffee', 'evening', '✨ End your day with us! Coffee and good vibes! 🌟', '☕', 2, '{"timeOfDay": "evening"}');
```

---

### 8. Smart Notification Prioritization (1 hour) ⭐⭐⭐

**Problem:** All notifications have fixed priority  
**Impact:** HIGH - Show most relevant first  
**Difficulty:** MEDIUM

**Add dynamic priority adjustment:**

**File:** `/app/api/notifications/get-for-user/route.ts`

**Add after line 102:**
```typescript
// Adjust priority based on urgency
const prioritizedNotifications = matchingNotifications.map(notification => {
  let adjustedPriority = notification.priority
  
  // Boost priority for urgent items
  if (notification.type === 'reward' && userState.hasUnredeemedRewards) {
    adjustedPriority -= 2 // Higher priority
  }
  
  if (notification.type === 'stamp' && userState.stampsUntilReward === 1) {
    adjustedPriority -= 3 // Very high priority
  }
  
  if (notification.type === 'streak' && userState.currentStreak >= 7 && !userState.hasCheckedInToday) {
    adjustedPriority -= 2 // Don't lose streak!
  }
  
  // Reduce priority for less urgent
  if (notification.type === 'game' && userState.hasPlayedGameToday) {
    adjustedPriority += 5 // Already played
  }
  
  return {
    ...notification,
    originalPriority: notification.priority,
    adjustedPriority
  }
})

// Sort by adjusted priority
const sortedNotifications = prioritizedNotifications.sort(
  (a, b) => a.adjustedPriority - b.adjustedPriority
)
```

---

## 🎨 Advanced Improvements (4-6 Hours Total)

### 9. A/B Testing System (2 hours) ⭐⭐

**Problem:** Don't know which messages work best  
**Impact:** MEDIUM - Data-driven optimization  
**Difficulty:** MEDIUM

**Add variant testing:**

```sql
-- Add variant column to message_templates
ALTER TABLE message_templates 
ADD COLUMN variant TEXT DEFAULT 'A',
ADD COLUMN test_group TEXT; -- 'control', 'test_a', 'test_b'

-- Create A/B test tracking
CREATE TABLE message_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES message_templates(id),
  variant TEXT,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which variant user sees
CREATE TABLE user_test_assignments (
  user_id UUID REFERENCES auth.users(id),
  test_group TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id)
);
```

**Usage:**
```sql
-- Create two versions of same message
INSERT INTO message_templates (category, context, message, variant, test_group) VALUES
('coffee', 'default', 'Come get your coffee! ☕', 'A', 'control'),
('coffee', 'default', 'Your coffee is waiting! Pop in! ☕💕', 'B', 'test_a');

-- Analyze results
SELECT 
  variant,
  SUM(views) as total_views,
  SUM(clicks) as total_clicks,
  ROUND(SUM(clicks)::numeric / NULLIF(SUM(views), 0) * 100, 2) as ctr
FROM message_ab_tests
GROUP BY variant;
```

---

### 10. Personalized Messages (3 hours) ⭐⭐⭐

**Problem:** Same messages for everyone  
**Impact:** HIGH - More engaging  
**Difficulty:** HARD

**Add user segmentation:**

```sql
-- Add user segments
ALTER TABLE users 
ADD COLUMN segment TEXT DEFAULT 'regular',
ADD COLUMN favorite_product TEXT,
ADD COLUMN preferred_time TEXT; -- 'morning', 'afternoon', 'evening'

-- Segment-specific messages
INSERT INTO message_templates (category, context, message, conditions) VALUES
('coffee', 'vip', '💎 VIP! Your usual is ready! Thanks for being amazing! 🌟', 
 '{"segment": "vip", "lifetimePoints": {"min": 1000}}'),
 
('coffee', 'new', '👋 Welcome! First coffee stamp is the start of something great! 💕',
 '{"segment": "new", "lifetimePoints": {"max": 50}}'),
 
('coffee', 'regular', '☕ Hey friend! Your regular spot is waiting! ✨',
 '{"segment": "regular", "currentStreak": {"min": 3}}');
```

**Calculate segments automatically:**
```sql
-- Function to update user segments
CREATE OR REPLACE FUNCTION update_user_segment()
RETURNS TRIGGER AS $$
BEGIN
  -- VIP: 1000+ lifetime points
  IF NEW.lifetime_points >= 1000 THEN
    NEW.segment := 'vip';
  -- Regular: 100+ points, 3+ visits
  ELSIF NEW.lifetime_points >= 100 THEN
    NEW.segment := 'regular';
  -- New: < 50 points
  ELSE
    NEW.segment := 'new';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on points update
CREATE TRIGGER update_segment_on_points
  BEFORE UPDATE OF lifetime_points ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_segment();
```

---

### 11. Location-Based Messages (2 hours) ⭐⭐

**Problem:** Not using location data effectively  
**Impact:** MEDIUM - Very contextual  
**Difficulty:** MEDIUM

**Enhance location awareness:**

```sql
-- Add location-specific messages
INSERT INTO message_templates (category, context, message, emoji, weight) VALUES
-- Very close (< 50m)
('coffee', 'very_close', '👀 We can see you! Come in and say hi! 💕', '☕', 5),
('coffee', 'very_close', '🎉 You''re RIGHT HERE! Pop in for your stamp! ✨', '☕', 5),

-- Nearby (50-200m)
('coffee', 'nearby', '📍 Just around the corner! 2 minute walk! ☕', '☕', 3),
('coffee', 'nearby', '🚶 So close! Come grab your coffee! 💫', '☕', 3),

-- In area (200-500m)
('coffee', 'in_area', '🗺️ You''re in Lymington! Pop by New Street! ☕', '☕', 2),

-- At location
('coffee', 'at_penkey', '🎊 YOU''RE HERE! Show us your QR code! 💕', '☕', 5),
('coffee', 'at_penkey', '✨ Welcome! Let''s get you that stamp! 🌟', '☕', 5);
```

**Update hook to use precise location:**
```typescript
const getLocationContext = (distance: number) => {
  if (distance < 50) return 'very_close'
  if (distance < 200) return 'nearby'
  if (distance < 500) return 'in_area'
  return 'default'
}

const { message } = useDynamicMessage({
  category: 'coffee',
  context: isAtPenkey ? 'at_penkey' : getLocationContext(distanceInMeters)
})
```

---

### 12. Smart Timing (1 hour) ⭐⭐

**Problem:** Messages shown at wrong times  
**Impact:** MEDIUM - Better engagement  
**Difficulty:** MEDIUM

**Add time-based logic:**

```typescript
// File: /app/api/notifications/get-for-user/route.ts

// Filter out closed-time notifications
const currentHour = new Date().getHours()
const isClosed = currentHour < 7 || currentHour >= 17 // Closed before 7am and after 5pm

const timeFilteredNotifications = matchingNotifications.filter(notification => {
  // Don't show "come in" messages when closed
  if (isClosed && notification.type === 'checkin') return false
  if (isClosed && notification.type === 'stamp') return false
  
  // Only show game notifications during open hours
  if (isClosed && notification.type === 'game') return false
  
  return true
})
```

**Add "we're closed" messages:**
```sql
INSERT INTO message_templates (category, context, message, conditions) VALUES
('coffee', 'closed', '😴 We''re closed now but see you tomorrow! Sleep well! 💕',
 '{"timeOfDay": "night"}'),
('coffee', 'closed', '🌙 Closed for today! Open tomorrow at 7am! See you then! ✨',
 '{"timeOfDay": "night"}');
```

---

## 📊 Analytics Improvements (2 Hours)

### 13. Message Performance Dashboard (2 hours) ⭐⭐

**Create admin view to see what's working:**

```sql
-- Create performance view
CREATE OR REPLACE VIEW notification_performance AS
SELECT 
  n.id,
  n.title,
  n.type,
  n.priority,
  COUNT(DISTINCT nv.user_id) as unique_views,
  COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'click') as clicks,
  COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'dismiss') as dismissals,
  ROUND(
    COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'click')::numeric / 
    NULLIF(COUNT(DISTINCT nv.user_id), 0) * 100, 
    2
  ) as click_through_rate,
  ROUND(
    COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'dismiss')::numeric / 
    NULLIF(COUNT(DISTINCT nv.user_id), 0) * 100, 
    2
  ) as dismiss_rate,
  MAX(nv.viewed_at) as last_shown
FROM notifications n
LEFT JOIN notification_views nv ON n.id = nv.notification_id
LEFT JOIN notification_actions na ON n.id = na.notification_id
WHERE nv.viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY n.id, n.title, n.type, n.priority
ORDER BY unique_views DESC;
```

**Create admin page:**
```typescript
// File: /app/admin/notifications/analytics/page.tsx

export default async function NotificationAnalytics() {
  const { data: performance } = await supabase
    .from('notification_performance')
    .select('*')
    .order('unique_views', { ascending: false })
  
  return (
    <div>
      <h1>Notification Performance</h1>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Views</th>
            <th>Clicks</th>
            <th>CTR</th>
            <th>Dismiss Rate</th>
          </tr>
        </thead>
        <tbody>
          {performance?.map(n => (
            <tr key={n.id}>
              <td>{n.title}</td>
              <td>{n.type}</td>
              <td>{n.unique_views}</td>
              <td>{n.clicks}</td>
              <td>{n.click_through_rate}%</td>
              <td>{n.dismiss_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 🎯 Recommended Implementation Order

### Week 1: Quick Wins (4 hours)
1. ✅ Fix dismissal timeout (5 min)
2. ✅ Reduce cache duration (2 min)
3. ✅ Add rotation variety (10 min)
4. ✅ Speed up rotation (2 min)
5. ✅ Connect dynamic messages to Coffee Card (1 hour)
6. ✅ Add weather messages (30 min)
7. ✅ Add time-based messages (30 min)
8. ✅ Test everything (1 hour)

**Result:** Fresh, rotating messages with weather/time awareness

---

### Week 2: Medium Improvements (6 hours)
1. ✅ Connect all cards to dynamic messages (2 hours)
2. ✅ Smart notification prioritization (1 hour)
3. ✅ Location-based messages (2 hours)
4. ✅ Smart timing logic (1 hour)

**Result:** Contextual, relevant messages based on user state

---

### Week 3: Advanced Features (8 hours)
1. ✅ A/B testing system (2 hours)
2. ✅ Personalized messages (3 hours)
3. ✅ Analytics dashboard (2 hours)
4. ✅ Optimization based on data (1 hour)

**Result:** Data-driven, personalized experience

---

## 📈 Expected Impact

### Before Improvements:
- ❌ Same message all day
- ❌ Dismissed messages come back daily
- ❌ 5-minute stale cache
- ❌ Generic messages for everyone
- ❌ No weather/time awareness
- ❌ No performance data

### After Week 1:
- ✅ Fresh message every 2 minutes
- ✅ Dismissals last 7 days
- ✅ 2-minute fresh cache
- ✅ Weather-aware messages
- ✅ Time-aware messages
- ✅ 10 rotating notifications

### After Week 2:
- ✅ Location-aware messages
- ✅ Smart prioritization
- ✅ Contextual relevance
- ✅ Better engagement

### After Week 3:
- ✅ Personalized content
- ✅ A/B tested messages
- ✅ Data-driven optimization
- ✅ 2x engagement rate (estimated)

---

## 🔧 Code Changes Summary

### Files to Modify:
1. `/supabase/migrations/` - New migration for dismissal timeout
2. `/components/dashboard/notification-banner.tsx` - Cache duration
3. `/app/api/notifications/get-for-user/route.ts` - Rotation variety
4. `/app/dashboard/new-dashboard-client.tsx` - Connect dynamic messages
5. Database - Add weather/time messages

### New Files to Create:
1. `/supabase/migrations/20251014_improve_dismissals.sql`
2. `/supabase/migrations/20251014_add_weather_messages.sql`
3. `/supabase/migrations/20251014_add_time_messages.sql`
4. `/app/admin/notifications/analytics/page.tsx` (optional)

---

## 🎉 Quick Start: Do This Now (30 Minutes)

Run these in order for immediate improvement:

```sql
-- 1. Fix dismissal timeout (7 days instead of 1)
-- Run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id UUID,
  p_user_state JSONB
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  priority INTEGER,
  title TEXT,
  message TEXT,
  icon TEXT,
  variant TEXT,
  dismissible BOOLEAN,
  show_badge BOOLEAN,
  badge_text TEXT,
  badge_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id, n.type, n.priority, n.title, n.message, n.icon,
    n.variant, n.dismissible, n.show_badge, n.badge_text, n.badge_color
  FROM public.notifications n
  WHERE n.active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_dismissals nd
      WHERE nd.user_id = p_user_id
      AND nd.notification_id = n.id
      AND nd.dismissed_at > NOW() - INTERVAL '7 days'  -- Changed from 1 day
    )
    AND (n.start_date IS NULL OR n.start_date <= NOW())
    AND (n.end_date IS NULL OR n.end_date >= NOW())
    AND (n.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(n.days_of_week))
    AND (n.time_of_day_start IS NULL OR CURRENT_TIME >= n.time_of_day_start)
    AND (n.time_of_day_end IS NULL OR CURRENT_TIME <= n.time_of_day_end)
  ORDER BY n.priority ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add weather messages
INSERT INTO message_templates (category, context, message, emoji, weight, active) VALUES
('coffee', 'rainy', '🌧️ Rainy day? Perfect for a cozy coffee at Penkey! ☕', '☕', 3, true),
('coffee', 'cold', '❄️ Brrr! Warm up with our Coffee Mongers brew! ☕', '☕', 3, true),
('coffee', 'sunny', '☀️ Gorgeous day! Grab a coffee and enjoy! 🌞', '☕', 3, true);

-- 3. Add time messages
INSERT INTO message_templates (category, context, message, emoji, weight, active) VALUES
('coffee', 'morning', '☀️ Good morning! Start your day with Coffee Mongers! 💕', '☕', 3, true),
('coffee', 'afternoon', '☕ Afternoon pick-me-up? We got you! Come in! 💫', '☕', 3, true);
```

Then update cache in code (see section 2 above).

**Done! You now have:**
- ✅ 7-day dismissal timeout
- ✅ Weather-aware messages
- ✅ Time-aware messages

---

**Next:** Choose which improvements to implement based on your priorities!
