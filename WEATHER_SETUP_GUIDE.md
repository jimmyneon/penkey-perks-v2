# 🌤️ WEATHER INTEGRATION - SETUP GUIDE

**Location:** Lymington, UK  
**Coordinates:** 50.7594°N, 1.5339°W

---

## 🚀 QUICK SETUP (5 minutes)

### Step 1: Get OpenWeatherMap API Key (FREE)

1. Go to https://openweathermap.org/api
2. Click "Sign Up" (free account)
3. Verify your email
4. Go to "API keys" tab
5. Copy your API key

**Free Tier Includes:**
- 1,000 API calls/day
- Current weather data
- 30-minute cache = ~50 calls/day
- More than enough!

---

### Step 2: Add API Key to Environment

**File:** `.env.local`

```bash
# Add this line:
OPENWEATHER_API_KEY=your_api_key_here
```

**Example:**
```bash
OPENWEATHER_API_KEY=abc123def456ghi789jkl012mno345pq
```

---

### Step 3: Restart Dev Server

```bash
# Kill current server (Ctrl+C)
# Start fresh
npm run dev
```

---

### Step 4: Test It Works

**Open browser console and check:**
```
🌤️ Weather data: {
  weather: "rainy",
  temperature: 12,
  description: "light rain",
  location: "Lymington"
}
```

---

## 📊 WHAT IT DOES

### Weather Conditions Detected:
- **Rainy** - Rain, drizzle
- **Sunny** - Clear skies
- **Cloudy** - Overcast
- **Snowy** - Snow (rare in Lymington!)

### Temperature Ranges:
- **Cold:** < 10°C
- **Mild:** 10-18°C
- **Warm:** > 18°C

### Notifications Added:
1. ☔ **Rainy Morning** - "Come warm up with hot coffee!"
2. ☔ **Rainy Afternoon** - "Rainy day blues? Get a warm drink!"
3. 🥶 **Cold Day** - "Brrr! Warm up with hot drink!"
4. ☀️ **Beautiful Day** - "Perfect for iced coffee!"
5. ❄️ **Snow Day** - "Warm up with hot chocolate!"

---

## 🎯 HOW IT WORKS

### Flow:
```
1. User loads dashboard
   ↓
2. Frontend fetches /api/weather
   ↓
3. API calls OpenWeatherMap for Lymington
   ↓
4. Returns: weather, temperature, description
   ↓
5. Frontend adds to userState
   ↓
6. Server matches weather-based notifications
   ↓
7. Shows relevant message
```

### Caching:
- Weather cached for 30 minutes
- Reduces API calls
- Still fresh enough for notifications

---

## 🧪 TESTING

### Test Rainy Day:
```typescript
// Temporarily override in notification-banner.tsx
const userState = {
  // ... other fields
  weather: 'rainy', // Force rainy
  temperature: 12
}
```

### Test Cold Day:
```typescript
const userState = {
  // ... other fields
  weather: 'cloudy',
  temperature: 5 // Force cold
}
```

### Test Sunny Day:
```typescript
const userState = {
  // ... other fields
  weather: 'sunny',
  temperature: 22 // Force warm
}
```

---

## 📋 WEATHER-BASED NOTIFICATIONS

### Priority 95-100 (Low priority, nice-to-have)

| Priority | Condition | Message |
|----------|-----------|---------|
| 95 | Rainy + Morning | "☔ Come warm up with hot coffee!" |
| 96 | Rainy + Afternoon | "☔ Rainy day blues? Get warm drink!" |
| 97 | Temp < 10°C | "🥶 Brrr! Warm up!" |
| 98 | Sunny + Temp > 18°C | "☀️ Perfect for iced coffee!" |
| 99 | Snowy | "❄️ Snow day! Hot chocolate!" |

### Why Low Priority?
- Weather is nice-to-have
- More urgent notifications (rewards, streaks) show first
- Only shows if no higher priority notifications match

---

## 🔧 CUSTOMIZATION

### Change Location:
```typescript
// In app/api/weather/route.ts
const LYMINGTON_LAT = 50.7594
const LYMINGTON_LON = -1.5339
```

