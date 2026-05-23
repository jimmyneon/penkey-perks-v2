# 🐛 FIX: "Good Morning" Still Showing at Night

**Issue:** Still seeing morning messages at 7:10 PM  
**Root Cause:** Multiple dev servers running + browser cache

---

## 🔍 Problem Found:

You have **2 dev servers running**:
- Process 8843 (started 7:09 PM)
- Process 8636 (started 6:57 PM)

The old server doesn't have the timeOfDay fix!

---

## ✅ Quick Fix:

### Step 1: Kill All Dev Servers
```bash
# Kill both processes
pkill -f "next dev"

# Or kill them individually:
kill 8843
kill 8636
```

### Step 2: Start Fresh Dev Server
```bash
npm run dev
```

### Step 3: Hard Refresh Browser
```
Chrome/Edge: Cmd + Shift + R
Firefox: Cmd + Shift + R
Safari: Cmd + Option + R
```

### Step 4: Verify Fix
1. Open browser console (F12)
2. Go to Network tab
3. Refresh page
4. Look for `/api/notifications/get-for-user` request
5. Check the request payload - should include `"timeOfDay": "evening"`
6. Check response - should NOT be "Good Morning"

---

## 🧪 Test It's Working:

**Current time:** 7:10 PM (19:10)  
**Expected timeOfDay:** `"evening"`  
**Expected notification:** NOT "Good Morning"

**Possible notifications at 7:10 PM:**
- 🎁 Rewards ready (if you have unredeemed rewards)
- 🔥 Streak at risk (if streak >= 7 and not checked in)
- ☕ One more stamp (if 1 stamp away)
- 🎮 Play game (if haven't played today)
- 🌟 All done (if completed all tasks)

**Should NOT see:**
- ❌ ☀️ Good Morning (only 5 AM - 12 PM)
- ❌ ☕ Afternoon Coffee (only 12 PM - 5 PM)

---

## 🔍 Debug If Still Not Working:

### Check 1: Verify timeOfDay is sent
```javascript
// In browser console on dashboard:
// Open Network tab, refresh, find the API call
// Look at the request payload
```

Should see:
```json
{
  "userId": "...",
  "userState": {
    "timeOfDay": "evening",  // ← Should be here!
    "hasCheckedInToday": false,
    ...
  }
}
```

### Check 2: Check what notification is in database
```sql
-- In Supabase SQL Editor:
SELECT id, title, conditions 
FROM notifications 
WHERE active = true 
  AND conditions ? 'timeOfDay'
ORDER BY priority;
```

Should see:
```
| title              | conditions                                    |
|--------------------|-----------------------------------------------|
| Good Morning       | {"hasCheckedInToday": false, "timeOfDay": "morning"} |
| Afternoon Coffee   | {"hasCoffeeStampToday": false, "timeOfDay": "afternoon"} |
```

### Check 3: Test condition matching manually
```sql
-- Test if "Good Morning" matches current state
SELECT match_notification_conditions(
  '{"hasCheckedInToday": false, "timeOfDay": "morning"}'::jsonb,
  '{"hasCheckedInToday": false, "timeOfDay": "evening"}'::jsonb
);
-- Should return: false (doesn't match!)

-- Test if it would match in morning
SELECT match_notification_conditions(
  '{"hasCheckedInToday": false, "timeOfDay": "morning"}'::jsonb,
  '{"hasCheckedInToday": false, "timeOfDay": "morning"}'::jsonb
);
-- Should return: true (matches!)
```

---

## 🎯 If Still Broken After Restart:

### Possibility 1: Using Fallback Logic
The frontend might be falling back to hardcoded logic instead of using database.

**Check browser console for:**
```
Error fetching notification: ...
```

If you see errors, the database function might not be working.

### Possibility 2: Database Function Not Applied
The condition matching migration might not be applied.

**Check if function exists:**
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'match_notification_conditions';
```

If empty, run:
```bash
psql $DATABASE_URL -f supabase/migrations/20251010_improve_notification_conditions.sql
```

### Possibility 3: Hardcoded Fallback Still Active
Check if the fallback is being used:

**In browser console:**
```javascript
// Add this temporarily to notification-banner.tsx line 460:
console.log('Using DB notification:', !!dbNotification)
console.log('Using fallback:', !!fetchError)
console.log('Notification source:', dbNotification ? 'database' : 'fallback')
```

---

## 🚀 Quick Commands:

```bash
# 1. Kill all dev servers
pkill -f "next dev"

# 2. Start fresh
npm run dev

# 3. Open browser
open http://localhost:3000/dashboard

# 4. Hard refresh
# Cmd + Shift + R
```

---

## ✅ Success Criteria:

At 7:10 PM, you should see:
- ✅ NO "Good Morning" message
- ✅ Appropriate evening notification
- ✅ Console shows `timeOfDay: "evening"` in API call
- ✅ Database function returns correct notification

---

**Try the fix now and let me know if you still see "Good Morning"!**
