# ✅ Caching Migration Checklist

## Phase 1: Setup (30 minutes)

- [ ] Review `DATABASE_AUDIT_REPORT.md`
- [ ] Review cache implementation files in `lib/cache/`
- [ ] Add cache initialization to app layout
- [ ] Test cache utilities work in browser console

---

## Phase 2: Dashboard (2 hours)

### File: `app/dashboard/page.tsx`

- [ ] Replace `mini_games` query with `getCachedGames()`
- [ ] Replace `rewards` query with `getCachedRewardsCatalog()`
- [ ] Replace `users` query with `getCachedUserProfile(userId)`
- [ ] Replace `user_badges` query with `getCachedUserBadges(userId)`
- [ ] Replace `get_user_points` with `getCachedUserPoints(userId)`
- [ ] Replace `get_lifetime_points` with `getCachedLifetimePoints(userId)`
- [ ] Replace `coffee_stamps` query with `getCachedCoffeeStamps(userId)`
- [ ] Replace `user_rewards` query with `getCachedUserRewards(userId)`
- [ ] Replace `referrals` query with `getCachedReferralStats(userId)`
- [ ] Replace `game_plays` query with `getCachedGamePlaysToday(userId)`
- [ ] Replace `can_check_in` with `getCachedCheckInStatus(userId)`
- [ ] Replace `check_ins` query with `getCachedCheckInStreak(userId)`
- [ ] Test dashboard loads correctly
- [ ] Verify cache hits in console

---

## Phase 3: API Routes (3 hours)

### Check-In API (`app/api/check-in/route.ts`)
- [ ] Add `invalidateAfterCheckIn(userId)` at end of POST
- [ ] Test check-in invalidates caches

### Game Play API (`app/api/games/play/route.ts`)
- [ ] Replace `game_prizes` query with `getCachedGamePrizes(gameId)`
- [ ] Add `invalidateAfterGamePlay(userId)` at end
- [ ] Test game play invalidates caches

### Points API (`app/api/points/route.ts`)
- [ ] Replace `get_user_points` with `getCachedUserPoints(userId)`
- [ ] Replace `points_rewards` with `getCachedPointsRewards()`
- [ ] Replace `points_transactions` with `getCachedPointsTransactions(userId)`
- [ ] Add `invalidateAfterRewardRedemption(userId)` in POST
- [ ] Test points API uses cache

### Rewards API (`app/api/rewards/redeem/route.ts`)
- [ ] Add `invalidateAfterRewardRedemption(userId)` after redemption
- [ ] Test reward redemption invalidates caches

### Coffee Stamp API (`app/api/add-coffee/route.ts`)
- [ ] Add `invalidateAfterCoffeeStamp(userId)` after stamp added
- [ ] Test stamp addition invalidates caches

---

## Phase 4: Other Pages (2 hours)

### Rewards Page (`app/rewards/page.tsx`)
- [ ] Replace `get_user_points` with `getCachedUserPoints(userId)`
- [ ] Replace `points_config` with `getCachedPointsConfig()`
- [ ] Replace `points_rewards` with `getCachedPointsRewards()`
- [ ] Replace `user_rewards` with `getCachedUserRewards(userId)`
- [ ] Replace `rewards` with `getCachedRewardsCatalog()`
- [ ] Test rewards page loads correctly

### Profile Page (`app/profile/page.tsx`)
- [ ] Replace `users` query with `getCachedUserProfile(userId)`
- [ ] Add `invalidateAfterProfileUpdate(userId)` after updates
- [ ] Test profile page uses cache

### Staff Pages
- [ ] Review staff dashboard queries
- [ ] Add caching where appropriate (staff data changes less frequently)
- [ ] Test staff pages work correctly

---

## Phase 5: Testing (2 hours)

### Functional Testing
- [ ] Test dashboard loads correctly
- [ ] Test check-in works and invalidates cache
- [ ] Test game play works and invalidates cache
- [ ] Test reward redemption works and invalidates cache
- [ ] Test profile updates work and invalidate cache
- [ ] Test all pages load without errors

### Performance Testing
- [ ] Measure page load time before caching
- [ ] Measure page load time after caching
- [ ] Check cache hit rate in console
- [ ] Verify database query count reduced
- [ ] Check Supabase dashboard for query reduction

### Edge Cases
- [ ] Test with empty cache (first load)
- [ ] Test with expired cache
- [ ] Test cache invalidation works
- [ ] Test multiple tabs (if using sessionStorage)
- [ ] Test localStorage limits (if storing large data)

---

## Phase 6: Monitoring (Ongoing)

### Add Logging
- [ ] Log cache hits/misses
- [ ] Log cache invalidations
- [ ] Track query reduction metrics

### Monitor Performance
- [ ] Check Supabase usage dashboard weekly
- [ ] Monitor page load times
- [ ] Track user-reported issues
- [ ] Adjust cache durations if needed

---

## Rollback Plan

If issues occur:
1. Remove cache calls, revert to direct database queries
2. Keep cache infrastructure for future use
3. Debug specific issues
4. Re-enable caching incrementally

---

## Success Criteria

- [ ] 80% reduction in database queries
- [ ] 75% faster page loads (after first load)
- [ ] No data freshness issues
- [ ] No user-reported bugs
- [ ] Lower Supabase costs

---

## Estimated Timeline

- **Phase 1:** 30 minutes
- **Phase 2:** 2 hours
- **Phase 3:** 3 hours
- **Phase 4:** 2 hours
- **Phase 5:** 2 hours
- **Total:** ~10 hours

---

## Notes

- Start with dashboard (highest impact)
- Test thoroughly after each phase
- Monitor cache effectiveness
- Adjust durations based on data
- Document any issues encountered
