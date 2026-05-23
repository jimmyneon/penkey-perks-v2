# 🎮 Apply Rotating Games System - Quick Start

## What Changed?

The daily game system has been upgraded from **1 game per day** to **3 rotating games every 4 hours**.

### Key Changes:
- ✅ Users get 3 random games per rotation
- ✅ Games refresh every 4 hours (6 rotations per day)
- ✅ All rotations reset at midnight
- ✅ No notifications - users check back organically
- ✅ Up to 18 game plays possible per day (vs 1 before)

---

## 🚀 To Deploy

### 1. Apply Database Migration

Run this migration to create the new system:

```bash
psql $DATABASE_URL -f supabase/migrations/20251012_game_rotation_system.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/20251012_game_rotation_system.sql`
3. Run

### 2. Verify Function Works

Test the rotation function:

```sql
-- Replace 'your-user-id' with a real user ID from your database
SELECT * FROM get_user_game_rotation('your-user-id'::UUID, 4);
```

You should see 3 games returned with their details.

### 3. Deploy Frontend

The frontend changes are already in place:
- `app/dashboard/page.tsx` - Updated to use rotation system
- `app/dashboard/new-dashboard-client.tsx` - Updated to display rotating games
- `components/dashboard/rotating-games-card.tsx` - New component
- `app/api/games/rotation/route.ts` - New API endpoint
- `lib/cache/server.ts` - Added caching for rotations

Just deploy as normal:
```bash
npm run build
# Then deploy to your hosting platform
```

---

## 📋 What Was Created

### Database
- ✅ `game_rotations` table - Stores user game rotations
- ✅ `get_user_game_rotation()` function - Gets/creates rotations
- ✅ `cleanup_old_game_rotations()` function - Maintenance

### API
- ✅ `/api/games/rotation` - Fetch current rotation

### Frontend
- ✅ `RotatingGamesCard` component - Displays 3 games with timer
- ✅ Updated dashboard to use rotation system
- ✅ Added rotation caching

### Documentation
- ✅ `ROTATING_GAMES_SYSTEM.md` - Full documentation

---

## 🎯 How It Works

### For Users:

1. **Open dashboard** → See 3 random games
2. **Play games** → Each can be played once
3. **Wait 4 hours** → New rotation with 3 new games
4. **Midnight** → Everything resets, start fresh

### Rotation Schedule (4-hour intervals):

| Time | Rotation | Games |
|------|----------|-------|
| 00:00-03:59 | #1 | 3 random games |
| 04:00-07:59 | #2 | 3 new games |
| 08:00-11:59 | #3 | 3 new games |
| 12:00-15:59 | #4 | 3 new games |
| 16:00-19:59 | #5 | 3 new games |
| 20:00-23:59 | #6 | 3 new games |

**Maximum plays per day:** 18 (6 rotations × 3 games)

---

## ⚙️ Configuration

### Change Rotation Interval

Default is 4 hours. To change:

**In `app/dashboard/page.tsx`:**
```typescript
const gameRotation = await getCachedGameRotationServer(user.id, 6) // 6 hours instead of 4
```

**Common intervals:**
- 2 hours = 12 rotations/day
- 3 hours = 8 rotations/day
- 4 hours = 6 rotations/day (default)
- 6 hours = 4 rotations/day
- 8 hours = 3 rotations/day

---

## ✅ Testing Checklist

After deployment, verify:

- [ ] Dashboard shows 3 games
- [ ] Countdown timer displays correctly
- [ ] Can play each game once
- [ ] Played games show as "played"
- [ ] After 4 hours, new games appear
- [ ] At midnight, rotation resets to #1
- [ ] Different users get different games
- [ ] Game prizes still work correctly

---

## 🐛 Troubleshooting

### No games showing?
```sql
-- Check if games are enabled
SELECT * FROM mini_games WHERE enabled = true;

-- Should have at least 3 enabled games
```

### Games not refreshing?
```sql
-- Check rotation data
SELECT * FROM game_rotations WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 5;

-- Check refresh_at timestamp
```

### Clear rotation for testing:
```sql
-- Delete rotations for a user to force new rotation
DELETE FROM game_rotations WHERE user_id = 'your-user-id';
```

---

## 📊 Monitor Performance

### Check rotation creation:
```sql
SELECT 
  DATE(created_at) as date,
  rotation_number,
  COUNT(*) as rotations_created
FROM game_rotations
GROUP BY DATE(created_at), rotation_number
ORDER BY date DESC, rotation_number;
```

### Check game plays:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_plays,
  COUNT(DISTINCT user_id) as unique_players
FROM game_plays
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🎉 Expected Impact

### Before (1 game/day):
- 1 game play per user per day
- Limited engagement
- Users visit once per day

### After (3 games/4 hours):
- Up to 18 game plays per user per day
- Higher engagement
- Users check back multiple times
- More prizes awarded
- Better retention

---

## 📝 Notes

- **No breaking changes** - Existing game play tracking still works
- **Backward compatible** - Old game data preserved
- **No notifications** - Users discover new games organically
- **Automatic cleanup** - Old rotations cleaned up after 7 days

---

## 🚀 Ready to Deploy!

1. Run migration ✅
2. Test function ✅
3. Deploy frontend ✅
4. Monitor and enjoy! 🎉

For full details, see `ROTATING_GAMES_SYSTEM.md`
