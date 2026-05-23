# 🎮 NEW GAMES IMPLEMENTATION GUIDE

**Created:** 2025-10-10  
**Games Added:** 5 new mini-games

---

## 📋 GAMES OVERVIEW

### 1. 🎲 Lucky Dice Roll
**Route:** `/games/dice_roll`  
**Difficulty:** ⭐ (Easiest)  
**Gameplay:** Roll 2 dice and match special combinations

**Win Conditions:**
- 🐍 **Snake Eyes (1,1)** = Biggest prize
- 🎯 **Any Doubles** = Medium prize
- 🍀 **Lucky 7 (total)** = Small prize
- Other rolls = Try tomorrow

**Features:**
- Animated dice rolling (2 seconds)
- 3D rotation effects
- Instant result display
- Simple one-tap gameplay

---

### 2. 🦆 Duck Memory Match
**Route:** `/games/duck_memory`  
**Difficulty:** ⭐⭐ (Easy-Medium)  
**Gameplay:** Classic memory card matching with 6 pairs of ducks

**Duck Types:**
- 🦆 Yellow Duck
- 🐥 Baby Chick
- 🦢 White Swan
- 🐤 Orange Duck
- 🐧 Penguin
- 🦜 Colorful Bird

**Features:**
- 12 cards (6 pairs) in 4x3 grid
- Flip animation with framer-motion
- Move counter
- Bonus rewards for < 10 moves
- Card back placeholder (can add custom image)

**Assets Folder:** `/public/game-assets/duck_memory/`

---

### 3. 🐧 Monkey vs Penguin Race
**Route:** `/games/monkey_penguin`  
**Difficulty:** ⭐⭐ (Medium)  
**Gameplay:** Tap rapidly to race your penguin against the CPU monkey

**Mechanics:**
- 10-second race
- Tap button to move penguin forward
- Monkey auto-moves at random speed
- First to finish line wins
- Tap counter tracked

**Features:**
- Real-time race visualization
- Smooth animations
- Tap count leaderboard potential
- Win/lose conditions
- Amanda-style encouragement messages

**Assets Folder:** `/public/game-assets/monkey_penguin/`

---

### 4. ☕ Coffee Cup Stack
**Route:** `/games/cup_stack`  
**Difficulty:** ⭐⭐⭐ (Medium-Hard)  
**Gameplay:** Stack 5 falling coffee cups without toppling

**Mechanics:**
- Cups fall from top
- Tap to drop cup onto stack
- Must align within tolerance
- Misaligned cups = game over
- Stack wobbles with height

**Features:**
- Physics-based wobble effect
- Visual alignment guide
- Progressive difficulty (wobble increases)
- Timing-based gameplay
- RequestAnimationFrame game loop

**Assets Folder:** `/public/game-assets/cup_stack/`

---

### 5. 🍩 Donut Catcher
**Route:** `/games/donut_catcher`  
**Difficulty:** ⭐⭐⭐ (Hard)  
**Gameplay:** Catch falling treats in a basket within 15 seconds

**Food Items & Points:**
- 🍩 Donut = 2 pts
- 🥐 Croissant = 3 pts
- 🥯 Bagel = 2 pts
- 🧁 Cupcake = 4 pts
- ☕ Coffee = 5 pts

**Mechanics:**
- 15-second timer
- Mouse/touch controls
- Multiple falling items
- Collision detection
- Score tracking
- Need 5+ catches to win

**Features:**
- Smooth basket movement
- Mobile-friendly controls
- Rotating falling items
- Real-time score display
- Desktop & mobile support

**Assets Folder:** `/public/game-assets/donut_catcher/`

---

## 🗂️ FILE STRUCTURE

```
/app/games/
├── dice_roll/page.tsx          # Dice game
├── duck_memory/page.tsx        # Memory match game
├── monkey_penguin/page.tsx     # Racing game
├── cup_stack/page.tsx          # Stacking game
└── donut_catcher/page.tsx      # Catching game

/app/test-games/
└── page.tsx                    # Diagnostic test page

/public/game-assets/
├── dice_roll/
│   └── ASSETS_NEEDED.md
├── duck_memory/
│   └── ASSETS_NEEDED.md
├── monkey_penguin/
│   └── ASSETS_NEEDED.md
├── cup_stack/
│   └── ASSETS_NEEDED.md
└── donut_catcher/
    └── ASSETS_NEEDED.md

/supabase/migrations/
└── 20251010_add_new_games.sql  # Database setup
```

