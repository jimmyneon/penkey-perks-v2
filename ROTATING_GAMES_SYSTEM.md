# 🎮 Rotating Games System

**Updated:** 2025-10-12

---

## 🎯 Overview

The rotating games system gives users **3 random games** that refresh every few hours throughout the day. This replaces the old "one game per day" system with a more engaging experience that encourages users to check back multiple times.

### Key Features
- ✅ **3 random games** per rotation
- ✅ **Refreshes every 4 hours** (configurable)
- ✅ **Daily midnight reset** - all rotations reset at midnight
- ✅ **No notifications** - users must check back to see new games
- ✅ **Individual play tracking** - each game can be played once per rotation
- ✅ **Countdown timer** - shows when next rotation arrives

---

## 🔄 How It Works

### Rotation Schedule (Default: 4 hours)

| Rotation | Time Window | Games Available |
|----------|-------------|-----------------|
| **#1** | 00:00 - 03:59 | 3 random games |
| **#2** | 04:00 - 07:59 | 3 new random games |
| **#3** | 08:00 - 11:59 | 3 new random games |
| **#4** | 12:00 - 15:59 | 3 new random games |
| **#5** | 16:00 - 19:59 | 3 new random games |
| **#6** | 20:00 - 23:59 | 3 new random games |

**At midnight:** All rotations reset, rotation counter goes back to #1

### User Experience Flow

1. **User opens dashboard**
   - Sees 3 random games for current rotation
   - Sees countdown timer to next rotation
   - Sees which games they've already played

2. **User plays games**
   - Can play each game once
   - After playing, game is marked as "played"
   - Can still see other unplayed games

3. **User waits for rotation**
   - Timer counts down to next rotation
   - No notification when rotation happens
   - Must manually refresh/revisit to see new games

4. **Rotation refreshes**
   - 3 new random games appear
   - Play status resets for new games
   - User can play all 3 again

5. **Midnight reset**
   - All rotations reset
   - Rotation counter goes back to #1
   - Fresh start for the new day

---

## 📊 Database Schema

### `game_rotations` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who owns this rotation |
| `game_ids` | UUID[] | Array of 3 game IDs |
| `rotation_number` | INTEGER | Which rotation of the day (0-5 for 4-hour rotations) |
| `refresh_at` | TIMESTAMPTZ | When this rotation expires |
| `created_at` | TIMESTAMPTZ | When rotation was created |

**Indexes:**
- `idx_game_rotations_user_id` on `user_id`
- `idx_game_rotations_refresh_at` on `refresh_at`

**Constraints:**
- Unique constraint on `(user_id, rotation_number, created_at::DATE)`

---

## 🔧 Database Functions

### `get_user_game_rotation(p_user_id UUID, p_rotation_hours INTEGER)`

Returns the current game rotation for a user, creating a new one if needed.

**Parameters:**
- `p_user_id` - User ID
- `p_rotation_hours` - Hours between rotations (default: 4)

**Returns:**
```sql
TABLE (
  game_id UUID,
  game_name TEXT,
  display_name TEXT,
  description TEXT,
  icon TEXT,
  has_played BOOLEAN,
  rotation_number INTEGER,
  refresh_at TIMESTAMPTZ
)
```

**Logic:**
1. Calculates current rotation number based on time of day
2. Calculates next refresh time
3. Checks if rotation exists for current period
4. If not, creates new rotation with 3 random games
5. Returns games with play status

**Example:**
```sql
SELECT * FROM get_user_game_rotation('user-uuid-here'::UUID, 4);
```

### `cleanup_old_game_rotations()`

Maintenance function to clean up old rotation records.

**Returns:** Number of deleted records

**Logic:**
- Deletes rotations older than 7 days
- Should be run periodically via cron job

---

## 🎨 Frontend Components

### `RotatingGamesCard`

Main component that displays the rotating games.

**Location:** `/components/dashboard/rotating-games-card.tsx`

**Features:**
- Displays 3 games in a grid
- Shows countdown timer to next rotation
- Shows progress indicator (X/3 played)
- Animates game tiles on load
- Shows completion message when all played

**Props:**
```typescript
{
  games: any[]              // Array of game objects from rotation
  userId: string            // Current user ID
  onPlay: (gameId) => void  // Callback when game is clicked
  refreshAt?: string        // When rotation refreshes
  rotationNumber?: number   // Current rotation number
}
```

---

## 🔌 API Endpoints

### `GET /api/games/rotation`

Fetches the current game rotation for authenticated user.

**Query Parameters:**
- `hours` (optional) - Rotation interval in hours (default: 4)

**Response:**
```json
{
  "games": [
    {
      "game_id": "uuid",
      "game_name": "dice_roll",
      "display_name": "Lucky Dice Roll",
      "description": "Roll the dice...",
      "icon": "🎲",
      "has_played": false,
      "rotation_number": 2,
      "refresh_at": "2025-10-12T16:00:00Z"
    },
    // ... 2 more games
  ],
  "refreshAt": "2025-10-12T16:00:00Z",
  "rotationNumber": 2,
  "totalGames": 3,
  "playedCount": 0
}
```

---

## 💾 Caching

Game rotations are cached for 5 minutes on the server side.

**Cache Function:** `getCachedGameRotationServer(userId, rotationHours)`

**Location:** `/lib/cache/server.ts`

