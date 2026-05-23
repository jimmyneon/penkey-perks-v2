# 🐛 PENDING REWARDS BUG - FIXED!

## 🔍 Problem Found

**Issue:** When playing games, no pending rewards were being created.

**Root Cause:** The `award_game_prize_pending()` function had a bug on line 29:

```sql
-- ❌ WRONG (line 29)
SELECT name INTO v_game_name FROM public.games WHERE id = p_game_id;

-- ✅ CORRECT
SELECT display_name INTO v_game_name FROM public.mini_games WHERE id = p_game_id;
```

**Why it failed:**
- Table is called `mini_games`, not `games`
- Column is `display_name`, not `name`
- Function would fail silently, no pending reward created

---

## ✅ Fix Applied

### **Files Updated:**

1. **`supabase/migrations/20251011_phase2_game_wins_pending.sql`**
   - Fixed line 29 to use correct table/column

2. **`supabase/migrations/20251011_fix_pending_rewards_function.sql`** ✨ NEW
   - Standalone migration to apply fix to database
   - Can be run immediately

---

## 🚀 How to Apply Fix

### **Option 1: Run New Migration (Recommended)**

In Supabase SQL Editor, run:
```sql
-- File: supabase/migrations/20251011_fix_pending_rewards_function.sql
```

This will recreate the function with the correct table name.

### **Option 2: Quick SQL Fix**

Run this directly in Supabase:
```sql
CREATE OR REPLACE FUNCTION public.award_game_prize_pending(
  p_user_id UUID,
  p_game_id UUID,
  p_prize_type TEXT,
  p_prize_value INTEGER,
  p_prize_label TEXT,
  p_reward_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_app_url TEXT;
  v_pending_id UUID;
  v_game_name TEXT;
BEGIN
  v_app_url := COALESCE(current_setting('app.settings.app_url', true), 'https://perks.penkey.co.uk');
  
  -- FIXED: Changed from public.games to public.mini_games
  SELECT display_name INTO v_game_name FROM public.mini_games WHERE id = p_game_id;
  
  IF p_prize_type = 'nothing' THEN
    RETURN jsonb_build_object(
      'success', true,
      'pending', false,
      'message', 'Better luck next time!'
    );
  END IF;
  
  INSERT INTO public.pending_rewards (
    user_id,
    reward_type,
    amount,
    reward_id,
    reward_name,
    reward_description,
    source,
    source_id,
    metadata
  ) VALUES (
    p_user_id,
    CASE 
      WHEN p_prize_type = 'points' THEN 'points'
      WHEN p_prize_type = 'stamps' THEN 'stamps'
      WHEN p_prize_type = 'reward' THEN 'voucher'
      ELSE 'custom'
    END,
    p_prize_value,
    p_reward_id,
    p_prize_label || ' from ' || COALESCE(v_game_name, 'Game'),
    'Check in at Penkey to claim your prize!',
    'game_win',
    p_game_id,
    jsonb_build_object(
      'game_id', p_game_id,
      'game_name', v_game_name,
      'prize_type', p_prize_type,
      'prize_label', p_prize_label
    )
  )
  RETURNING id INTO v_pending_id;
  
  UPDATE public.users
  SET pending_rewards_count = pending_rewards_count + 1,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  IF public.can_send_email(p_user_id, 'achievement') THEN
    PERFORM public.queue_email_from_template(
      'game_win_pending',
      (SELECT email FROM public.users WHERE id = p_user_id),
      p_user_id,
      jsonb_build_object(
        'name', (SELECT name FROM public.users WHERE id = p_user_id),
        'gameName', v_game_name,
        'prizeWon', p_prize_label,
        'prizeType', p_prize_type,
        'prizeValue', p_prize_value,
        'appUrl', v_app_url
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'pending', true,
    'pending_id', v_pending_id,
    'message', 'Prize pending! Check in at Penkey to claim it.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Testing After Fix

### **1. Play a Game:**
```
1. Go to any game (e.g., Scratch Card)
2. Play the game
3. Win a prize (points or stamps)
```

### **2. Check Pending Rewards:**
```sql
-- In Supabase SQL Editor:
SELECT * FROM pending_rewards 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

You should see:
- New row with your prize
- `status = 'pending'`
- `claimed = false`

### **3. Check Dashboard:**
```
1. Go to /dashboard
2. Points Card should show: "X Pending"
3. Stamps Card should show: "X Pending Stamps" (if stamps won)
```

### **4. Check User Count:**
```sql
SELECT id, name, pending_rewards_count 
FROM users 
WHERE id = 'YOUR_USER_ID';
```

Should show `pending_rewards_count > 0`

---

## 🎯 Expected Behavior After Fix

### **When You Win a Game:**

1. ✅ Pending reward created in `pending_rewards` table
2. ✅ `pending_rewards_count` incremented on user
3. ✅ Dashboard shows pending count
4. ✅ Game shows "Prize Pending!" message
5. ✅ Email queued (if enabled)

### **When You Check In:**

1. ✅ All pending rewards claimed
2. ✅ Points/stamps added to balance
3. ✅ `pending_rewards_count` reset to 0
4. ✅ Dashboard updated
5. ✅ Pending alerts disappear

---

## 📊 Verification Queries

### **Check if function exists:**
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'award_game_prize_pending';
```

### **Check pending rewards:**
```sql
SELECT 
  pr.*,
  u.name as user_name,
  mg.display_name as game_name
FROM pending_rewards pr
JOIN users u ON u.id = pr.user_id
LEFT JOIN mini_games mg ON mg.id = pr.source_id::uuid
WHERE pr.status = 'pending'
ORDER BY pr.created_at DESC
LIMIT 10;
```

### **Check user pending counts:**
```sql
SELECT 
  id,
  name,
  pending_rewards_count,
  (SELECT COUNT(*) FROM pending_rewards WHERE user_id = users.id AND status = 'pending') as actual_pending
FROM users
WHERE pending_rewards_count > 0
OR EXISTS (SELECT 1 FROM pending_rewards WHERE user_id = users.id AND status = 'pending');
```

---

## 🎉 Summary

**Bug:** Function referenced wrong table name
**Fix:** Updated to use `mini_games` table
**Impact:** Pending rewards now work correctly!
**Action:** Run migration to apply fix

**After applying fix, all 10 games will create pending rewards properly!** ✅
