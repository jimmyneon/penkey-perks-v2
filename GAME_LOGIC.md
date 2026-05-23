# 🎮 DAILY GAME LOGIC

**Updated:** 2025-10-09 16:43:00

---

## 🎯 HOW IT WORKS

### **Daily Game Selection:**
- **One game per day** for all users
- **Randomly selected** based on date (seeded)
- **Same game for everyone** on the same day
- **Changes at midnight**

### **Play Rules:**
- ✅ **No check-in required** - Anyone can play
- ✅ **Once per day** - Can only play once
- ✅ **Independent** - Not tied to visits or stamps
- ✅ **Prizes from database** - Odds & stock limits apply

---

## 🎲 GAME SELECTION ALGORITHM

```typescript
// Seed based on today's date
const today = new Date().toDateString()
const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

// Select game from available games
const dailyGame = games[seed % games.length]
```

**Result:** Same game for everyone on the same day, but changes daily!

---

## 🏆 PRIZES & ODDS

### **Prize Categories:**
Defined in `game_prizes` table:

| Category | Examples | Probability | Stock Limit |
|----------|----------|-------------|-------------|
| **Food** | Bacon bap, pastry | 10% | 5 per day |
| **Drink** | Latte, cappuccino | 15% | 10 per day |
| **Points** | 5-20 bonus points | 25% | Unlimited |
| **Stamps** | 1-3 coffee stamps | 20% | Unlimited |
| **Nothing** | Try again tomorrow | 30% | Unlimited |

### **Stock Management:**
- Admin sets daily limits
- Stock resets at midnight
- When limit reached, prize unavailable
- Prevents over-giving

---

## 📊 PRIZE DISTRIBUTION

### **How Prizes Are Awarded:**

1. **User plays game**
2. **System calls** `play_game_enhanced(user_id, game_id)`
3. **Function checks:**
   - Has user played today? (No → Continue)
   - Are there prizes with stock? (Yes → Continue)
4. **Random selection** based on probability
5. **Award prize:**
   - **Food/Drink** → Create instant voucher
   - **Points** → Add to balance
   - **Stamps** → Add to stamp card
   - **Nothing** → Better luck tomorrow!
6. **Decrement stock** (if applicable)

---

## 🎮 AVAILABLE GAMES

### **Current Games:**
1. **Scratch Card** - Scratch to reveal prize
2. **Spin Wheel** - Spin to win
3. **Duck Pond** - Pick a duck

### **Game Properties:**
```typescript
{
  id: string
  name: string
  display_name: string
  description: string
  icon: string
  enabled: boolean
}
```

---

## 🔄 DAILY ROTATION

### **Example Week:**

| Day | Game | Why |
|-----|------|-----|
| Monday | Scratch Card | seed % 3 = 0 |
| Tuesday | Spin Wheel | seed % 3 = 1 |
| Wednesday | Duck Pond | seed % 3 = 2 |
| Thursday | Scratch Card | seed % 3 = 0 |
| Friday | Spin Wheel | seed % 3 = 1 |
| Saturday | Duck Pond | seed % 3 = 2 |
| Sunday | Scratch Card | seed % 3 = 0 |

**Pattern:** Rotates through available games based on date

---

## 🎯 USER EXPERIENCE

### **First Visit Today:**
```
Dashboard shows:
┌─────────────────────────────────┐
│  🎮 Daily Game                   │
│  Today: Scratch Card             │
│  Play once per day to win!       │
│  [Play Now]                      │
└─────────────────────────────────┘
```

### **After Playing:**
```
Dashboard shows:
┌─────────────────────────────────┐
│  🎮 Daily Game                   │
│  Today: Scratch Card             │
│  ✅ You've played today!         │
│  Come back tomorrow!             │
└─────────────────────────────────┘
```

---

## 🔐 ANTI-CHEAT MEASURES

### **Prevents:**
- ✅ Playing multiple times per day
- ✅ Manipulating odds
- ✅ Exceeding stock limits
- ✅ Getting unavailable prizes

### **How:**
- Database function handles all logic
- Server-side validation
- Stock tracking
- Play history logged

---

## 📈 ADMIN CONTROLS

### **Admins Can:**
1. **Enable/disable games**
2. **Set prize probabilities**
3. **Set daily stock limits**
4. **View prize distribution stats**
5. **Reset stock manually**

### **Example Configuration:**
```sql
-- Set bacon bap to 10% chance, 5 per day
UPDATE game_prizes 
SET probability = 0.10, stock_limit = 5
WHERE prize_type = 'food' AND prize_value = 'Bacon Bap';
```

---

## 🎲 PROBABILITY MATH

### **How It Works:**
```
Total probability must = 100%

Example:
- Food: 10%
- Drink: 15%
- Points: 25%
- Stamps: 20%
- Nothing: 30%
Total: 100% ✅
```

### **Random Selection:**
```typescript
// Generate random number 0-100
const random = Math.random() * 100

// Check ranges:
if (random < 10) return 'Food'
else if (random < 25) return 'Drink'  // 10 + 15
else if (random < 50) return 'Points' // 25 + 25
else if (random < 70) return 'Stamps' // 50 + 20
else return 'Nothing'                  // 70 + 30
```

---

## 🚀 BENEFITS

### **For Customers:**
- ✅ Fun daily activity
- ✅ Chance to win prizes
- ✅ No pressure (no check-in needed)
- ✅ Fair odds
- ✅ Something new each day

### **For Business:**
- ✅ Daily engagement
- ✅ Controlled costs (stock limits)
- ✅ Flexible configuration
- ✅ Analytics on play rates
- ✅ Drives app usage

---

## 📊 TRACKING & ANALYTICS

### **Data Collected:**
- Games played per day
- Prize distribution
- Win rates
- Stock usage
- User engagement

### **Queries:**
```sql
-- Today's game plays
SELECT COUNT(*) FROM game_plays 
WHERE created_at >= CURRENT_DATE;

-- Prize distribution
SELECT prize_type, COUNT(*) 
FROM game_plays 
WHERE created_at >= CURRENT_DATE
GROUP BY prize_type;

-- Stock remaining
SELECT prize_type, stock_limit - stock_used as remaining
FROM game_prizes;
```

---

## 🔄 MIDNIGHT RESET

### **Automatic Reset:**
- Stock counters reset to 0
- New game selected
- Play history preserved
- Users can play again

### **Cron Job (TODO):**
```sql
-- Reset daily stock at midnight
CREATE OR REPLACE FUNCTION reset_daily_game_stock()
RETURNS void AS $$
BEGIN
  UPDATE game_prizes SET stock_used = 0;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron or external service
```

---

## 🎯 SUMMARY

**Key Points:**
- 🎮 One game per day (same for everyone)
- 🎲 Random prizes based on odds
- 📊 Stock limits prevent over-giving
- ✅ No check-in required
- 🔄 Resets at midnight
- 🎁 Instant prizes awarded

**User Flow:**
1. Open app
2. See today's game
3. Play (if haven't played)
4. Win prize or try tomorrow
5. Come back next day for new game

---

**Simple, fair, and fun!** 🎉