**TTL:** 5 minutes (shorter than rotation time to ensure freshness)

---

## 🎯 Game Selection Algorithm

Games are selected using a deterministic random algorithm:

```typescript
// Seed based on user_id + rotation_number + game_id
ORDER BY MD5(user_id::TEXT || rotation_num::TEXT || game_id::TEXT)
LIMIT 3
```

**Benefits:**
- Same user gets same games during same rotation
- Different users get different games
- Truly random but reproducible
- No need to store random seed

---

## ⚙️ Configuration

### Changing Rotation Interval

The rotation interval is configurable. Default is 4 hours.

**To change:**

1. **In database function call:**
```typescript
const gameRotation = await getCachedGameRotationServer(user.id, 6) // 6 hours
```

2. **In API endpoint:**
```typescript
GET /api/games/rotation?hours=6
```

**Common intervals:**
- 2 hours = 12 rotations per day
- 3 hours = 8 rotations per day
- 4 hours = 6 rotations per day (default)
- 6 hours = 4 rotations per day
- 8 hours = 3 rotations per day

---

## 🎮 Game Play Tracking

Game plays are still tracked in the `game_plays` table as before.

**No changes needed** - the existing system works perfectly:
- One row per game play
- Tracks `user_id`, `game_id`, `prize_type`, `prize_value`
- Timestamp in `created_at`

The rotation system simply checks if a play exists for today:
```sql
EXISTS(
  SELECT 1 FROM game_plays 
  WHERE user_id = p_user_id 
    AND game_id = mg.id 
    AND created_at >= CURRENT_DATE
)
```

---

## 🔒 Security & Anti-Cheat

### Measures in Place

1. **Server-side rotation generation**
   - Users can't manipulate which games they get
   - Deterministic algorithm prevents gaming the system

2. **Play tracking**
   - Each game can only be played once per day
   - Tracked server-side in database
   - RLS policies prevent tampering

3. **Time-based rotation**
   - Rotation number calculated server-side
   - Users can't force a refresh early
   - Midnight reset is automatic

4. **No client-side control**
   - All logic in database functions
   - Client just displays what server provides

---

## 📈 Benefits Over Old System

### Old System (1 game per day)
- ❌ Only 1 game per day
- ❌ Same game for everyone
- ❌ No reason to check back during day
- ❌ Limited engagement

### New System (3 games, rotating)
- ✅ Up to 18 games per day (6 rotations × 3 games)
- ✅ Different games for each user
- ✅ Encourages checking back multiple times
- ✅ Higher engagement
- ✅ More opportunities to win prizes
- ✅ No notifications = organic engagement

---

## 🚀 Deployment Steps

1. **Run migration:**
```bash
# Apply the migration to create game_rotations table
psql -f supabase/migrations/20251012_game_rotation_system.sql
```

2. **Verify function:**
```sql
-- Test the rotation function
SELECT * FROM get_user_game_rotation('your-user-id'::UUID, 4);
```

3. **Deploy frontend:**
```bash
# Build and deploy
npm run build
# Deploy to your hosting platform
```

4. **Monitor:**
- Check that rotations are being created
- Verify countdown timers work
- Test game play tracking
- Confirm midnight reset works

---

## 🧪 Testing Checklist

- [ ] User sees 3 different games
- [ ] Countdown timer shows correct time
- [ ] Games can be played once each
- [ ] Played games show as "played"
- [ ] Rotation refreshes at correct time
- [ ] New games appear after refresh
- [ ] Midnight reset works correctly
- [ ] Different users get different games
- [ ] Same user gets same games in same rotation
- [ ] Play tracking works correctly
- [ ] Prizes are awarded correctly
- [ ] Cache invalidation works

---

## 🐛 Troubleshooting

### Games not refreshing?
- Check `refresh_at` timestamp in database
- Verify server time is correct
- Clear cache: `DELETE FROM game_rotations WHERE user_id = 'xxx'`

### Same games every rotation?
- Check that multiple games are enabled
- Verify rotation_number is incrementing
- Check MD5 seed calculation

### Countdown timer wrong?
- Verify timezone settings
- Check `refresh_at` calculation
- Ensure client and server times match

### Games already played?
- Check `game_plays` table for today's plays
- Verify `created_at >= CURRENT_DATE` logic
- Clear test plays if needed

---

## 📝 Future Enhancements

Possible improvements:

1. **Configurable rotation times per user**
   - Premium users get more frequent rotations
   - Different rotation schedules for different user tiers

2. **Bonus rotations**
   - Special events with extra rotations
   - Holiday-themed game sets

3. **Game preferences**
   - Users can favorite games
   - Algorithm weights toward favorites

4. **Streak bonuses**
   - Bonus prizes for playing all games in a rotation
   - Rewards for consecutive rotations

5. **Analytics dashboard**
   - Track which games are most popular
   - Monitor rotation engagement
   - Optimize rotation intervals

---

## 🎉 Summary

The rotating games system provides:
- **More engagement** - Users check back multiple times per day
- **More variety** - 3 games per rotation vs 1 per day
- **More opportunities** - Up to 18 game plays per day
- **Better UX** - Countdown timer, progress tracking, smooth animations
- **Organic engagement** - No notifications, users check when they want

**Result:** Higher daily active users, more game plays, more prizes awarded, happier customers! 🚀
