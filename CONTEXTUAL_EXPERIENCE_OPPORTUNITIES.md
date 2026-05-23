# 🌦️ Contextual Experience Opportunities

**Date:** October 14, 2025  
**Goal:** Use weather, time, location, and other context to create amazing customer experiences

---

## 🎯 Currently Implemented

✅ Weather-based messages (coffee card)  
✅ Time-based messages (morning, afternoon, evening)  
✅ Location-based messages (at Penkey, nearby, away)  
✅ Weather visual effects (rain, snow, sun)  
✅ Animated gradients based on context  

---

## 🚀 New Opportunities

### 1. Weather-Based Product Recommendations ⭐⭐⭐

**Idea:** Suggest different products based on weather

#### Rainy Day Specials:
```typescript
// Show in a special card or banner
{weather?.weather === 'rain' && (
  <Card className="border-blue-300 bg-blue-50">
    <CardHeader>
      <CardTitle>🌧️ Rainy Day Specials</CardTitle>
      <CardDescription>
        Perfect weather for our hot drinks!
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span>☕ Hot Chocolate</span>
          <Badge>+2 bonus points</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>🍵 Hot Tea</span>
          <Badge>+2 bonus points</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>🥐 Fresh Pastries</span>
          <Badge>Perfect pairing!</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

#### Hot Day Specials:
```typescript
{weather?.temperature > 25 && (
  <Card className="border-orange-300 bg-orange-50">
    <CardTitle>🌡️ Beat the Heat!</CardTitle>
    <CardContent>
      - 🧊 Iced Coffee
      - 🥤 Cold Brew
      - 🍦 Ice Cream
    </CardContent>
  </Card>
)}
```

#### Cold Day Specials:
```typescript
{weather?.temperature < 10 && (
  <Card className="border-blue-300 bg-blue-50">
    <CardTitle>❄️ Warm Up Specials</CardTitle>
    <CardContent>
      - ☕ Extra Hot Latte
      - 🍲 Soup of the Day
      - 🥐 Fresh Baked Goods
    </CardContent>
  </Card>
)}
```

---

### 2. Dynamic Bonus Points System ⭐⭐⭐

**Idea:** Award bonus points based on weather conditions

```sql
-- Add to database
CREATE TABLE weather_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_condition TEXT NOT NULL, -- 'rain', 'snow', 'hot', 'cold'
  bonus_points INTEGER NOT NULL,
  bonus_message TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO weather_bonuses (weather_condition, bonus_points, bonus_message) VALUES
('rain', 5, '🌧️ Rainy day bonus! +5 points for braving the weather!'),
('snow', 10, '❄️ Snow day bonus! +10 points for coming out in the snow!'),
('hot', 3, '🌡️ Hot day bonus! +3 points for beating the heat!'),
('cold', 5, '🥶 Cold day bonus! +5 points for braving the cold!');
```

**Implementation:**
```typescript
// In check-in logic
const weatherBonus = getWeatherBonus(weather)
if (weatherBonus) {
  await awardPoints(userId, weatherBonus.points)
  toast({
    title: weatherBonus.message,
    description: `You earned ${weatherBonus.points} bonus points!`
  })
}
```

---

### 3. Weather-Based Game Themes ⭐⭐

**Idea:** Change game appearance/prizes based on weather

```typescript
// Rainy day game
{weather?.weather === 'rain' && (
  <GameCard
    theme="rainy"
    specialPrizes={[
      { name: 'Umbrella Discount', chance: 0.1 },
      { name: 'Hot Drink Upgrade', chance: 0.2 }
    ]}
  />
)}