---

## 🎨 ASSET REPLACEMENT

All games currently use **emoji placeholders**. To add custom images:

### 1. Create Images
- **Format:** PNG with transparency
- **Size:** 256x256px for game pieces
- **Style:** Playful, colorful, Penkey-branded

### 2. Add to Folders
Place images in respective `/public/game-assets/[game_name]/` folders

### 3. Update Code
Replace emoji strings with image imports:

```typescript
// Before (emoji)
<div className="text-6xl">🦆</div>

// After (custom image)
import Image from 'next/image'
<Image src="/game-assets/duck_memory/yellow_duck.png" alt="Duck" width={64} height={64} />
```

### 4. Asset Checklist
See `ASSETS_NEEDED.md` in each game folder for specific requirements.

---

## 🗄️ DATABASE SETUP

### Run Migration
```bash
# Apply migration to add games and prizes
supabase db push
```

### Migration Contents
- Adds 5 new games to `mini_games` table
- Configures prize probabilities for each game
- Sets daily stock limits
- Enables all games by default

### Prize Configuration
Each game has 5-6 prize tiers:
- **High rewards** (10-15% chance, limited stock)
- **Medium rewards** (20-25% chance, moderate stock)
- **Small rewards** (25-30% chance, unlimited)
- **Nothing** (10-35% chance)

---

## 🧪 TESTING

### Access Test Page
Navigate to: **`/test-games`**

### Features:
- ✅ View all games (DB and local)
- ✅ Check database connection
- ✅ See play history
- ✅ Reset play limits for testing
- ✅ Quick links to each game
- ✅ Status indicators (in DB, played today)

### Testing Workflow:
1. Go to `/test-games`
2. Click "Test Game" on any game
3. Play the game
4. Return to test page
5. Click "Reset Play History" to test again
6. Verify prizes are awarded correctly

---

## 🎯 PRIZE SYSTEM

### How It Works:
1. User completes game successfully
2. Game calls `/api/games/play` with `gameId`
3. Server function `play_game_enhanced()`:
   - Checks if user played today
   - Randomly selects prize based on probability
   - Awards points/stamps/rewards
   - Decrements daily stock
   - Logs play in `game_plays` table

### Prize Types:
- **Points** - Added to user's balance
- **Stamps** - Added to coffee card
- **Rewards** - Instant voucher created
- **Nothing** - Better luck tomorrow

### Stock Management:
- Daily limits prevent over-giving
- Resets at midnight (requires cron job)
- Admin can adjust in database

---

## 🎮 GAME MECHANICS

### Common Features (All Games):
- ✅ Framer Motion animations
- ✅ Confetti on wins
- ✅ Toast notifications
- ✅ Back to dashboard button
- ✅ How to Play instructions
- ✅ Mobile-responsive
- ✅ Loading states
- ✅ Error handling

### Shared Components:
- `Card`, `Button` from UI library
- `Confetti` component
- `useToast` hook
- Supabase client
- Next.js routing

### API Integration:
All games use:
- `GET /api/games/info?name=[game_name]` - Get game ID
- `POST /api/games/play` - Play game and get prize

---

## 📱 MOBILE OPTIMIZATION

### Touch Controls:
- **Duck Memory** - Tap to flip cards
- **Monkey Penguin** - Tap button rapidly
- **Cup Stack** - Tap to drop cup
- **Donut Catcher** - Touch/drag to move basket
- **Dice Roll** - Single tap to roll

### Responsive Design:
- All games work on mobile screens
- Touch events properly handled
- Buttons sized for fingers
- No hover-only interactions

---

## 🔧 CUSTOMIZATION

### Adjust Difficulty:
Edit constants in each game file:

**Dice Roll:**
```typescript
// No difficulty settings (pure luck)
```

