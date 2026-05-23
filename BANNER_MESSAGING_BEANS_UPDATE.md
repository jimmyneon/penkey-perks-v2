# 🫘 Banner Messaging System - Beans Update Complete!

**Date:** October 11, 2025  
**Status:** ✅ Ready to Deploy

---

## 🎯 What Was Updated

### 1. ✅ All Notifications Updated for Beans System

**Changed from "points" to "beans":**
- ❌ "Check in and earn 5 points"
- ✅ "Check in and earn 50 beans"

**Updated bean values:**
- Daily check-in: **50 beans** (was 5 points)
- 7-day streak: **200 beans** (was 10 points)
- 14-day streak: **500 beans** (NEW!)
- 30-day streak: **1,500 beans** (was 50 points)
- Game wins: **250 beans** (was 5-50 points)
- Signup bonus: **250 beans + free coffee** (was 10 points)

### 2. ✅ Coffee Stamps Terminology

All notifications now correctly reference:
- "Coffee stamps" (not generic stamps)
- "Free coffee" rewards
- "One more coffee stamp" messaging

### 3. ✅ Weather Notifications FIXED

**Problem:** Weather notifications weren't showing up

**Root Cause:**
1. Weather API was working but conditions weren't matching
2. Missing logging to debug weather data
3. Condition matching was too strict

**Solution:**
1. Added debug logging to weather API
2. Simplified weather condition matching
3. Created separate notifications for each weather type
4. Fixed temperature-based notifications

**New Weather Notifications:**
- ☔ Rainy morning/afternoon
- ☀️ Sunny morning
- ☁️ Cloudy day
- 🥶 Cold weather (< 10°C)

---

## 📁 Files Changed

### 1. Database Migration
**File:** `supabase/migrations/20251011_update_notifications_for_beans.sql`

**What it does:**
- Deactivates all old notifications
- Inserts 30+ new notifications with beans terminology
- Fixes weather condition matching
- Updates all priority levels

### 2. Weather API Enhancement
**File:** `app/api/weather/route.ts`

**Changes:**
- Added debug logging
- Fixed temperature path (`data.main.temp`)
- Added "sun" to sunny condition check
- Logs weather condition mapping

---

## 🚀 How to Deploy

### Step 1: Run the Migration

```bash
# Connect to Supabase
cd /Users/johnhopwood/penkeygameapp

# Run migration
npx supabase db push
```

Or run directly in Supabase SQL Editor:
```sql
-- Copy contents of:
-- supabase/migrations/20251011_update_notifications_for_beans.sql
```

### Step 2: Verify Notifications

```sql
-- Check active notifications
SELECT 
  priority,
  type,
  title,
  conditions,
  active
FROM public.notifications
WHERE active = true
ORDER BY priority;

-- Should show 30+ active notifications
```

### Step 3: Test Weather API

```bash
# Test weather endpoint
curl http://localhost:3000/api/weather

# Should return:
# {
#   "weather": "rainy" | "sunny" | "cloudy" | "snowy",
#   "temperature": 12,
#   "description": "light rain",
#   ...
# }
```

### Step 4: Clear Notification Cache

Users may have cached old notifications. Clear on next visit:

```typescript
// Notification cache is in sessionStorage
// Key: `notifications-${userId}-${hasCheckedInToday}-${hasUnredeemedRewards}`
// Automatically expires after 5 minutes
```

---

## 🧪 Testing Checklist

### Test Beans Messaging

- [ ] Check-in notification shows "50 beans"
- [ ] Streak notifications show correct bean amounts
- [ ] Welcome message shows "250 beans + free coffee"
- [ ] Game notifications mention "beans"
- [ ] All "points" references removed

### Test Coffee Stamps

- [ ] "One more coffee stamp" notification appears
- [ ] Coffee stamp reminders show correctly
- [ ] No generic "stamp" references

### Test Weather Notifications

- [ ] Weather API returns valid data
- [ ] Rainy day notification appears when raining
- [ ] Sunny notification appears on clear days
- [ ] Cold weather notification appears when < 10°C
- [ ] Weather conditions log to console

### Test Priority System

- [ ] Urgent rewards (< 3 hours) show first
- [ ] Streak at risk shows before check-in
- [ ] One stamp away shows high priority
- [ ] Weather messages don't override urgent ones

---

## 📊 New Notification Priorities

| Priority | Type | Example |
|----------|------|---------|
| 1-7 | Rewards | Expiring rewards (urgent → general) |
| 8 | Streak | Streak at risk (7+ days) |
| 9 | Stamps | One coffee stamp away |
| 10-13 | Check-in | Time-based check-in reminders |
| 21-22 | Stamps | Coffee stamp reminders |
| 31-32 | Games | Game reminders |
| 41-43 | Milestones | Streak achievements |
| 51-55 | Weather | Weather-based messages |
| 61-63 | Complete | All done messages |
| 71 | Welcome | New user welcome |
| 81 | Closed | Night-time closed message |

---

## 🐛 Weather Notification Debugging

If weather notifications still don't appear:

### 1. Check Weather API

```bash
# In browser console or terminal
fetch('/api/weather')
  .then(r => r.json())
  .then(console.log)

# Should show:
# {
#   weather: "rainy",
#   temperature: 12,
#   ...
# }
```

