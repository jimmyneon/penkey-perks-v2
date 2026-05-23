# Testing Rewards Display Fix

## Changes Applied

### 1. Fixed Dashboard (`app/dashboard/page.tsx`)
- Changed from nested Supabase query to manual JOIN
- Added debug logging to track data flow

### 2. Fixed Rewards Page (`app/rewards/page.tsx`)
- Already fixed in previous update
- Added debug logging

### 3. Coffee Stamp Redemption
The dashboard already has logic to show a QR code when:
- User has 10+ coffee stamps
- User has an active "Free Coffee" reward in `user_rewards`

## How to Test

### Step 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

### Step 2: Check Database Data
In Supabase SQL Editor, run:
```sql
-- Copy content from: CHECK_REWARDS_DATA.sql
```

This will show:
- All active user_rewards
- All active rewards
- Joined data (what the app should see)
- Any missing reward data
- Users with 10+ coffee stamps

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `/dashboard`
4. Look for "Dashboard Debug:" log

**Expected output:**
```javascript
Dashboard Debug: {
  userRewardsRawCount: 4,  // Number of user_rewards entries
  allRewardsCount: 3,       // Number of rewards in catalog
  userRewardsCount: 4,      // After joining
  stampCount: 10,           // Your coffee stamps
  coffeeReward: {           // Should be present if you have Free Coffee reward
    id: "...",
    reward_id: "...",
    rewards: {
      name: "Free Coffee",
      ...
    }
  }
}
```

### Step 4: Check Rewards Page
1. Navigate to `/rewards`
2. Click "My Rewards" tab
3. Check console for "Rewards Page Debug:" log

**Expected:**
- Should see 4 rewards listed
- Each should have `has_reward_data: true`
- Each should have a `reward_name`

### Step 5: Test Coffee Stamp QR Code
If you have 10+ stamps and a Free Coffee reward:
1. Go to `/dashboard`
2. The coffee stamp card should show a golden overlay with "🎉 Free Coffee Ready!"
3. Click on the card
4. Should open a dialog with QR code

## Troubleshooting

### Issue: No rewards showing on `/rewards`

**Check 1: Data exists in database**
```sql
SELECT COUNT(*) FROM user_rewards WHERE status = 'active';
```
Should return > 0

**Check 2: Rewards table has data**
```sql
SELECT COUNT(*) FROM rewards WHERE active = true;
```
Should return > 0

**Check 3: reward_id matches**
```sql
SELECT 
  ur.reward_id,
  r.id as matching_reward
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
WHERE ur.status = 'active';
```
Both columns should have values (not NULL)

### Issue: Coffee stamp card not showing QR option

**Possible causes:**
1. **Less than 10 stamps** - Check `stampCount` in console log
2. **No Free Coffee reward** - Check `coffeeReward` in console log
3. **Reward not active** - Check status in database

**Fix:**
If you have 10+ stamps but no Free Coffee reward, you need to create one:
```sql
-- Check if Free Coffee reward exists
SELECT * FROM user_rewards 
WHERE user_id = 'YOUR_USER_ID' 
  AND rewards.name = 'Free Coffee';

-- If not, the coffee stamp system should auto-create it
-- Or manually trigger it via the add-coffee API
```

### Issue: Rewards show but no reward data

**Symptom:** Console shows `has_reward_data: false`

**Cause:** The `reward_id` in `user_rewards` doesn't match any `id` in `rewards` table

**Fix:**
```sql
-- Find orphaned reward_ids
SELECT DISTINCT ur.reward_id
FROM user_rewards ur
LEFT JOIN rewards r ON ur.reward_id = r.id
WHERE r.id IS NULL;

-- Then either:
-- 1. Create the missing rewards in rewards table
-- 2. Or update user_rewards to point to valid rewards
```

## Expected Behavior

### Dashboard
- Shows coffee stamp progress (X/10)
- When 10+ stamps + Free Coffee reward exists:
  - Card shows golden overlay
  - Clicking opens QR code dialog
  - Can redeem at staff

### Rewards Page
- **Milestones tab**: Shows all available rewards with progress
- **Available tab**: Shows rewards you can redeem with current points
- **My Rewards tab**: Shows your active redeemed rewards (4 items)
  - Each reward clickable to show QR code
  - Shows expiry date
  - Can be redeemed by staff

## Next Steps After Testing

1. If rewards show correctly → Remove debug console.log statements
2. If coffee QR shows correctly → Test staff redemption flow
3. Test redeeming a new reward to verify full flow works
