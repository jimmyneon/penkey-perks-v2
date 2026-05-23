# 🫘 What's Next - Complete Beans Migration

## ✅ Already Done

1. **Database Migration** ✅
   - User balances multiplied by 10x
   - Point configs updated (signup: 250, check-in: 50, etc.)
   - Rewards catalog updated (£5: 4000 beans, etc.)
   - Signup bonus created (250 beans + free coffee)

2. **UI Components** ✅
   - Points card → Beans card
   - Bean icon component (no more square boxes!)
   - Rewards page updated
   - All "points" → "beans" in main components

---

## ⚠️ STILL NEEDS UPDATING

### **Game Prizes** ❌ (Most Important!)

**Current problem:** Games still award OLD point values!

**Example:**
- Spin Wheel: 5 points → Should be **50 beans**
- Scratch Card: 10 points → Should be **100 beans**
- Duck Pond: 15 points → Should be **150 beans**
- Cup Stack: 25 points → Should be **250 beans**

**Fix:** Run this migration:
```sql
supabase/migrations/20251011_update_game_prizes_to_beans.sql
```

**What it does:**
- ✅ Multiplies all game prize values by 10x
- ✅ Updates labels: "Points" → "Beans"
- ✅ Preserves stamp prizes (unchanged)

---

## 🔍 How to Verify Everything

### **Step 1: Run the Checklist**

```sql
-- In Supabase SQL Editor:
BEANS_FINAL_CHECKLIST.sql
```

**This checks:**
1. ✅ Points config (action rewards)
2. ⚠️ Game prizes (needs update!)
3. ✅ Rewards catalog
4. ✅ User balances
5. ✅ Recent transactions
6. ✅ Pending rewards
7. ✅ Signup bonus
8. ✅ App settings

**Expected output:**
```
❌ X game prizes still have old point values
   → Run: 20251011_update_game_prizes_to_beans.sql
```

---

### **Step 2: Update Game Prizes**

```sql
-- In Supabase SQL Editor:
supabase/migrations/20251011_update_game_prizes_to_beans.sql
```

**Before:**
```
Spin Wheel: "5 Points" = 5
Scratch Card: "10 Points" = 10
Cup Stack: "25 Points" = 25
```

**After:**
```
Spin Wheel: "50 Beans" = 50
Scratch Card: "100 Beans" = 100
Cup Stack: "250 Beans" = 250
```

---

### **Step 3: Verify Again**

```sql
-- Run checklist again:
BEANS_FINAL_CHECKLIST.sql
```

**Expected output:**
```
✅ All game prizes updated to beans
✅ All rewards updated to beans
✅ All point configs updated to beans
🎉 ALL SYSTEMS UPDATED TO BEANS! 🫘
```

---

## 📊 Complete Bean Values Reference

### **Action Rewards** (points_config)
| Action | Old | New |
|--------|-----|-----|
| Signup | 10 | **250** |
| Check-in | 5 | **50** |
| 7-day Streak | 10 | **200** |
| 14-day Streak | - | **500** (NEW) |
| 30-day Streak | 50 | **1,500** |
| Game Won | varies | **50-250** |
| Referral | 20 | **400** |
| Birthday | 25 | **300** |

### **Game Prizes** (game_prizes)
| Prize Tier | Old | New |
|------------|-----|-----|
| Small Win | 5 | **50** |
| Medium Win | 10 | **100** |
| Good Win | 15 | **150** |
| Great Win | 20 | **200** |
| Jackpot | 25 | **250** |

### **Reward Costs** (points_rewards)
| Reward | Old | New |
|--------|-----|-----|
| Free Pastry | 30 | **1,500** |
| £5 Voucher | 50 | **4,000** |
| £10 Voucher | 90 | **8,000** |
| Reusable Cup | - | **12,000** (NEW) |
| Hoodie | - | **25,000** (NEW) |
| Legend Status | - | **50,000** (NEW) |

---

## 🎮 Testing After Update

### **Test 1: Play a Game**
1. Go to `/games`
2. Play any game (Spin Wheel, Scratch Card, etc.)
3. Win a prize
4. Check pending rewards

**Expected:**
- Prize shows "50 beans" (not "5 points")
- Pending rewards shows correct bean amount
- Check-in claims correct beans

### **Test 2: Check Database**
```sql
-- Check recent game plays
SELECT 
  gp.created_at,
  mg.display_name,
  gp.prize_label,
  gp.prize_value
FROM game_plays gp
JOIN mini_games mg ON mg.id = gp.game_id
WHERE gp.created_at > NOW() - INTERVAL '1 hour'
ORDER BY gp.created_at DESC;
```

**Expected:** `prize_value` should be 50, 100, 150, 200, or 250

---

## 🚀 Deployment Checklist

- [x] Run main beans migration
- [x] Update UI components
- [x] Create bean icon component
- [ ] **Run game prizes migration** ← DO THIS NOW!
- [ ] Verify with checklist
- [ ] Test game play
- [ ] Deploy to production

---

## 📝 Quick Commands

**Run game prizes update:**
```sql
-- In Supabase SQL Editor:
supabase/migrations/20251011_update_game_prizes_to_beans.sql
```

**Verify everything:**
```sql
BEANS_FINAL_CHECKLIST.sql
```

**Check specific game prizes:**
```sql
SELECT 
  mg.display_name,
  gp.label,
  gp.prize_value
FROM game_prizes gp
JOIN mini_games mg ON mg.id = gp.game_id
WHERE gp.prize_type = 'points'
ORDER BY mg.display_name, gp.prize_value DESC;
```

---

## 🎯 After Everything is Updated

**You'll have:**
- ✅ All user balances in beans
- ✅ All game prizes in beans
- ✅ All rewards in beans
- ✅ All UI showing beans
- ✅ Signup bonus: 250 beans + coffee
- ✅ Games awarding 50-250 beans
- ✅ Rewards costing 1,500-50,000 beans

**Ready to launch! 🎉🫘**