// Sunny day game
{weather?.weather === 'clear' && (
  <GameCard
    theme="sunny"
    specialPrizes={[
      { name: 'Iced Coffee Free', chance: 0.1 },
      { name: 'Outdoor Seating Priority', chance: 0.15 }
    ]}
  />
)}
```

---

### 4. Time-Based Promotions ⭐⭐⭐

**Idea:** Different offers at different times

#### Morning Rush (7-9am):
```typescript
{timeOfDay === 'morning' && hour >= 7 && hour < 9 && (
  <Card className="border-yellow-300 bg-yellow-50">
    <CardTitle>☀️ Morning Rush Special</CardTitle>
    <CardDescription>
      Quick service + bonus points during morning rush!
    </CardDescription>
    <Badge>+3 points for check-in before 9am</Badge>
  </Card>
)}
```

#### Lunch Time (12-2pm):
```typescript
{hour >= 12 && hour < 14 && (
  <Card>
    <CardTitle>🍽️ Lunch Combo Deal</CardTitle>
    <CardDescription>
      Coffee + Sandwich = Double points!
    </CardDescription>
  </Card>
)}
```

#### Afternoon Slump (2-4pm):
```typescript
{hour >= 14 && hour < 16 && (
  <Card>
    <CardTitle>⏰ Afternoon Pick-Me-Up</CardTitle>
    <CardDescription>
      Free cookie with any coffee 2-4pm!
    </CardDescription>
  </Card>
)}
```

#### Happy Hour (4-6pm):
```typescript
{hour >= 16 && hour < 18 && (
  <Card>
    <CardTitle>🎉 Happy Hour</CardTitle>
    <CardDescription>
      All iced drinks 20% off + bonus stamp!
    </CardDescription>
  </Card>
)}
```

---

### 5. Location-Based Offers ⭐⭐⭐

**Idea:** Special offers when user is nearby

#### Very Close (<50m):
```typescript
{distance < 50 && (
  <Card className="border-green-300 bg-green-50 animate-pulse">
    <CardTitle>👀 We See You!</CardTitle>
    <CardDescription>
      Show this screen in the next 5 minutes for a free upgrade!
    </CardDescription>
    <Countdown duration={300} /> {/* 5 minutes */}
  </Card>
)}
```

#### First Time Nearby:
```typescript
{isNear && !hasVisitedBefore && (
  <Card>
    <CardTitle>👋 Welcome to the Neighborhood!</CardTitle>
    <CardDescription>
      First visit bonus: 10 points + free pastry!
    </CardDescription>
  </Card>
)}
```

---

### 6. Seasonal Campaigns ⭐⭐

**Idea:** Automatic seasonal promotions

```sql
-- Seasonal promotions table
CREATE TABLE seasonal_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season TEXT NOT NULL, -- 'spring', 'summer', 'autumn', 'winter'
  month_start INTEGER, -- 1-12
  month_end INTEGER,
  promotion_title TEXT,
  promotion_message TEXT,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
  active BOOLEAN DEFAULT true
);

INSERT INTO seasonal_promotions (season, month_start, month_end, promotion_title, promotion_message, bonus_multiplier) VALUES
('winter', 12, 2, '❄️ Winter Warmers', 'Double points on all hot drinks!', 2.0),
('spring', 3, 5, '🌸 Spring Fresh', 'New seasonal menu + bonus stamps!', 1.5),
('summer', 6, 8, '☀️ Summer Vibes', 'Iced drinks get extra points!', 1.5),
('autumn', 9, 11, '🍂 Autumn Treats', 'Pumpkin spice season + bonuses!', 1.5);
```

---

### 7. Event-Based Notifications ⭐⭐⭐

**Idea:** Notify users about special events

#### Local Events:
```typescript
// Check if there's a local event nearby
{localEvent && (
  <Card className="border-purple-300 bg-purple-50">
    <CardTitle>🎪 {localEvent.name}</CardTitle>
    <CardDescription>
      Event nearby! Stop by Penkey before or after!
    </CardDescription>
    <Badge>Show event ticket for 20% off</Badge>
  </Card>
)}
```

#### Busy Times Alert:
```typescript
{currentCapacity > 80 && (
  <Card className="border-orange-300 bg-orange-50">
    <CardTitle>⚠️ We're Busy!</CardTitle>
    <CardDescription>
      Current wait: ~10 minutes. Order ahead for priority service!
    </CardDescription>
    <Button>Order Ahead</Button>
  </Card>
)}
```

#### Quiet Times Incentive:
```typescript
{currentCapacity < 30 && hour >= 14 && hour < 16 && (
  <Card className="border-green-300 bg-green-50">
    <CardTitle>✨ Quiet Time Bonus</CardTitle>
    <CardDescription>
      It's quiet now! Come in for instant service + bonus points!
    </CardDescription>
  </Card>
)}
```

---

### 8. Streak Weather Challenges ⭐⭐

**Idea:** Special challenges based on weather

```typescript
// Rainy week challenge
{consecutiveRainyDays >= 3 && (
  <Card className="border-blue-300 bg-blue-50">
    <CardTitle>🌧️ Rainy Week Warrior</CardTitle>
    <CardDescription>
      Visit us 5 rainy days in a row for a FREE coffee!
    </CardDescription>
    <Progress value={(rainyVisits / 5) * 100} />
    <p>{rainyVisits}/5 rainy day visits</p>
  </Card>
)}

