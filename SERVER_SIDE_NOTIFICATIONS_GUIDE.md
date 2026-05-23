# Server-Side Automatic Notifications - Best Practice

## Why Server-Side?

✅ **Reliable** - Always runs, even if user closes browser  
✅ **Secure** - Runs with database privileges  
✅ **Real-time** - Triggers immediately when events happen  
✅ **Consistent** - Same logic for all users  
✅ **Can't be bypassed** - User can't disable it  

---

## The Solution: Database Triggers

Database triggers fire **automatically** when data changes, then call your notification API.

### How It Works:

```
User Action → Database Change → Trigger Fires → API Called → Notification Sent
```

**Example:**
1. User wins a game
2. Row inserted into `game_plays` table
3. `on_game_won` trigger fires
4. Calls `/api/notifications/send`
5. Push notification sent to user's device

---

## What's Been Set Up

The migration `20251013_auto_push_notifications.sql` creates automatic notifications for:

### 1. **Game Wins** 🎮
- Triggers when: User wins a game
- Template: `game_won`
- Variables: `beans`, `gameName`

### 2. **Rewards Earned** 🎁
- Triggers when: New reward added to `user_rewards`
- Template: `reward_earned`
- Variables: `rewardName`

### 3. **Milestones Reached** 🏆
- Triggers when: User crosses 100-bean milestones (100, 200, 300, etc.)
- Template: `milestone_reached`
- Variables: `milestone`, `totalBeans`

### 4. **Free Coffee Ready** ☕
- Triggers when: User gets 10th coffee stamp
- Template: `coffee_ready`
- Variables: `stamps`

---

## How to Deploy

### Step 1: Run the Migration

```bash
# Apply the migration
supabase db push
```

Or manually in Supabase SQL Editor:
```sql
-- Copy and run the contents of:
-- supabase/migrations/20251013_auto_push_notifications.sql
```

### Step 2: Verify Triggers Are Created

```sql
-- Check triggers exist
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%notification%';
```

Should show:
- `on_game_won` on `game_plays`
- `on_reward_earned` on `user_rewards`
- `on_milestone_reached` on `points_transactions`
- `on_coffee_ready` on `coffee_stamps`

### Step 3: Test

1. Play a game and win
2. Check if push notification is received
3. Check logs:

```sql
SELECT * FROM push_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## How It Works Internally

### The Helper Function

```sql
notify_user_event(user_id, template_name, variables)
```

This function:
1. Gets `app_url` and `cron_secret` from `app_settings`
2. Makes HTTP POST to `/api/notifications/send`
3. Passes user ID, template name, and variables
4. Handles errors gracefully (doesn't break the transaction)

### Example Trigger

```sql
CREATE TRIGGER on_game_won
  AFTER INSERT ON game_plays
  FOR EACH ROW
  WHEN (NEW.won = true)
  EXECUTE FUNCTION trigger_game_won_notification();
```

This:
- Fires **after** a row is inserted into `game_plays`
- Only when `won = true`
- Calls the notification function
- Runs **server-side** in the database

---

## Adding More Triggers

Want to add notifications for other events?

### Example: Streak Achieved

```sql
CREATE OR REPLACE FUNCTION trigger_streak_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user achieved a streak
  IF NEW.streak_count >= 7 THEN
    PERFORM notify_user_event(
      NEW.user_id,
      'streak_achieved',
      jsonb_build_object(
        'streakDays', NEW.streak_count
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_streak_achieved
  AFTER UPDATE ON user_streaks
  FOR EACH ROW
  WHEN (NEW.streak_count >= 7)
  EXECUTE FUNCTION trigger_streak_notification();
```

---

## Advantages Over Client-Side

| Feature | Server-Side (Triggers) | Client-Side (API Routes) |
|---------|------------------------|--------------------------|
| **Reliability** | ✅ Always runs | ❌ Only if code is called |
| **Real-time** | ✅ Immediate | ⚠️ Depends on implementation |
| **Security** | ✅ Database privileges | ⚠️ API permissions |
| **Consistency** | ✅ Same for all users | ⚠️ Can vary |
| **Maintenance** | ✅ Centralized | ❌ Scattered across routes |
| **Testing** | ✅ Easy to test | ⚠️ Need to test each route |

---

## Monitoring

### Check if triggers are firing:

```sql
-- Check recent notifications sent
SELECT 
  user_id,
  notification_id,
  status,
  created_at
FROM push_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Check for errors:

```sql
-- Check failed notifications
SELECT 
  user_id,
  status,
  error_message,
  created_at
FROM push_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check trigger execution:

Look at Supabase logs for NOTICE messages:
```
Notification queued: game_won for user abc-123
```

---

## Troubleshooting

### Issue 1: Triggers Not Firing

**Check if triggers exist:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%notification%';
```

**Check if pg_net is enabled:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

### Issue 2: Notifications Not Received

**Check push_logs:**
```sql
SELECT * FROM push_logs 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

Look for `status = 'failed'` and check `error_message`.

### Issue 3: Template Not Found

**Check templates exist:**
```sql
SELECT name, active FROM push_notification_templates;
```

Make sure template names match exactly:
- `game_won` (not `game_win`)
- `reward_earned` (not `reward_earned_notification`)

---

## Performance Considerations

### Triggers are Fast ✅
- Execute in milliseconds
- Don't block the main transaction
- Use `AFTER` triggers (not `BEFORE`)

### HTTP Calls are Async ✅
- `net.http_post()` is non-blocking
- Doesn't slow down user actions
- Failures don't break transactions

### Best Practices
- ✅ Use `AFTER` triggers (not `BEFORE`)
- ✅ Use `WHEN` clause to filter (e.g., `WHEN (NEW.won = true)`)
- ✅ Handle errors with `EXCEPTION` blocks
- ✅ Use `RAISE NOTICE` for debugging
- ✅ Keep trigger logic simple

---

## Comparison: Server-Side vs Client-Side

### Server-Side (Database Triggers) - Recommended ✅

**Pros:**
- Automatic and reliable
- Real-time
- Centralized logic
- Can't be bypassed
- Works even if API routes change

**Cons:**
- Requires database migration
- Slightly more complex to set up initially

### Client-Side (API Routes)

**Pros:**
- Easier to understand
- Easier to debug
- More flexible

**Cons:**
- Must remember to add to every route
- Can be forgotten
- Inconsistent if routes change
- Requires code changes for new events

---

## Migration Checklist

- [ ] Run `20251013_auto_push_notifications.sql` migration
- [ ] Verify triggers are created
- [ ] Check `app_url` is correct in `app_settings`
- [ ] Check `cron_secret` is set in `app_settings`
- [ ] Verify pg_net extension is enabled
- [ ] Test by triggering an event (play game, earn reward)
- [ ] Check push_logs for results
- [ ] Verify notification is received on device

---

## Summary

**Best Approach:** Database triggers (server-side) ✅

**Why:**
- Automatic and reliable
- Real-time notifications
- Centralized logic
- Can't be bypassed or forgotten
- Works for all events consistently

**How:**
1. Run the migration: `20251013_auto_push_notifications.sql`
2. Triggers automatically fire when events happen
3. Notifications sent immediately
4. No code changes needed in API routes

**Already Set Up For:**
- Game wins
- Rewards earned
- Milestones (every 100 beans)
- Free coffee ready (10 stamps)

Just run the migration and it works! 🎉
