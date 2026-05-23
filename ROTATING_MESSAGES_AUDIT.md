# 🔄 Rotating Messages System - Complete Audit

**Date:** October 14, 2025  
**Status:** Multiple Systems Found - Needs Consolidation

---

## 🎯 Executive Summary

You have **THREE separate messaging systems** that are NOT working together:

1. **Notification Banner System** (Active - Top of Dashboard)
2. **Dynamic Messages System** (Created but NOT implemented)
3. **Hardcoded Rotating Messages** (Old system - Still in use)

### 📊 Database Tables (8 Total)

**Notification System (Working):**
- ✅ `notifications` - Banner notifications at top of dashboard
- ✅ `notification_dismissals` - Tracks dismissals (24hr timeout)
- ✅ `notification_views` - Analytics: when shown
- ✅ `notification_actions` - Analytics: dismiss/click tracking

**Message System (Not Connected):**
- ⚠️ `message_templates` - Dynamic rotating messages (NOT USED)
- ⚠️ `message_views` - Analytics (NOT USED)

**Push Notifications (Separate):**
- ⚠️ `push_notification_templates` - Push notification templates
- ⚠️ `push_notifications_log` - Push notification history

### ❌ Critical Issues Found

1. **Dismissed messages come back** - The `notification_dismissals` table has a 24-hour timeout that resets
2. **Messages don't rotate properly** - Using day-of-week rotation (same message all day)
3. **No weather/time-based messages** - System exists but not connected
4. **Duplicate systems** - Confusion between notifications and messages
5. **Analytics partially working** - Views and actions tracked but not used for optimization

---

## 📊 What You Have - Detailed Breakdown

### 1️⃣ Notification Banner System (ACTIVE)

**Location:** Top of dashboard  
**Component:** `/components/dashboard/notification-banner.tsx`  
**Database Table:** `notifications`  
**Status:** ✅ Working but has issues

#### How It Works:
```
User opens dashboard
  → NotificationBanner component renders
  → Fetches from /api/notifications/get-for-user
  → Matches conditions (rewards, streaks, check-ins)
  → Displays 1-5 notifications
  → Rotates every 10 seconds
  → Can be dismissed
```

#### Database Schema:
```sql
notifications (
  id UUID PRIMARY KEY,
  type TEXT,                    -- 'reward', 'streak', 'checkin', etc.
  priority INTEGER,             -- 1 = highest
  title TEXT,
  message TEXT,
  icon TEXT,
  conditions JSONB,             -- Matching rules
  variant TEXT,                 -- 'default', 'streak', 'success', 'reward'
  dismissible BOOLEAN,
  active BOOLEAN,
  created_at TIMESTAMPTZ
)

notification_dismissals (
  id UUID PRIMARY KEY,
  user_id UUID,
  notification_id UUID,
  dismissed_at TIMESTAMPTZ,
  UNIQUE(user_id, notification_id)
)
```

#### ❌ Problems:

1. **Dismissals Reset After 24 Hours**
   - Code: `dismissed_at > NOW() - INTERVAL '1 day'`
   - Location: `/supabase/migrations/20251010_notifications_system.sql` line 161
   - **Result:** Same notifications come back tomorrow

2. **Limited Rotation**
   - Only rotates through 1-5 matched notifications
   - Same notifications repeat if conditions match

3. **No Fresh Content**
   - Messages are static in database
   - No random selection from message pool
   - No time/weather-based variety

4. **Cache Issues**
   - 5-minute sessionStorage cache
   - Stale messages shown
   - Code: `notification-banner.tsx` lines 78-101

---

### 2️⃣ Dynamic Messages System (CREATED BUT NOT USED)

**Location:** Created but not implemented  
**Files:**
- `/supabase/migrations/20251013_dynamic_messages_system.sql`
- `/hooks/use-dynamic-message.ts`
- `/app/api/messages/get-random/route.ts`
- `/DYNAMIC_MESSAGES_IMPLEMENTATION.md`

**Database Table:** `message_templates`  
**Status:** ⚠️ Created but NOT connected to UI

#### What Was Built:

```sql
message_templates (
  id UUID PRIMARY KEY,
  category TEXT,              -- 'coffee', 'points', 'games', 'referrals'
  context TEXT,               -- 'default', 'nearby', 'at_penkey'
  message TEXT,
  emoji TEXT,
  conditions JSONB,
  active BOOLEAN,
  priority INTEGER,
  weight INTEGER,             -- For weighted random selection
  created_at TIMESTAMPTZ
)
```