// Heatwave challenge
{temperature > 30 && consecutiveHotDays >= 3 && (
  <Card className="border-orange-300 bg-orange-50">
    <CardTitle>🔥 Heatwave Hero</CardTitle>
    <CardDescription>
      Beat the heat! Visit during the heatwave for triple points!
    </CardDescription>
  </Card>
)}
```

---

### 9. Personalized Weather Preferences ⭐⭐

**Idea:** Learn user preferences and suggest accordingly

```sql
-- User weather preferences
CREATE TABLE user_weather_preferences (
  user_id UUID REFERENCES users(id),
  favorite_weather TEXT, -- learned from visit patterns
  favorite_drink_rainy TEXT,
  favorite_drink_sunny TEXT,
  favorite_drink_cold TEXT,
  prefers_indoor BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Usage:**
```typescript
// Personalized suggestion
{weather?.weather === 'rain' && userPreferences?.favorite_drink_rainy && (
  <Card>
    <CardTitle>☕ Your Usual Rainy Day Order?</CardTitle>
    <CardDescription>
      We noticed you love {userPreferences.favorite_drink_rainy} on rainy days!
    </CardDescription>
    <Button>Quick Order</Button>
  </Card>
)}
```

---

### 10. Weather Forecast Integration ⭐⭐⭐

**Idea:** Use forecast to plan ahead

```typescript
// Tomorrow's weather
{tomorrowWeather?.weather === 'rain' && (
  <Card className="border-blue-200 bg-blue-50">
    <CardTitle>🌧️ Rain Tomorrow!</CardTitle>
    <CardDescription>
      Grab an umbrella! We'll have hot drinks ready ☕
    </CardDescription>
    <Badge>Pre-order for tomorrow</Badge>
  </Card>
)}

// Weekend forecast
{weekendWeather?.weather === 'clear' && (
  <Card>
    <CardTitle>☀️ Sunny Weekend Ahead!</CardTitle>
    <CardDescription>
      Perfect for our outdoor seating! Book a table?
    </CardDescription>
  </Card>
)}
```

---

### 11. Social Sharing Weather Moments ⭐

**Idea:** Encourage sharing based on weather

```typescript
{weather?.weather === 'snow' && (
  <Card>
    <CardTitle>❄️ Snowy Day at Penkey!</CardTitle>
    <CardDescription>
      Share a photo with #PenkeySnowDay for bonus points!
    </CardDescription>
    <Button>Share on Social</Button>
  </Card>
)}

{weather?.weather === 'clear' && temperature > 25 && (
  <Card>
    <CardTitle>☀️ Perfect Day!</CardTitle>
    <CardDescription>
      Share your Penkey moment! #PenkeySunshine
    </CardDescription>
  </Card>
)}
```

---

### 12. Weather-Based Inventory Alerts ⭐⭐

**Idea:** Alert customers about popular items

```typescript
// Staff can mark items as "selling fast"
{weather?.weather === 'rain' && hotChocolateStock < 10 && (
  <Card className="border-yellow-300 bg-yellow-50">
    <CardTitle>⚠️ Hot Chocolate Running Low!</CardTitle>
    <CardDescription>
      Popular on rainy days! Get yours before we run out!
    </CardDescription>
  </Card>
)}
```

---

### 13. Commute Time Integration ⭐⭐

**Idea:** Use time + location for commuter offers

```typescript
// Morning commute (7-9am, nearby)
{hour >= 7 && hour < 9 && isNear && (
  <Card>
    <CardTitle>🚶 Morning Commute Special</CardTitle>
    <CardDescription>
      Grab & go! Quick service + travel cup discount
    </CardDescription>
    <Badge>Ready in 2 minutes</Badge>
  </Card>
)}

// Evening commute (5-7pm, nearby)
{hour >= 17 && hour < 19 && isNear && (
  <Card>
    <CardTitle>🏠 Heading Home?</CardTitle>
    <CardDescription>
      Take-away discount + bonus points for commuters!
    </CardDescription>
  </Card>
)}
```

---

### 14. Birthday Weather Surprise ⭐⭐⭐

**Idea:** Combine birthday with weather

```typescript
{isBirthday && weather?.weather === 'rain' && (
  <Card className="border-pink-300 bg-pink-50">
    <CardTitle>🎂 Birthday + Rainy Day!</CardTitle>
    <CardDescription>
      Double celebration! Free birthday drink + rainy day bonus!
    </CardDescription>
    <Confetti />
  </Card>
)}

{isBirthday && weather?.weather === 'clear' && (
  <Card>
    <CardTitle>🎉 Sunny Birthday!</CardTitle>
    <CardDescription>
      Perfect birthday weather! Outdoor seating reserved for you!
    </CardDescription>
  </Card>
)}
```

---

### 15. Air Quality Alerts ⭐

**Idea:** Show air quality and indoor seating benefits

```typescript
{airQuality === 'poor' && (
  <Card className="border-gray-300 bg-gray-50">
    <CardTitle>😷 Air Quality Alert</CardTitle>
    <CardDescription>
      Poor air quality outside. Enjoy our filtered indoor seating!
    </CardDescription>
    <Badge>Clean air inside</Badge>
  </Card>
)}
```

---

## 🎯 Implementation Priority

### Quick Wins (1-2 hours):
1. ✅ Weather-based product recommendations
2. ✅ Time-based promotions (morning rush, lunch, happy hour)
3. ✅ Location-based instant offers
4. ✅ Busy/quiet time alerts

### Medium Effort (4-6 hours):
5. ✅ Dynamic bonus points system
6. ✅ Weather forecast integration
7. ✅ Seasonal campaigns
8. ✅ Weather challenges/streaks

### Advanced (8+ hours):
9. ✅ Personalized weather preferences
10. ✅ Event-based notifications
11. ✅ Social sharing integration
12. ✅ Inventory alerts

---

## 📊 Data You'll Need

### Weather API (Already Have):
- Current weather
- Temperature
- Forecast (add this)

### Location API (Already Have):
- Distance from Penkey
- User location

### New Data Sources:
- **Time zones** - For accurate time-based offers
- **Local events** - Calendar API or manual entry
- **Capacity tracking** - Real-time customer count
- **Air quality** - AQI API
- **Sunrise/sunset** - For "golden hour" promotions

---

## 🎨 Example: Complete Weather Experience

```typescript
// Weather-aware dashboard
export function WeatherAwareDashboard({ weather, location, time }) {
  return (
    <>
      {/* Weather-based product recommendations */}
      <WeatherProductCard weather={weather} />
      
      {/* Time-based promotions */}
      <TimeBasedOffers time={time} />
      
      {/* Location-based instant offers */}
      {location.distance < 50 && <InstantOffer />}
      
      {/* Weather bonus points */}
      {weather.condition === 'rain' && <RainyDayBonus />}
      
      {/* Forecast preview */}
      <WeatherForecast tomorrow={forecast.tomorrow} />
      
      {/* Personalized suggestions */}
      <PersonalizedWeatherSuggestion 
        weather={weather} 
        userPreferences={preferences} 
      />
    </>
  )
}
```

---

## 🚀 Next Steps

1. **Choose 2-3 quick wins** to implement first
2. **Test with real weather data** in different conditions
3. **Track engagement metrics** (clicks, conversions)
4. **Iterate based on data** - what works best?
5. **Add more advanced features** over time

---

**The key is to make weather/context feel magical, not gimmicky!** 🌟

Every feature should:
- ✅ Add real value to the customer
- ✅ Feel natural and helpful
- ✅ Be easy to understand
- ✅ Increase engagement/visits

---

**Ready to make Penkey the most context-aware café in Lymington!** ☕🌦️✨