### 2. Check User State

```javascript
// In notification-banner.tsx, check console logs:
// "🌤️ Weather data fetched and cached: {...}"
// "🔍 User state sent: { weather: 'rainy', ... }"
```

### 3. Check Condition Matching

```javascript
// In get-for-user API, check console logs:
// "🎯 Notification matching: { matched: 3, ... }"
// "matchedTitles: ['☔ Rainy Morning!', ...]"
```

### 4. Verify OPENWEATHER_API_KEY

```bash
# Check environment variable is set
echo $OPENWEATHER_API_KEY

# Or in Vercel/Supabase dashboard
# Settings → Environment Variables
```

---

## 🎨 Notification Examples

### Beans System

**Morning Check-in:**
```
☀️ Good Morning!
Start your day with us! Check in and earn 50 beans! ✨
```

**7-Day Streak:**
```
⭐ 7-Day Streak!
One week strong! You earned 200 beans! You're on fire! 🔥
```

**Welcome Message:**
```
👋 Welcome to Penkey!
So excited to have you here! You got 250 beans + free coffee! 
Check in, play games, and earn more! 💕
```

### Coffee Stamps

**One Away:**
```
🎊 ONE MORE STAMP!!!
Eeeek! Just ONE more coffee stamp for FREE COFFEE! 
You HAVE to come in today! 💕
```

**Morning Reminder:**
```
☕ Morning Coffee?
Grab your morning coffee and don't forget your stamp! ✨
```

### Weather

**Rainy Morning:**
```
☔ Rainy Morning!
It's raining! Come warm up with a hot coffee! 
Perfect weather for a cozy visit! ☕
```

**Cold Day:**
```
🥶 Brr! It's Cold!
Bundle up! Come warm up with a hot coffee! 
We'll keep you cozy! ☕🔥
```

---

## 🔍 Troubleshooting

### Issue: Old "points" still showing

**Solution:**
1. Clear browser cache
2. Clear sessionStorage: `sessionStorage.clear()`
3. Wait 5 minutes for cache to expire
4. Hard refresh (Cmd+Shift+R)

### Issue: Weather notifications never appear

**Checklist:**
- [ ] OPENWEATHER_API_KEY is set
- [ ] Weather API returns valid data
- [ ] User state includes weather field
- [ ] No higher priority notifications blocking
- [ ] Weather condition matches exactly ("rainy", "sunny", etc.)

**Debug:**
```javascript
// Check weather in user state
console.log(userState.weather) // Should be: rainy, sunny, cloudy, snowy

// Check notifications matched
console.log(matchingNotifications.filter(n => n.conditions?.weather))
```

### Issue: Too many notifications rotating

**Expected:** Top 3 diverse notifications rotate every 10 seconds

**If seeing duplicates:**
- Check `filterDuplicateTypes()` in `get-for-user/route.ts`
- Should only return one of each type (time, weather, rewards, etc.)

---

## ✅ Success Criteria

After deployment, verify:

1. **Beans Terminology**
   - ✅ All notifications use "beans" not "points"
   - ✅ Bean amounts match new system (50, 200, 500, 1500)
   - ✅ Signup bonus shows "250 beans + free coffee"

2. **Coffee Stamps**
   - ✅ All stamp references are "coffee stamps"
   - ✅ "One more stamp" notification works
   - ✅ No generic "stamp" terminology

3. **Weather Integration**
   - ✅ Weather API returns data
   - ✅ Weather notifications appear when conditions match
   - ✅ Weather doesn't override urgent notifications
   - ✅ Only one weather notification shows at a time

4. **Priority System**
   - ✅ Urgent rewards show first
   - ✅ Streak at risk shows before general check-in
   - ✅ Up to 3 notifications rotate
   - ✅ No duplicate types in rotation

---

## 📚 Related Documentation

- **Database Schema:** `database_map.md`
- **Beans Migration:** `BEANS_MIGRATION_COMPLETE.md`
- **Notification Logic:** `NOTIFICATION_BANNER_LOGIC.md`
- **Weather Integration:** `WEATHER_INTEGRATION_COMPLETE.md`

---

## 🎯 Next Steps

### Immediate (After Deployment)

1. **Monitor Logs**
   - Watch for weather API errors
   - Check notification matching logs
   - Verify bean amounts display correctly

2. **User Testing**
   - Test on different weather conditions
   - Verify all time-of-day messages
   - Check coffee stamp notifications

3. **Analytics**
   - Track which notifications get most clicks
   - Monitor dismissal rates
   - Check weather notification engagement

### Future Enhancements

1. **More Weather Conditions**
   - Foggy day messages
   - Windy day messages
   - Extreme temperature alerts

2. **Seasonal Messages**
   - Holiday greetings
   - Seasonal drink promotions
   - Special event announcements

3. **Personalization**
   - User's favorite drink reminders
   - Birthday messages
   - Anniversary celebrations

---

**Status:** ✅ Ready to deploy!  
**Migration File:** `supabase/migrations/20251011_update_notifications_for_beans.sql`  
**Estimated Deploy Time:** 2 minutes  
**Risk Level:** Low (only updates notifications, no schema changes)

---

**End of Documentation**
