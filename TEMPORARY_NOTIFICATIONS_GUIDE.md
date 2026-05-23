# Temporary Notifications Guide

## Overview
Temporary notifications are special messages that **automatically expire and disappear forever** after being shown for a set period (default 24 hours).

## How It Works

### 1. **First View Timestamp**
- When a temporary notification is first shown to **any user**, the system records `first_shown_at` timestamp
- This starts the countdown timer

### 2. **Auto-Expiration**
- After the specified hours (`auto_expire_hours`, default 24), the notification is automatically deactivated
- Once deactivated, it **never shows again** to anyone
- The system checks for expired notifications every time notifications are fetched

### 3. **Difference from Dismissals**
- **Dismissal**: User-specific, hides notification for that user for 24 hours
- **Temporary**: Global, notification disappears for everyone after expiry time

## Creating Temporary Notifications

### Via Database (Supabase)

```sql
INSERT INTO public.notifications (
  type, 
  priority, 
  title, 
  message, 
  icon, 
  conditions, 
  variant, 
  dismissible,
  is_temporary,        -- Set to true
  auto_expire_hours    -- Hours until expiry (default 24)
) VALUES (
  'custom',
  1,
  '🎉 Flash Sale!',
  'Double points on all purchases for the next 24 hours!',
  '🎉',
  '{}',
  'reward',
  true,
  true,   -- This is temporary
  24      -- Expires 24 hours after first shown
);
```

### Via Admin Panel (Future)
When you build the admin notifications panel, add:
- Checkbox: "Temporary notification"
- Number input: "Expire after (hours)"

## Use Cases

### ✅ **Perfect For:**
- **Flash sales** - "Double points today only!"
- **Special events** - "Live music tonight at 7pm!"
- **Limited offers** - "Free pastry with coffee until 2pm!"
- **Announcements** - "New menu items launching this week!"
- **Holiday specials** - "Valentine's Day special - buy one get one!"
- **Weather-based** - "Hot chocolate special on this cold day!"

### ❌ **Not Good For:**
- Regular recurring messages (use normal notifications)
- Permanent information (use normal notifications)
- User-specific messages (use targeted conditions instead)

## Examples

### Example 1: Daily Special (6 hours)
```sql
INSERT INTO public.notifications (
  type, priority, title, message, icon,
  conditions, variant, dismissible,
  is_temporary, auto_expire_hours
) VALUES (
  'custom', 1, '☕ Today''s Special!',
  'Pumpkin Spice Latte - 20% off until 2pm!',
  '☕',
  '{"timeOfDay": "morning"}',
  'reward', true,
  true, 6  -- Expires 6 hours after first shown
);
```

### Example 2: Weekend Event (48 hours)
```sql
INSERT INTO public.notifications (
  type, priority, title, message, icon,
  conditions, variant, dismissible,
  is_temporary, auto_expire_hours
) VALUES (
  'custom', 1, '🎵 Live Music Weekend!',
  'Join us Saturday & Sunday for live acoustic performances!',
  '🎵',
  '{}',
  'default', true,
  true, 48  -- Expires 48 hours after first shown
);
```

### Example 3: Flash Sale (12 hours)
```sql
INSERT INTO public.notifications (
  type, priority, title, message, icon,
  conditions, variant, dismissible,
  is_temporary, auto_expire_hours
) VALUES (
  'custom', 1, '⚡ FLASH SALE!',
  'Triple points on all purchases for the next 12 hours!',
  '⚡',
  '{}',
  'reward', false,  -- Can't dismiss (too important!)
  true, 12  -- Expires 12 hours after first shown
);
```

## Database Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_temporary` | BOOLEAN | If true, notification will auto-expire |
| `auto_expire_hours` | INTEGER | Hours until expiration (default 24) |
| `first_shown_at` | TIMESTAMP | When notification was first shown to any user |

## Monitoring

### Check Active Temporary Notifications
```sql
SELECT 
  id,
  title,
  is_temporary,
  first_shown_at,
  auto_expire_hours,
  first_shown_at + (auto_expire_hours || ' hours')::INTERVAL as expires_at,
  active
FROM public.notifications
WHERE is_temporary = true
ORDER BY first_shown_at DESC;
```

### Check Expired Temporary Notifications
```sql
SELECT 
  id,
  title,
  first_shown_at,
  first_shown_at + (auto_expire_hours || ' hours')::INTERVAL as expired_at
FROM public.notifications
WHERE is_temporary = true
  AND active = false
  AND first_shown_at IS NOT NULL
ORDER BY first_shown_at DESC;
```

### Manually Deactivate Expired Notifications
```sql
SELECT deactivate_expired_temporary_notifications();
```

## Tips & Best Practices

1. **Set appropriate expiry times**
   - Short events: 6-12 hours
   - Daily specials: 24 hours
   - Weekend events: 48 hours
   - Weekly promotions: 168 hours (7 days)

2. **High priority for urgent messages**
   - Temporary notifications should usually have priority 1-3
   - They're time-sensitive, so show them first!

3. **Clear, urgent messaging**
   - Use words like "Today only!", "Limited time!", "Ends soon!"
   - Include specific timeframes when possible

4. **Consider dismissibility**
   - Very urgent: `dismissible = false`
   - Normal: `dismissible = true`

5. **Combine with conditions**
   - Target specific times: `{"timeOfDay": "morning"}`
   - Target specific users: `{"hasUnredeemedRewards": false}`

## Migration

Run the migration to enable this feature:
```bash
# The migration file is already created:
# supabase/migrations/20251017_add_temporary_notifications.sql

# It will be applied automatically on next deployment
# Or manually run it in Supabase SQL editor
```

## Summary

✅ **Temporary notifications automatically disappear forever after expiry**  
✅ **Perfect for time-sensitive offers and events**  
✅ **No manual cleanup needed - system handles it automatically**  
✅ **Countdown starts from first view, not creation time**  
✅ **Separate from user dismissals (which are per-user)**  

Use this feature for flash sales, special events, and limited-time offers! 🎉
