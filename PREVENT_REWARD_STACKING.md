# Prevent Reward Stacking Fix

## Problem
Users could stack up multiple free coffees and rewards by:
1. **Coffee Stamps**: Game prizes were adding stamps even when users already had 10 stamps
2. **Rewards**: Game prizes were issuing rewards even when users already had active unredeemed rewards

## Solution Implemented

### 1. Database Functions (Migration: `20251010_prevent_stamp_stacking.sql`)

#### `add_game_prize_stamps(p_user_id, p_stamp_count)`
- Checks current stamp count before adding
- **Caps at 10 stamps maximum**
- Only adds stamps up to the 10 limit
- Auto-issues free coffee reward at 10 stamps (only if user doesn't already have one)
- Returns success/failure with details

#### `can_receive_reward_prize(p_user_id, p_reward_name)`
- Checks if user already has an active reward
- Returns `FALSE` if user has unredeemed rewards (prevents stacking)
- Returns `TRUE` if user can receive a new reward

### 2. API Changes (`/app/api/games/play/route.ts`)

#### Stamp Prizes (Lines 86-99)
- Now uses `add_game_prize_stamps()` function instead of direct insert
- If user has 10 stamps, gives "nothing" prize instead
- Prevents stamp overflow

#### Reward Prizes (Lines 100-146)
- Checks `can_receive_reward_prize()` before issuing
- If user already has active reward, gives "nothing" prize instead
- Prevents reward stacking

## How It Works

### Coffee Stamp Flow
1. User plays game and wins stamp prize
2. System checks current stamp count
3. **If < 10 stamps**: Adds stamps (up to 10 max)
4. **If = 10 stamps**: Returns error, game gives "nothing" instead
5. **At exactly 10 stamps**: Auto-issues free coffee (if they don't have one)

### Reward Prize Flow
1. User plays game and wins reward prize
2. System checks if user has any active rewards
3. **If no active rewards**: Issues the reward
4. **If has active reward**: Returns false, game gives "nothing" instead

## Apply the Fix

```bash
# Run the migration
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/20251010_prevent_stamp_stacking.sql

# Or via Supabase CLI
supabase db push
```

## Testing

### Test Stamp Cap
1. Get user to 10 stamps
2. Try to play game that gives stamps
3. Should receive "nothing" prize instead
4. Stamp count should stay at 10

### Test Reward Stacking
1. Get user a free coffee reward (don't redeem)
2. Try to play game that gives rewards
3. Should receive "nothing" prize instead
4. Should only have 1 active reward

### Test After Redemption
1. Redeem the free coffee
2. Stamps should reset to 0
3. Can now earn stamps again
4. Can now receive reward prizes again

## Key Benefits

✅ **No more stacking** - Users can't accumulate multiple free coffees
✅ **Fair gameplay** - Must redeem before earning more
✅ **Automatic handling** - System gracefully gives "nothing" when at limits
✅ **Data integrity** - Prevents database bloat from unlimited stamps
✅ **Better UX** - Clear messaging about needing to redeem first

## Notes

- The `add_coffee_stamp` API route already had the 10-stamp cap
- This fix ensures game prizes respect the same rules
- "Nothing" prizes are given when limits are reached (not errors shown to user)
- Redemption automatically resets stamps and allows new rewards
