# 📊 Notification Tables Quick Reference

**Date:** October 14, 2025

---

## 🗄️ All Notification-Related Tables

### 1. `notifications`
**Purpose:** Main notification definitions  
**Status:** ✅ Active and working  
**Used by:** NotificationBanner component

```sql
SELECT COUNT(*) FROM notifications WHERE active = true;
-- Check how many active notifications exist
```

**Key Columns:**
- `type` - 'reward', 'streak', 'checkin', 'stamp', 'game', 'milestone', 'custom'
- `priority` - 1 (highest) to 10 (lowest)
- `conditions` - JSONB matching rules
- `dismissible` - Can user dismiss it?
- `active` - Is it currently shown?

---

### 2. `notification_dismissals`
**Purpose:** Track which users dismissed which notifications  
**Status:** ✅ Working but resets after 24 hours  
**Used by:** `/api/notifications/dismiss` and `/api/notifications/check-dismissal`

```sql
-- Check your dismissals
SELECT 
  nd.dismissed_at,
  n.title,
  NOW() - nd.dismissed_at as time_since_dismissal
FROM notification_dismissals nd
JOIN notifications n ON nd.notification_id = n.id
WHERE nd.user_id = 'YOUR_USER_ID'
ORDER BY nd.dismissed_at DESC;
```

**⚠️ Issue:** Dismissals only last 24 hours, then notification shows again

**Fix Location:** `/supabase/migrations/20251010_notifications_system.sql` line 161

---

### 3. `notification_views`
**Purpose:** Track when notifications are shown to users  
**Status:** ✅ Working - Analytics  
**Used by:** `/api/notifications/track-view`

```sql
-- Check view analytics
SELECT 
  n.title,
  COUNT(*) as total_views,
  COUNT(DISTINCT nv.user_id) as unique_users,
  MAX(nv.viewed_at) as last_viewed
FROM notification_views nv
JOIN notifications n ON nv.notification_id = n.id
WHERE nv.viewed_at >= NOW() - INTERVAL '7 days'
GROUP BY n.id, n.title
ORDER BY total_views DESC;
```

**Tracked Data:**
- When notification was shown
- Which user saw it
- Session ID
- User agent (browser/device)

---

### 4. `notification_actions`
**Purpose:** Track user actions (dismiss, click, convert)  
**Status:** ✅ Working - Analytics  
**Used by:** `/api/notifications/track-action`

```sql
-- Check action analytics
SELECT 
  n.title,
  na.action_type,
  COUNT(*) as action_count,
  COUNT(DISTINCT na.user_id) as unique_users
FROM notification_actions na
JOIN notifications n ON na.notification_id = n.id
WHERE na.action_at >= NOW() - INTERVAL '7 days'
GROUP BY n.id, n.title, na.action_type
ORDER BY action_count DESC;
```

**Action Types:**
- `dismiss` - User dismissed notification
- `click` - User clicked notification/CTA
- `convert` - User completed desired action

---

### 5. `message_templates`
**Purpose:** Dynamic rotating messages for cards  
**Status:** ⚠️ Created but NOT connected to UI  
**Used by:** NONE (should be used by dashboard cards)

```sql
-- Check available messages
SELECT 
  category,
  context,
  message,
  weight,
  active
FROM message_templates
WHERE active = true
ORDER BY category, context, weight DESC;
```

**Categories:**
- `coffee` - Coffee stamp messages
- `points` - Points card messages
- `games` - Game card messages
- `referrals` - Referral messages
- `rewards` - Reward messages

**Contexts:**
- `default` - General messages
- `nearby` - User is near Penkey
- `at_penkey` - User is at Penkey
- `rainy` - Rainy weather
- `cold` - Cold weather
- `sunny` - Sunny weather

---

### 6. `message_views`
**Purpose:** Track message template views  
**Status:** ❌ Not used (message system not connected)

```sql
-- Would track which messages are shown
SELECT * FROM message_views LIMIT 10;
```

---

### 7. `push_notification_templates`
**Purpose:** Templates for push notifications  
**Status:** ⚠️ Separate system (not related to banner)

```sql
-- Check push notification templates
SELECT 
  id,
  title,
  body,
  trigger_type,
  active
FROM push_notification_templates
WHERE active = true;
```

---

### 8. `push_notifications_log`
**Purpose:** Log of sent push notifications  
**Status:** ⚠️ Separate system

```sql
-- Check recent push notifications
SELECT 
  user_id,
  title,
  body,
  sent_at,
  status
FROM push_notifications_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
ORDER BY sent_at DESC
LIMIT 20;
```

---

## 🔧 Common Queries

### Check Notification Performance
```sql
-- Which notifications get dismissed most?
SELECT 
  n.title,
  COUNT(DISTINCT nv.user_id) as views,
  COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'dismiss') as dismissals,
  ROUND(
    COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'dismiss')::numeric / 
    NULLIF(COUNT(DISTINCT nv.user_id), 0) * 100, 
    2
  ) as dismiss_rate
FROM notifications n
LEFT JOIN notification_views nv ON n.id = nv.notification_id
LEFT JOIN notification_actions na ON n.id = na.notification_id
WHERE nv.viewed_at >= NOW() - INTERVAL '7 days'
GROUP BY n.id, n.title
ORDER BY dismiss_rate DESC;
```

