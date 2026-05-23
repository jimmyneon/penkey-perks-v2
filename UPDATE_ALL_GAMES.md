# 🎮 Update All Game Screens - Instructions

## ✅ What Was Done

### **1. Created Reusable Component:**
`components/game-prize-pending.tsx`

This component shows:
- 🎁 "Prize Pending!" message
- Prize details with icon
- How to claim instructions
- 14-day expiry warning
- "Check In to Claim" button

### **2. Updated Scratch Card:**
`app/games/scratch_card/page.tsx`

Added:
- Import `GamePrizePending` component
- State for `isPending` and `pendingMessage`
- Capture pending data from API response
- Display pending component after prize reveal

---

## 🎯 Games to Update

All games need the same updates:

1. ✅ **Scratch Card** - DONE
2. ⏳ **Spin Wheel** - `app/games/spin_wheel/page.tsx`
3. ⏳ **Duck Pond** - `app/games/duck_pond/page.tsx`
4. ⏳ **Coffee Snake** - `app/games/coffee_snake/page.tsx`
5. ⏳ **Hungry Hippo** - `app/games/hungry_hippo/page.tsx`
6. ⏳ **Dice Roll** - `app/games/dice_roll/page.tsx`
7. ⏳ **Cup Stack** - `app/games/cup_stack/page.tsx`
8. ⏳ **Donut Catcher** - `app/games/donut_catcher/page.tsx`
9. ⏳ **Duck Memory** - `app/games/duck_memory/page.tsx`
10. ⏳ **Monkey Penguin** - `app/games/monkey_penguin/page.tsx`

---

## 📝 Steps for Each Game

### **Step 1: Add Import**
```tsx
import { GamePrizePending } from '@/components/game-prize-pending'
```

### **Step 2: Add State**
```tsx
const [isPending, setIsPending] = useState(false)
const [pendingMessage, setPendingMessage] = useState('')
```

### **Step 3: Capture API Response**
In the game play function, after getting the response:
```tsx
const data = await response.json()

setPrize(data.prize)
setIsPending(data.isPending || false)  // ADD THIS
setPendingMessage(data.message || '')  // ADD THIS
```

### **Step 4: Add Component to UI**
After the prize is revealed, add:
```tsx
{/* Prize Pending Message */}
<GamePrizePending
  prizeLabel={prize?.label || ''}
  prizeType={prize?.type || ''}
  prizeValue={prize?.value}
  isPending={isPending}
  message={pendingMessage}
/>
```

---

## 🎯 Example: Spin Wheel

### **Before:**
```tsx
export default function SpinWheelPage() {
  const [prize, setPrize] = useState<any>(null)
  
  // ... game logic
  
  const data = await response.json()
  setPrize(data.prize)
  
  // ... render prize
  return (
    <div>
      {prize && <div>{prize.label}</div>}
      <Button>Back to Dashboard</Button>
    </div>
  )
}
```

### **After:**
```tsx
import { GamePrizePending } from '@/components/game-prize-pending'

export default function SpinWheelPage() {
  const [prize, setPrize] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  
  // ... game logic
  
  const data = await response.json()
  setPrize(data.prize)
  setIsPending(data.isPending || false)
  setPendingMessage(data.message || '')
  
  // ... render prize
  return (
    <div>
      {prize && <div>{prize.label}</div>}
      
      {/* ADD THIS */}
      <GamePrizePending
        prizeLabel={prize?.label || ''}
        prizeType={prize?.type || ''}
        prizeValue={prize?.value}
        isPending={isPending}
        message={pendingMessage}
      />
      
      <Button>Back to Dashboard</Button>
    </div>
  )
}
```

---

## 🎨 What Users Will See

### **When Prize is Pending:**
```
┌─────────────────────────────────────────┐
│ 🎁 Prize Pending!                       │
│ Check in at Penkey to claim             │
├─────────────────────────────────────────┤
│ 5 Coffee Stamps                    ☕  │
│ 5 stamps                                │
├─────────────────────────────────────────┤
│ 📍 How to Claim:                        │
│ 1. Visit Penkey Deli                    │
│ 2. Open the Penkey Perks app            │
│ 3. Tap "Check In"                       │
│ 4. Prize claimed automatically! 🎉      │
├─────────────────────────────────────────┤
│ ⏰ Prize expires in 14 days             │
├─────────────────────────────────────────┤
│ [📍 Check In to Claim Prize]            │
└─────────────────────────────────────────┘
```

### **When Prize is Immediate (Nothing):**
```
No pending component shown
Just the regular "Better luck next time!" message
```

---

## ✅ Testing Checklist

For each game:
- [ ] Import added
- [ ] State variables added
- [ ] API response captured
- [ ] Component added to UI
- [ ] Test game play
- [ ] Verify pending message shows
- [ ] Verify "Check In" button works
- [ ] Verify component hides for "nothing" prizes

---

## 🚀 Quick Update Script

If you want to update all games quickly, here's the pattern:

1. Open each game file
2. Add import at top
3. Add state after other useState calls
4. Update API response handler
5. Add component after prize reveal
6. Save and test

---

## 📊 Expected Result

**Before:**
- User wins prize → Prize added immediately
- No indication it's pending
- No call to action

**After:**
- User wins prize → "Prize Pending!" message
- Clear instructions to check in
- Big CTA button
- Urgency indicator (14 days)
- Drives store visits! 🎯

---

## 🎉 Benefits

✅ **Clear Communication** - Users know prize is pending  
✅ **Drives Visits** - Big CTA to check in  
✅ **Urgency** - 14-day expiry creates FOMO  
✅ **Instructions** - Step-by-step how to claim  
✅ **Consistent UX** - Same experience across all games  

---

## 📞 Need Help?

The `GamePrizePending` component handles everything:
- Conditional rendering (only shows if `isPending = true`)
- Responsive design
- Icons and styling
- CTA button
- Instructions

Just pass the props and it works! ✨

---

**Scratch Card is done! 9 more games to go!** 🎮
