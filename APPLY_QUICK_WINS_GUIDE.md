# 🚀 Quick Guide: Apply Quick Wins to Remaining Games

This guide shows you exactly how to apply all the quick wins to the remaining 7 games in ~10 minutes per game.

---

## 📋 CHECKLIST PER GAME

For each game, follow these steps:

### ✅ Step 1: Add Imports (30 seconds)
```typescript
// Add these three imports at the top
import { gameSounds } from '@/lib/sounds'
import { GamePrizePreview } from '@/components/game-prize-preview'
import { createClient } from '@/lib/supabase/client'
```

### ✅ Step 2: Add State Variables (30 seconds)
```typescript
// Add these state variables
const [showPrizePreview, setShowPrizePreview] = useState(false)
const [prizes, setPrizes] = useState<any[]>([])
const supabase = createClient()
```

### ✅ Step 3: Load Prize Data (2 minutes)
```typescript
// Replace the existing useEffect that loads gameId with this:
useEffect(() => {
  loadGameData()
}, [])

const loadGameData = async () => {
  try {
    // Fetch game ID (replace 'GAME_NAME' with actual game name)
    const res = await fetch('/api/games/info?name=GAME_NAME')
    const data = await res.json()
    setGameId(data.id)

    // Load prizes for preview
    const { data: prizesData } = await supabase
      .from('game_prizes')
      .select('*')
      .eq('game_id', data.id)
      .order('probability', { ascending: false })
    
    if (prizesData) {
      setPrizes(prizesData)
    }
  } catch (error) {
    console.error('Failed to load game data:', error)
  }
}
```

### ✅ Step 4: Add Prize Preview Handler (1 minute)
```typescript
// Add this new function
const handlePlayClick = () => {
  if (prizes.length > 0) {
    setShowPrizePreview(true)
  } else {
    startGame()
  }
}
```

### ✅ Step 5: Add Sounds to Game Logic (3 minutes)
```typescript
// In startGame function, add at the beginning:
const startGame = async () => {
  if (!gameId) return
  
  setShowPrizePreview(false) // Close preview if open
  gameSounds.spinStart() // Or appropriate sound for your game
  
  // ... rest of game logic
}

// When prize is revealed/game ends:
if (prize?.type !== 'nothing') {
  setShowConfetti(true)
  gameSounds.win()
} else {
  gameSounds.lose()
}

// Add game-specific sounds:
// - Spin Wheel: gameSounds.tick() during spin
// - Dice: gameSounds.diceRoll() when rolling
// - Memory: gameSounds.flip() on card flip, gameSounds.match() on match
// - Racing: gameSounds.tap() on each tap
// - Catching: gameSounds.catch() when catching item
// - Stacking: gameSounds.stack() when cup lands
```

### ✅ Step 6: Fix Prize Type References (2 minutes)
```typescript
// Find and replace ALL instances of:
prize.type === 'ducks' 
// with:
prize.type === 'points'

// Update toast descriptions:
description: prize.type === 'points' 
  ? `+${prize.value} points added to your balance!`
  : prize.type === 'stamps'
  ? `+${prize.value} coffee stamp${prize.value > 1 ? 's' : ''} added!`
  : prize.type === 'reward'
  ? 'Check your rewards wallet!'
  : 'Try again tomorrow!'

// Update prize display icons:
{prize.type === 'points' && '⭐'}
{prize.type === 'stamps' && '☕'}
{prize.type === 'reward' && '🎁'}
{prize.type === 'nothing' && '😢'}

// Add prize value display:
{prize.type === 'points' && (
  <p className="text-penkey-gray mt-2">+{prize.value} points</p>
)}
{prize.type === 'stamps' && (
  <p className="text-penkey-gray mt-2">+{prize.value} coffee stamp{prize.value > 1 ? 's' : ''}</p>
)}
```

### ✅ Step 7: Add Prize Preview Component (1 minute)
```typescript
// In the return statement, add this BEFORE the header:
return (
  <div className="min-h-screen bg-white">
    <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    
    <GamePrizePreview
      open={showPrizePreview}
      onClose={() => setShowPrizePreview(false)}
      onPlay={startGame}
      prizes={prizes}
      gameName="GAME DISPLAY NAME" // e.g., "Spin Wheel"
      gameIcon="GAME EMOJI" // e.g., "🎡"
    />

    {/* Rest of your component */}
```

### ✅ Step 8: Update Play Button (30 seconds)
```typescript
// Change the "Play Now" button from:
<Button onClick={startGame}>Play Now</Button>

// To:
<Button onClick={handlePlayClick}>Play Now</Button>
```

---

## 🎮 GAME-SPECIFIC SOUND MAPPINGS

### Spin Wheel 🎡
```typescript
// During spin animation
gameSounds.tick() // In animation loop

// On spin start
gameSounds.spinStart()

// On spin stop
gameSounds.spinStop()

// On win/lose
gameSounds.win() or gameSounds.lose()
```

### Lucky Dice 🎲
```typescript
// When dice start rolling
gameSounds.diceRoll()

// When dice land
gameSounds.diceLand()

// On win/lose
gameSounds.win() or gameSounds.lose()
```

### Duck Memory 🦆
```typescript
// On card flip
gameSounds.flip()

// On match found
gameSounds.match()

// On game complete
gameSounds.win() or gameSounds.lose()
```