#### Features:
- ✅ Weighted random selection
- ✅ Category-based messages
- ✅ Context-aware (nearby, at location)
- ✅ Auto-refresh every 2 minutes
- ✅ React hook ready
- ✅ API endpoint ready
- ❌ **NOT CONNECTED TO ANY COMPONENT**

#### Why It's Not Working:
- Hook exists but no component uses it
- Messages seeded in database
- API works but nothing calls it
- Documentation says "ready to implement" but never was

---

### 3️⃣ Hardcoded Rotating Messages (OLD SYSTEM)

**Location:** `/lib/rotating-messages.ts`  
**Status:** ⚠️ Still in use by some components  
**Problem:** Day-of-week rotation (same message all day)

#### Code:
```typescript
export function getRotatingMessage(messages: string[]): string {
  const dayOfWeek = new Date().getDay() // 0-6
  return messages[dayOfWeek % messages.length]
}
```

#### ❌ Problem:
- Monday = Message 1
- Tuesday = Message 2
- Same message ALL DAY
- No variety within a day

#### Where It's Used:
- Dashboard card descriptions
- Coffee stamp messages
- Referral messages
- Points messages

---

## 🔍 Database Tables Status

| Table | Exists | Used | Purpose | Issues |
|-------|--------|------|---------|--------|
| `notifications` | ✅ Yes | ✅ Yes | Banner notifications | 24hr dismissal reset |
| `notification_dismissals` | ✅ Yes | ✅ Yes | Track dismissals | Resets daily |
| `notification_views` | ✅ Yes | ✅ Yes | Track when shown | Working |
| `notification_actions` | ✅ Yes | ✅ Yes | Track dismiss/click | Working |
| `message_templates` | ✅ Yes | ❌ No | Dynamic messages | Not connected |
| `message_views` | ✅ Yes | ❌ No | Message analytics | Not used |
| `push_notification_templates` | ✅ Yes | ⚠️ Unknown | Push notifications | Separate system |
| `push_notifications_log` | ✅ Yes | ⚠️ Unknown | Push notification log | Separate system |

---

## 📊 Complete Table Schemas

### Notification System Tables

#### 1. `notifications`
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,              -- 'reward', 'streak', 'checkin', etc.
  priority INTEGER DEFAULT 5,      -- 1 = highest priority
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  conditions JSONB DEFAULT '{}',   -- Matching rules
  variant TEXT DEFAULT 'default',  -- 'default', 'streak', 'success', 'reward'
  dismissible BOOLEAN DEFAULT true,
  show_badge BOOLEAN DEFAULT false,
  badge_text TEXT,
  badge_color TEXT,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  days_of_week INTEGER[],
  time_of_day_start TIME,
  time_of_day_end TIME,
  target_audience TEXT DEFAULT 'all',
  min_points INTEGER,
  max_points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
)
```

#### 2. `notification_dismissals`
```sql
CREATE TABLE public.notification_dismissals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
)
```
**Purpose:** Track which users dismissed which notifications  
**Timeout:** 24 hours (resets daily)  
**Used by:** `/api/notifications/dismiss` and `/api/notifications/check-dismissal`

#### 3. `notification_views`
```sql
CREATE TABLE public.notification_views (
  id UUID PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  user_agent TEXT
)
```
**Purpose:** Track when notifications are shown to users  
**Used by:** `/api/notifications/track-view`  
**Status:** ✅ Working - Called from `notification-banner.tsx` line 220

#### 4. `notification_actions`
```sql
CREATE TABLE public.notification_actions (
  id UUID PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('dismiss', 'click', 'convert')),
  action_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
)
```
**Purpose:** Track user actions (dismiss, click, convert)  
**Used by:** `/api/notifications/track-action`  
**Status:** ✅ Working - Called from `notification-banner.tsx` lines 350, 461

---

## 🐛 Why Dismissed Messages Come Back

### The Problem:

**Code Location:** `/supabase/migrations/20251010_notifications_system.sql` (line 161)

```sql
AND NOT EXISTS (
  SELECT 1 FROM public.notification_dismissals nd
  WHERE nd.user_id = p_user_id
  AND nd.notification_id = n.id
  AND nd.dismissed_at > NOW() - INTERVAL '1 day'  -- ⚠️ THIS LINE
)
```

**What This Means:**
- Dismissals only last 24 hours
- After 24 hours, the notification shows again
- This is BY DESIGN but probably not what you want

### The Fix Options:

**Option A: Permanent Dismissals**
```sql
-- Remove the time check
AND NOT EXISTS (
  SELECT 1 FROM public.notification_dismissals nd
  WHERE nd.user_id = p_user_id
  AND nd.notification_id = n.id
)
```

**Option B: Longer Timeout (7 days)**
```sql
AND nd.dismissed_at > NOW() - INTERVAL '7 days'
```

**Option C: Per-Notification Timeout**
Add column to `notifications` table:
```sql
ALTER TABLE notifications ADD COLUMN dismissal_duration INTERVAL DEFAULT '7 days';
```

---

## 🎯 Recommended Solution

### Unified System Architecture

Combine the best of all three systems:

```
┌─────────────────────────────────────────────────┐
│         NOTIFICATION BANNER (Top)               │
│  - Urgent/Priority messages                     │
│  - Rewards ready, streaks, milestones           │
│  - Dismissible with configurable timeout        │
│  - Source: notifications table                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      ROTATING MESSAGES (Card Descriptions)      │
│  - Fresh random messages every 2 minutes        │
│  - Weather/time-based                           │
│  - Location-aware                               │
│  - Source: message_templates table              │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Proposed Improvements

