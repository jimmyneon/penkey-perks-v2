# Push Notifications - Setup & Auto-Trigger Guide

## Current Status

✅ **What's Working:**
- Push notification system is set up
- Users can subscribe
- Manual push notifications work (from Staff Dashboard)

❌ **What's NOT Working:**
- Automatic push notifications on events (game wins, rewards, etc.)
- Templates exist but aren't being triggered automatically

---

## Why Aren't They Firing Automatically?

Push notification templates are **passive** - they exist in the database but need to be **actively triggered** by your code or database triggers.

Unlike emails which have a queue system and cron jobs, push notifications are sent **immediately** when you call the `sendNotification()` function.

---

## How to Make Them Automatic

You have 3 options:

### Option 1: Add to Existing API Routes (Easiest)

Add `sendNotification()` calls to your existing API routes when events happen.

#### Example: Game Win Notification

In `/app/api/games/[gameId]/play/route.ts`:

```typescript
import { sendNotification } from '@/lib/messaging/send-notification'

// After game is played and points awarded
if (won) {
  // Send push notification
  await sendNotification({
    userId: user.id,
    templateName: 'game_won',
    variables: {
      beans: pointsAwarded,
      gameName: game.name
    },
    channels: {
      push: true,
      email: false,
      inApp: true
    }
  })
}
```

#### Example: Reward Earned Notification

In `/app/api/rewards/claim/route.ts`:

```typescript
// After reward is claimed
await sendNotification({
  userId: user.id,
  templateName: 'reward_earned',
  variables: {
    rewardName: reward.name
  },
  channels: {
    push: true,
    email: false,
    inApp: true
  }
})
```

---

### Option 2: Database Triggers (More Advanced)

Create PostgreSQL triggers that call an API endpoint when events happen.

#### Example: Trigger on Points Transaction

```sql
CREATE OR REPLACE FUNCTION notify_points_earned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for positive points
  IF NEW.amount > 0 THEN
    -- Call API to send notification
    PERFORM net.http_post(
      url := get_app_setting('app_url') || '/api/notifications/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || get_app_setting('cron_secret')
      ),
      body := jsonb_build_object(
        'userId', NEW.user_id,
        'templateName', 'points_earned',
        'variables', jsonb_build_object(
          'beans', NEW.amount,
          'reason', NEW.reason
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_points_earned
  AFTER INSERT ON points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_points_earned();
```

---

### Option 3: Email Triggers with Push Enabled

Use the existing `email_triggers` system and enable `send_push`.

```sql
-- Enable push notifications for existing email triggers
UPDATE email_triggers
SET send_push = true
WHERE event_type IN ('game_won', 'reward_earned', 'milestone_reached');
```

**Note:** This requires the email trigger system to be fully set up and working.

---

## Recommended Approach

**Start with Option 1** - Add `sendNotification()` calls to your existing API routes.

This is:
- ✅ Easiest to implement
- ✅ Most reliable
- ✅ Easy to debug
- ✅ Works immediately

---

## Step-by-Step: Add Automatic Notifications

### Step 1: Identify Key Events

Where do you want to send push notifications?
- [ ] Game won
- [ ] Game lost
- [ ] Points earned
- [ ] Reward earned
- [ ] Free coffee ready
- [ ] Milestone reached
- [ ] Streak achieved
- [ ] Birthday
- [ ] Reward expiring soon

### Step 2: Find the API Routes

For each event, find the API route that handles it:
- Game played: `/app/api/games/[gameId]/play/route.ts`
- Reward claimed: `/app/api/rewards/claim/route.ts`
- Points added: `/app/api/points/add/route.ts`
- Check-in: `/app/api/check-in/route.ts`

### Step 3: Add sendNotification() Calls

In each route, after the event succeeds, add:

```typescript
import { sendNotification } from '@/lib/messaging/send-notification'

// After successful event
await sendNotification({
  userId: user.id,
  templateName: 'template_name_here', // Match template in database
  variables: {
    // Variables to substitute in template
    beans: 50,
    rewardName: 'Free Coffee'
  },
  channels: {
    push: true,    // Send push notification
    email: false,  // Don't send email (or true if you want both)
    inApp: true    // Show in-app notification banner
  }
})
```