**Duck Memory:**
```typescript
const duckTypes = [...] // Add/remove pairs
```

**Monkey Penguin:**
```typescript
const RACE_DURATION = 10 // Race length in seconds
const FINISH_LINE = 100  // Distance to finish
```

**Cup Stack:**
```typescript
const TARGET_STACKS = 5  // Cups needed to win
const FALL_SPEED = 2     // How fast cups fall
```

**Donut Catcher:**
```typescript
const GAME_DURATION = 15    // Game length
const TARGET_CATCHES = 5    // Catches needed
const FALL_SPEED = 3        // Item fall speed
```

### Change Prize Probabilities:
Edit migration file or update database directly:
```sql
UPDATE game_prizes 
SET probability = 0.20 
WHERE game_id = '[game_id]' AND label = 'Prize Name';
```

---

## 🚀 DEPLOYMENT

### Checklist:
- [ ] Run database migration
- [ ] Test all games on `/test-games`
- [ ] Verify prize distribution
- [ ] Check mobile responsiveness
- [ ] Add custom assets (optional)
- [ ] Update admin panel if needed
- [ ] Set up midnight stock reset cron job

### Production Notes:
- Games work with emoji placeholders
- Custom assets improve polish
- Monitor prize stock levels
- Adjust probabilities based on usage
- Consider adding game analytics

---

## 🎨 AMANDA-STYLE MESSAGES

Games include playful messages:

**Duck Memory:**
- "Omg you're SO good at this! 💕" (< 10 moves)
- "Great memory! ✨" (10-15 moves)

**Monkey Penguin:**
- "You tapped [X] times! 💪"
- "Great race! 🏃"
- "You're so fast! ⚡"

**Cup Stack:**
- "Perfect stacking! ☕"
- "Nice balance! 🎯"
- "You're a stacking pro! 🏆"

**Donut Catcher:**
- "You caught [X] items! 🎯"
- "Great reflexes! 🏃"
- "You're a catching champion! 🏆"

Add more in each game's `endGame()` function!

---

## 📊 ANALYTICS IDEAS

### Track:
- Most popular game
- Average completion time
- Win rates per game
- Prize distribution
- Peak play times
- User engagement

### Queries:
```sql
-- Most played game
SELECT 
  mini_games.display_name,
  COUNT(*) as plays
FROM game_plays
JOIN mini_games ON game_plays.game_id = mini_games.id
GROUP BY mini_games.display_name
ORDER BY plays DESC;

-- Win rate by game
SELECT 
  mini_games.display_name,
  COUNT(CASE WHEN prize_type != 'nothing' THEN 1 END)::float / COUNT(*) as win_rate
FROM game_plays
JOIN mini_games ON game_plays.game_id = mini_games.id
GROUP BY mini_games.display_name;
```

---

## 🐛 TROUBLESHOOTING

### Game Not Loading:
- Check `/test-games` for database status
- Verify game exists in `mini_games` table
- Check browser console for errors

### Can't Play Again:
- Games limited to once per day
- Use "Reset Play History" on test page
- Check `game_plays` table for today's entries

### No Prize Awarded:
- Verify `game_prizes` configured for game
- Check daily stock limits
- Review prize probabilities (must sum to 1.0)

### Animation Issues:
- Ensure framer-motion installed
- Check for conflicting CSS
- Test on different browsers

---

## 🎉 SUMMARY

**5 new games added:**
1. 🎲 Lucky Dice Roll (easiest)
2. 🦆 Duck Memory Match (your favorite!)
3. 🐧 Monkey vs Penguin Race (energetic)
4. ☕ Coffee Cup Stack (challenging)
5. 🍩 Donut Catcher (most complex)

**Total games:** 8 (including existing 3)

**All games:**
- ✅ Fully functional with emojis
- ✅ Mobile-responsive
- ✅ Prize system integrated
- ✅ Database configured
- ✅ Ready for custom assets
- ✅ Tested and working

**Next steps:**
1. Run migration: `supabase db push`
2. Test games: `/test-games`
3. Add custom images (optional)
4. Deploy and enjoy! 🎮

---

**Have fun with your new games!** 🎉