### 1. Fix Dismissal System

**File:** `/supabase/migrations/20251010_notifications_system.sql`

**Change:**
```sql
-- Add dismissal_duration column
ALTER TABLE notifications 
ADD COLUMN dismissal_duration INTERVAL DEFAULT '7 days';

-- Update function to use per-notification duration
AND NOT EXISTS (
  SELECT 1 FROM public.notification_dismissals nd
  WHERE nd.user_id = p_user_id
  AND nd.notification_id = n.id
  AND nd.dismissed_at > NOW() - COALESCE(n.dismissal_duration, INTERVAL '7 days')
)
```

**Benefits:**
- Configurable per notification
- Some can be permanent, some temporary
- Default 7 days instead of 1 day

---

### 2. Implement Dynamic Messages

**Connect the existing system to components:**

#### A. Coffee Stamp Card
**File:** `/app/dashboard/new-dashboard-client.tsx`

**Replace:**
```typescript
{getCoffeeMessage(stats.stamps, isNear, isAtPenkey)}
```

**With:**
```typescript
import { useDynamicMessage } from '@/hooks/use-dynamic-message'

const { message: coffeeMessage } = useDynamicMessage({
  category: 'coffee',
  context: isAtPenkey ? 'at_penkey' : isNear ? 'nearby' : 'default',
  refreshInterval: 2 * 60 * 1000 // 2 minutes
})

// Use: {coffeeMessage || getCoffeeMessage(stats.stamps, isNear, isAtPenkey)}
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

---

### 3. Add Weather/Time-Based Messages

**Already in database!** Just need to activate:

```sql
-- Check existing messages
SELECT * FROM message_templates 
WHERE category = 'coffee' 
ORDER BY context, weight DESC;

-- Add weather-based messages
INSERT INTO message_templates (category, context, message, emoji, weight, conditions) VALUES
('coffee', 'rainy', 'Rainy day? Perfect for a cozy coffee! ☕🌧️', '☕', 2, '{"weather": "rain"}'),
('coffee', 'cold', 'Brrr! Warm up with our Coffee Mongers brew! ☕❄️', '☕', 2, '{"temperature": {"max": 10}}'),
('coffee', 'sunny', 'Gorgeous day! Grab a coffee and enjoy the sunshine! ☕☀️', '☕', 2, '{"weather": "clear"}');
```

---

### 4. Improve Rotation Logic

**Current:** Day-of-week (same message all day)  
**Proposed:** Random weighted selection every 2 minutes

**Implementation:**
- ✅ Already built in `message_templates` system
- ✅ Hook auto-refreshes every 2 minutes
- ✅ Weighted random selection
- ❌ Just needs to be connected

---

### 5. Better Cache Strategy

**Current Issues:**
- 5-minute sessionStorage cache
- Stale messages
- No invalidation

**Proposed:**
```typescript
// Notification Banner: 2-minute cache
const CACHE_DURATION = 2 * 60 * 1000