### Penguin vs Monkey 🐧🐵
```typescript
// On each tap
gameSounds.tap()

// On race finish
gameSounds.finish()

// On win/lose
gameSounds.win() or gameSounds.lose()
```

### Cup Stack ☕
```typescript
// When cup lands successfully
gameSounds.stack()

// When stack topples
gameSounds.topple()

// On game complete
gameSounds.win() or gameSounds.lose()
```

### Donut Catcher 🍩
```typescript
// When catching item
gameSounds.catch()

// When missing item
gameSounds.miss()

// On game complete
gameSounds.win() or gameSounds.lose()
```

---

## 📝 GAME NAME REFERENCE

Make sure to use the correct game name in `fetch('/api/games/info?name=GAME_NAME')`:

| Game | Name String |
|------|-------------|
| Spin Wheel | `spin_wheel` |
| Duck Pond | `duck_pond` |
| Lucky Dice | `dice_roll` |
| Duck Memory | `duck_memory` |
| Penguin vs Monkey | `monkey_penguin` |
| Cup Stack | `cup_stack` |
| Donut Catcher | `donut_catcher` |
| Scratch Card | `scratch_card` |

---

## ⚡ QUICK COPY-PASTE TEMPLATES

### Template 1: Complete Import Block
```typescript
import { gameSounds } from '@/lib/sounds'
import { GamePrizePreview } from '@/components/game-prize-preview'
import { createClient } from '@/lib/supabase/client'
```

### Template 2: Complete State Block
```typescript
const [showPrizePreview, setShowPrizePreview] = useState(false)
const [prizes, setPrizes] = useState<any[]>([])
const supabase = createClient()
```

### Template 3: Complete Prize Preview Component
```typescript
<GamePrizePreview
  open={showPrizePreview}
  onClose={() => setShowPrizePreview(false)}
  onPlay={startGame}
  prizes={prizes}
  gameName="Game Name"
  gameIcon="🎮"
/>
```

### Template 4: Complete Win/Lose Logic
```typescript
if (data.prize.type !== 'nothing') {
  setShowConfetti(true)
  gameSounds.win()
} else {
  gameSounds.lose()
}

toast({
  title: data.prize.type === 'nothing' ? 'Better luck tomorrow!' : `You won: ${data.prize.label}`,
  description: data.prize.type === 'points' 
    ? `+${data.prize.value} points added to your balance!`
    : data.prize.type === 'stamps'
    ? `+${data.prize.value} coffee stamp${data.prize.value > 1 ? 's' : ''} added!`
    : data.prize.type === 'reward'
    ? 'Check your rewards wallet!'
    : 'Try again tomorrow!',
})
```

---

## 🔍 TESTING CHECKLIST

After updating each game, test:

- [ ] Prize preview shows when clicking "Play Now"
- [ ] Prize preview displays all prizes correctly
- [ ] Prize preview shows probabilities
- [ ] "Play Now!" button in preview starts game
- [ ] "Maybe Later" button closes preview
- [ ] Sound plays when game starts
- [ ] Sound plays during gameplay (game-specific)
- [ ] Sound plays on win
- [ ] Sound plays on lose
- [ ] Prize type displays correctly (⭐ for points, ☕ for stamps)
- [ ] Prize value shows in result
- [ ] Toast notification shows correct message
- [ ] Confetti shows on win
- [ ] No console errors

---

## 📊 PROGRESS TRACKER

Track your progress updating each game:

- [x] **Scratch Card** ✅ - Fully updated
- [x] **Duck Pond** ⚠️ - Prize fix only (needs sounds + preview)
- [ ] **Spin Wheel** 🎡
- [ ] **Lucky Dice** 🎲
- [ ] **Duck Memory** 🦆
- [ ] **Penguin vs Monkey** 🐧🐵
- [ ] **Cup Stack** ☕
- [ ] **Donut Catcher** 🍩

---

## 💡 TIPS

1. **Work on one game at a time** - Don't try to update all at once
2. **Test immediately** - Test each game after updating
3. **Copy from Scratch Card** - Use it as reference
4. **Sound volume** - Keep sounds subtle (0.2-0.3 volume)
5. **Error handling** - Wrap sound calls in try-catch if needed
6. **Mobile testing** - Test on mobile for haptic feedback

---

## 🐛 COMMON ISSUES

### Issue: Sounds not playing
**Solution:** User must interact with page first (browser security). Sounds will work after first click.

### Issue: Prize preview not showing
**Solution:** Check that prizes are loading correctly. Add console.log to verify.

### Issue: Wrong prize icons
**Solution:** Make sure you replaced ALL `ducks` references with `points`/`stamps`.

### Issue: TypeScript errors
**Solution:** Add `any` type to prize state: `useState<any[]>([])`

---

## ⏱️ TIME ESTIMATE

- **Per game:** 8-10 minutes
- **All 7 remaining games:** 60-70 minutes
- **Testing all games:** 20-30 minutes
- **Total:** ~90 minutes

---

## 🎉 DONE!

Once all games are updated:
1. Test each game thoroughly
2. Check dashboard shows "Today's Winnings"
3. Verify all sounds work
4. Confirm prize previews show
5. Deploy to production! 🚀

---

**Need help? Check the fully updated Scratch Card game as reference!**