### Add More Weather Conditions:
```sql
-- In ultimate_notifications.sql
INSERT INTO notifications VALUES
('custom', 100, '🌫️ Foggy Day!', 'Foggy morning! Come get a warm drink! ☕', '🌫️',
 '{"weather": "foggy", "hasCoffeeStampToday": false}', 'default', true);
```

### Adjust Temperature Thresholds:
```sql
-- Cold day (change from 10 to 5)
'{"temperature": {"max": 5}, "hasCoffeeStampToday": false}'

-- Hot day (add new)
'{"temperature": {"min": 25}, "hasCoffeeStampToday": false}'
```

---

## 🌍 API DETAILS

### Endpoint:
```
https://api.openweathermap.org/data/2.5/weather
```

### Parameters:
- `lat`: 50.7594 (Lymington latitude)
- `lon`: -1.5339 (Lymington longitude)
- `appid`: Your API key
- `units`: metric (Celsius)

### Response Example:
```json
{
  "weather": [
    {
      "main": "Rain",
      "description": "light rain",
      "icon": "10d"
    }
  ],
  "main": {
    "temp": 12.5,
    "humidity": 80
  },
  "wind": {
    "speed": 5.2
  }
}
```

---

## 💰 COST

### Free Tier:
- **Calls:** 1,000/day
- **Cost:** $0
- **Our Usage:** ~50/day (30-min cache)
- **Overage:** Never (way under limit)

### Paid Tier (if needed):
- **Calls:** Unlimited
- **Cost:** $0.0012 per call
- **Our Usage:** ~$1.80/month
- **Not needed!** Free tier is plenty

---

## 🐛 TROUBLESHOOTING

### Issue: Weather not showing

**Check 1: API key set?**
```bash
echo $OPENWEATHER_API_KEY
```

**Check 2: Server restarted?**
```bash
# Kill and restart
npm run dev
```

**Check 3: Console errors?**
```javascript
// In browser console
// Should see: 🌤️ Weather data: {...}
```

### Issue: Wrong weather

**Check:** API might be delayed
- Weather updates every 10 minutes
- Cache is 30 minutes
- May not be real-time

**Solution:** Wait 30 minutes or clear cache

### Issue: API calls failing

**Check 1: API key valid?**
- Test in browser: `https://api.openweathermap.org/data/2.5/weather?lat=50.7594&lon=-1.5339&appid=YOUR_KEY`

**Check 2: Free tier limit?**
- Check dashboard: https://home.openweathermap.org/api_keys
- Should show calls remaining

---

## 📊 MONITORING

### Check API Usage:
1. Go to https://home.openweathermap.org/
2. Click "Statistics"
3. View calls per day

### Expected Usage:
- **Per user visit:** 1 call (cached 30 min)
- **100 users/day:** ~50 calls (with cache)
- **Free limit:** 1,000 calls/day
- **Headroom:** 20x over capacity

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Sign up for OpenWeatherMap (free)
- [ ] Get API key
- [ ] Add to `.env.local`
- [ ] Add to production environment variables
- [ ] Restart dev server
- [ ] Test weather shows in console
- [ ] Run `20251010_fix_string_matching.sql`
- [ ] Run `20251010_ultimate_notifications.sql`
- [ ] Test rainy day notification
- [ ] Test cold day notification
- [ ] Test sunny day notification
- [ ] Deploy to production
- [ ] Monitor API usage

---

## 🎉 RESULT

### What Users See:

**Rainy Morning (12°C):**
> ☔ **Rainy Morning!**
> It's raining! Come warm up with a hot coffee! Perfect weather for a cozy visit! ☕

**Cold Day (5°C):**
> 🥶 **Brrr! Warm Up!**
> It's freezing outside! Come warm up with a hot drink! ☕🔥

**Beautiful Sunny Day (22°C):**
> ☀️ **Beautiful Day!**
> Gorgeous weather in Lymington! Perfect for an iced coffee! ☕✨

---

## 🚀 READY TO GO!

1. Get API key: https://openweathermap.org/api
2. Add to `.env.local`
3. Restart server
4. Deploy notifications SQL
5. Enjoy weather-based notifications!

**Total setup time: 5 minutes** ⚡
