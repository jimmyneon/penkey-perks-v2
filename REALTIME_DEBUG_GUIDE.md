# 🔍 Realtime Debug Guide

## Where QR Codes Are Shown

1. **Dashboard** → "Your Rewards" section → Click "View QR" → Goes to `/rewards/[id]` ✅ HAS REALTIME
2. **Rewards Page** → "My Rewards" tab → Click reward → Shows QR in dialog ✅ HAS REALTIME
3. **Rewards Page** → "History" tab → Click item → Should go to `/rewards/[id]` ✅ HAS REALTIME

## How to Test Realtime

### 1. Enable Realtime in Supabase
Go to Supabase Dashboard → Database → Replication
- Find `user_rewards` table
- Make sure "Realtime" is enabled

### 2. Check Browser Console
When customer opens QR code, you should see:
```
Setting up realtime for reward: [uuid]
Realtime subscription status: SUBSCRIBED
```

When staff scans:
```
🎉 Reward updated via realtime: { new: { status: 'redeemed', ... } }
```

### 3. Test Flow

**Customer Phone:**
1. Go to `/rewards/[id]` (individual reward page)
2. Open browser console (inspect → console)
3. Look for "Setting up realtime for reward:"
4. Keep page open

**Staff Scanner:**
1. Scan the customer's QR code
2. Redeem it

**Customer Phone Should:**
- See console log: "🎉 Reward updated via realtime"
- Success modal pops up instantly!

## Common Issues

### Issue 1: Realtime Not Enabled
**Solution:** Enable in Supabase Dashboard → Database → Replication → user_rewards

### Issue 2: RLS Blocking Realtime
**Solution:** Check if user can read their own user_rewards:
```sql
SELECT * FROM user_rewards WHERE user_id = auth.uid();
```

### Issue 3: Wrong Page
**Make sure customer is on:**
- `/rewards/[id]` (individual reward page) ✅
- OR `/rewards` with QR dialog open ✅

**NOT on:**
- Dashboard (links to `/rewards/[id]` but doesn't have realtime itself)

### Issue 4: Subscription Not Connecting
Check console for errors like:
- "WebSocket connection failed"
- "Subscription error"

## Quick Test SQL

Run this to manually trigger realtime (while customer has QR open):

```sql
-- Get a user_reward ID that's active
SELECT id, user_id, status FROM user_rewards WHERE status = 'active' LIMIT 1;

-- Update it to redeemed (customer should see modal!)
UPDATE user_rewards 
SET status = 'redeemed', redeemed_at = NOW()
WHERE id = '[paste-id-here]';
```

If modal appears → Realtime works!
If not → Check Supabase realtime settings