// Dynamic Messages: No cache (hook handles refresh)
const { message } = useDynamicMessage({
  refreshInterval: 2 * 60 * 1000
})
```

---

## 📋 Implementation Checklist

### Phase 1: Fix Dismissals (30 minutes)
- [ ] Add `dismissal_duration` column to `notifications`
- [ ] Update dismissal check function
- [ ] Set default to 7 days
- [ ] Test dismissal persistence
- [ ] Update admin UI to set duration

### Phase 2: Connect Dynamic Messages (2 hours)
- [ ] Update Coffee Stamp Card to use `useDynamicMessage`
- [ ] Update Referral Card to use `useDynamicMessage`
- [ ] Update Points Card to use `useDynamicMessage`
- [ ] Update Game Card to use `useDynamicMessage`
- [ ] Test message rotation (should change every 2 min)
- [ ] Verify fallback to hardcoded messages

### Phase 3: Add Weather/Time Messages (1 hour)
- [ ] Add weather-based messages to `message_templates`
- [ ] Add time-based messages (morning, afternoon, evening)
- [ ] Add location-based messages (nearby, at Penkey)
- [ ] Test weather API integration
- [ ] Verify messages match conditions

### Phase 4: Reduce Cache Duration (15 minutes)
- [ ] Change notification cache from 5min to 2min
- [ ] Test cache invalidation
- [ ] Monitor performance

### Phase 5: Cleanup (30 minutes)
- [ ] Remove unused hardcoded message arrays
- [ ] Update documentation
- [ ] Add admin UI for message management
- [ ] Test end-to-end

---

## 🎨 Example: Complete Implementation

### Coffee Stamp Card with Dynamic Messages

```typescript
import { useDynamicMessage } from '@/hooks/use-dynamic-message'

export function CoffeeStampCard({ stamps, isNear, isAtPenkey }) {
  // Get dynamic message from database
  const { message: dynamicMessage, loading } = useDynamicMessage({
    category: 'coffee',
    context: isAtPenkey ? 'at_penkey' : isNear ? 'nearby' : 'default',
    refreshInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  })
  
  // Fallback to hardcoded if loading or error
  const message = dynamicMessage || getCoffeeMessage(stamps, isNear, isAtPenkey)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coffee Stamps</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {/* ... */}
    </Card>
  )
}
```

**Result:**
- ✅ Fresh message every 2 minutes
- ✅ Location-aware (nearby, at Penkey)
- ✅ Weather-aware (if conditions set)
- ✅ Time-aware (morning, afternoon, evening)
- ✅ Fallback to hardcoded if database fails

---

## 🔧 Database Queries for Testing

### Check Dismissals
```sql
SELECT 
  nd.dismissed_at,
  n.title,
  n.dismissal_duration,
  NOW() - nd.dismissed_at as time_since_dismissal
FROM notification_dismissals nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.user_id = 'YOUR_USER_ID'
ORDER BY nd.dismissed_at DESC;
```

### Check Message Templates
```sql
SELECT 
  category,
  context,
  message,
  weight,
  active,
  conditions
FROM message_templates
WHERE active = true
ORDER BY category, context, weight DESC;
```

### Test Random Message Selection
```sql
SELECT * FROM get_random_message('coffee', 'default');
-- Run multiple times to see different messages
```

### Check Notification Matching
```sql
SELECT 
  id,
  type,
  priority,
  title,
  conditions,
  active
FROM notifications
WHERE active = true
ORDER BY priority ASC;
```

---

## 📊 Performance Impact

### Current System:
- 5-minute cache = stale messages
- Day-of-week rotation = boring
- Multiple API calls

### Proposed System:
- 2-minute cache = fresher content
- Random selection = more variety
- Single API call per component
- Minimal database load (~1ms queries)

**Estimated Load:**
- 100 users × 5 components × 30 refreshes/hour = 15,000 queries/hour
- At 1ms per query = 15 seconds of DB time per hour
- **Negligible impact**

---

## 🎯 Quick Wins (Do These First)

### 1. Fix Dismissal Timeout (5 minutes)
Change from 1 day to 7 days in one line of code.

### 2. Reduce Cache Duration (2 minutes)
Change from 5 minutes to 2 minutes.

### 3. Connect One Component (15 minutes)
Start with Coffee Stamp Card - easiest to test.

### 4. Add 5 Weather Messages (10 minutes)
Quick SQL inserts for rainy/sunny/cold days.

---

## 📝 Summary

### What's Working:
✅ Notification banner displays  
✅ Dismissals save to database  
✅ Rotation between multiple notifications  
✅ Dynamic message system exists  
✅ API endpoints ready  

### What's Broken:
❌ Dismissals reset after 24 hours  
❌ Same message shows all day (day-of-week rotation)  
❌ Dynamic messages not connected to UI  
❌ Weather/time messages not active  
❌ Too much caching (5 minutes)  

### Quick Fix Priority:
1. **Dismissal timeout** - Change 1 line (1 day → 7 days)
2. **Cache duration** - Change 1 line (5 min → 2 min)
3. **Connect dynamic messages** - Use existing hook
4. **Add weather messages** - SQL inserts

---

**Next Steps:** Let me know which improvements you want to implement first, and I'll create the specific code changes.
