# 🎮 Finish Games Update - Quick Guide

## ✅ COMPLETED SO FAR (3/10)

1. ✅ Scratch Card - DONE
2. ✅ Spin Wheel - DONE  
3. ✅ Duck Pond - DONE

## ⏳ PARTIALLY DONE (1/10)

4. Coffee Snake - Import & State added, need API response + UI

## 📋 REMAINING (6/10)

5. Hungry Hippo
6. Dice Roll
7. Cup Stack
8. Donut Catcher
9. Duck Memory
10. Monkey Penguin

---

## 🔧 For Each Remaining Game:

### **Step 1: Add Import** (at top of file)
```tsx
import { GamePrizePending } from '@/components/game-prize-pending'
```

### **Step 2: Add State** (with other useState)
```tsx
const [isPending, setIsPending] = useState(false)
const [pendingMessage, setPendingMessage] = useState('')
```

### **Step 3: Update API Response Handler**
Find where `setPrize(data.prize)` is called, add these lines after it:
```tsx
setPrize(data.prize)
setIsPending(data.isPending || false)  // ADD THIS
setPendingMessage(data.message || '')  // ADD THIS
```

### **Step 4: Add UI Component**
Find the prize result display (usually near "Back to Dashboard" button), add:
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

And update the "View Reward" button condition:
```tsx
{prize.type === 'reward' && !isPending && (  // Add !isPending
  <Link href="/rewards" className="flex-1">
    <Button className="w-full">View Reward</Button>
  </Link>
)}
```

---

## 🎯 Quick Search Patterns

To find the right locations in each game:

**For API Response:**
```bash
# Search for:
setPrize(data.prize)
```

**For UI Location:**
```bash
# Search for:
Back to Dashboard
```

---

## ⏱️ Time Per Game

- Import: 10 seconds
- State: 10 seconds  
- API Response: 20 seconds
- UI Component: 30 seconds

**Total per game:** ~70 seconds (1 minute)

**6 games remaining:** ~6 minutes

---

## 🚀 Status

**3 games complete, 1 partial, 6 to go!**

Ready to finish the remaining 7 games in ~10 minutes total.