### Step 4: Test

1. Trigger the event (play a game, claim a reward, etc.)
2. Check if push notification is received
3. Check logs for errors

---

## Available Templates

Run `CHECK_PUSH_NOTIFICATION_SETUP.sql` to see all available templates.

Common templates:
- `game_won` - When user wins a game
- `game_lost` - When user loses a game
- `reward_earned` - When user earns a reward
- `milestone_reached` - When user hits a milestone
- `streak_achieved` - When user maintains a streak
- `coffee_ready` - When free coffee is ready
- `reward_expiring` - When reward is about to expire

---

## Example: Complete Implementation

### Game Win Notification

**File:** `/app/api/games/[gameId]/play/route.ts`

```typescript
import { sendNotification } from '@/lib/messaging/send-notification'

export async function POST(request: Request, { params }: { params: { gameId: string } }) {
  // ... existing game logic ...
  
  // After game is played and result is determined
  if (won) {
    // Award points
    await addPoints(user.id, pointsAwarded, 'game_win', `Won ${game.name}`)
    
    // Send notification
    try {
      await sendNotification({
        userId: user.id,
        templateName: 'game_won',
        variables: {
          beans: pointsAwarded,
          gameName: game.name
        },
        channels: {
          push: true,
          email: false,
          inApp: true
        }
      })
      console.log('✅ Game win notification sent')
    } catch (error) {
      console.error('❌ Failed to send game win notification:', error)
      // Don't fail the whole request if notification fails
    }
  }
  
  return NextResponse.json({ success: true, won, points: pointsAwarded })
}
```

---

## Testing

### 1. Check Templates Exist

```sql
SELECT name, title, message 
FROM push_notification_templates 
WHERE active = true;
```

### 2. Check User is Subscribed

```sql
SELECT * FROM push_subscriptions 
WHERE user_id = 'your-user-id' 
AND active = true;
```

### 3. Trigger an Event

Play a game, claim a reward, etc.

### 4. Check Logs

```sql
SELECT * FROM push_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Look for:
- `status = 'sent'` ✅
- `status = 'failed'` with error_message ❌

---

## Common Issues

### Issue 1: Template Not Found

**Error:** `Template 'game_won' not found`

**Fix:** Check template name matches exactly:
```sql
SELECT name FROM push_notification_templates WHERE active = true;
```

### Issue 2: User Not Subscribed

**Error:** `No active subscriptions found`

**Fix:** User needs to enable push notifications in the app.

### Issue 3: VAPID Keys Not Set

**Error:** `VAPID keys not configured`

**Fix:** Check environment variables:
```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

### Issue 4: Notification Sent But Not Received

**Possible causes:**
- User's browser/device blocked notifications
- Service worker not registered
- Push subscription expired

**Check:**
```sql
SELECT status, error_message 
FROM push_logs 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC;
```

---

## Quick Start Checklist

To enable automatic push notifications:

- [ ] Run `CHECK_PUSH_NOTIFICATION_SETUP.sql` to see templates
- [ ] Choose which events should trigger notifications
- [ ] Find the API routes for those events
- [ ] Add `sendNotification()` calls after successful events
- [ ] Test by triggering the event
- [ ] Check push_logs for results
- [ ] Verify notification is received on device

---

## Summary

**Current State:**
- ✅ Push notification infrastructure is set up
- ✅ Templates exist in database
- ✅ Manual sending works
- ❌ Automatic triggering is NOT set up

**To Fix:**
1. Add `sendNotification()` calls to your API routes
2. Import from `@/lib/messaging/send-notification`
3. Call after successful events (game win, reward claim, etc.)
4. Test and verify

**Estimated Time:** 30-60 minutes to add to all major events

---

## Need Help?

See these files for examples:
- `/lib/messaging/send-notification.ts` - The main function
- `/app/api/notifications/send/route.ts` - API endpoint example
- `/app/api/staff/send-multi-channel-message/route.ts` - Staff messaging example

Run `CHECK_PUSH_NOTIFICATION_SETUP.sql` to see your current setup.