### Check User's Notification History
```sql
-- What notifications has a user seen?
SELECT 
  n.title,
  nv.viewed_at,
  na.action_type,
  na.action_at
FROM notification_views nv
JOIN notifications n ON nv.notification_id = n.id
LEFT JOIN notification_actions na ON nv.notification_id = na.notification_id 
  AND nv.user_id = na.user_id
WHERE nv.user_id = 'YOUR_USER_ID'
ORDER BY nv.viewed_at DESC
LIMIT 20;
```

### Find Stale Dismissals
```sql
-- Dismissals older than 24 hours (will reset)
SELECT 
  u.email,
  n.title,
  nd.dismissed_at,
  NOW() - nd.dismissed_at as age
FROM notification_dismissals nd
JOIN notifications n ON nd.notification_id = n.id
JOIN users u ON nd.user_id = u.id
WHERE nd.dismissed_at < NOW() - INTERVAL '24 hours'
ORDER BY nd.dismissed_at DESC;
```

### Test Message Template System
```sql
-- Get random coffee message
SELECT * FROM get_random_message('coffee', 'default');

-- Get 3 rotating messages
SELECT * FROM get_rotating_messages('coffee', 'default', 3);
```

---

## 🎯 Quick Fixes

### 1. Change Dismissal Timeout (1 day → 7 days)

**File:** `/supabase/migrations/20251010_notifications_system.sql` line 161

**Change:**
```sql
-- FROM:
AND nd.dismissed_at > NOW() - INTERVAL '1 day'

-- TO:
AND nd.dismissed_at > NOW() - INTERVAL '7 days'
```

**Or run this migration:**
```sql
-- Create new migration file
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
      AND nd.dismissed_at > NOW() - INTERVAL '7 days'  -- Changed from 1 day
    )
    ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 2. Check Which Tables Are Being Used

```sql
-- Check table sizes and row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename LIKE '%notif%' OR tablename LIKE '%message%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### 3. Clean Up Old Data

```sql
-- Delete old notification views (older than 30 days)
DELETE FROM notification_views 
WHERE viewed_at < NOW() - INTERVAL '30 days';

-- Delete old notification actions (older than 30 days)
DELETE FROM notification_actions 
WHERE action_at < NOW() - INTERVAL '30 days';

-- Delete expired dismissals (older than 7 days)
DELETE FROM notification_dismissals 
WHERE dismissed_at < NOW() - INTERVAL '7 days';
```

---

## 📊 Analytics Dashboard Queries

### Notification Effectiveness
```sql
WITH notification_stats AS (
  SELECT 
    n.id,
    n.title,
    n.type,
    COUNT(DISTINCT nv.user_id) as unique_views,
    COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'click') as clicks,
    COUNT(DISTINCT na.user_id) FILTER (WHERE na.action_type = 'dismiss') as dismissals
  FROM notifications n
  LEFT JOIN notification_views nv ON n.id = nv.notification_id 
    AND nv.viewed_at >= NOW() - INTERVAL '7 days'
  LEFT JOIN notification_actions na ON n.id = na.notification_id 
    AND na.action_at >= NOW() - INTERVAL '7 days'
  WHERE n.active = true
  GROUP BY n.id, n.title, n.type
)
SELECT 
  title,
  type,
  unique_views,
  clicks,
  dismissals,
  ROUND(clicks::numeric / NULLIF(unique_views, 0) * 100, 2) as click_rate,
  ROUND(dismissals::numeric / NULLIF(unique_views, 0) * 100, 2) as dismiss_rate
FROM notification_stats
WHERE unique_views > 0
ORDER BY unique_views DESC;
```

---

## 🔍 Debugging

### Check if Notification System is Working
```sql
-- 1. Check active notifications
SELECT id, title, type, priority, active FROM notifications WHERE active = true;

-- 2. Check recent views
SELECT COUNT(*) FROM notification_views WHERE viewed_at >= NOW() - INTERVAL '1 hour';

-- 3. Check recent actions
SELECT action_type, COUNT(*) FROM notification_actions 
WHERE action_at >= NOW() - INTERVAL '1 hour'
GROUP BY action_type;

-- 4. Check dismissals
SELECT COUNT(*) FROM notification_dismissals 
WHERE dismissed_at >= NOW() - INTERVAL '24 hours';
```

### Check if Message System is Ready
```sql
-- 1. Check message templates exist
SELECT category, COUNT(*) FROM message_templates WHERE active = true GROUP BY category;

-- 2. Test random selection
SELECT * FROM get_random_message('coffee', 'default');

-- 3. Test rotating selection
SELECT * FROM get_rotating_messages('coffee', 'default', 3);
```

---

**Last Updated:** October 14, 2025  
**Related Files:**
- `/components/dashboard/notification-banner.tsx`
- `/hooks/use-dynamic-message.ts`
- `/app/api/notifications/get-for-user/route.ts`
- `/supabase/migrations/20251010_notifications_system.sql`
