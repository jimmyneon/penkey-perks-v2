/**
 * Cache Invalidation Helpers
 * 
 * Provides convenient functions to invalidate caches after specific user actions.
 * Call these functions after mutations to ensure data freshness.
 */

import {
  invalidatePointsCache,
  invalidateStampsCache,
  invalidateUserRewardsCache,
  invalidateTransactionsCache,
  invalidateAllDynamicData,
} from './dynamic-data'

import {
  invalidateCheckInStatus,
  invalidateGamePlays,
  invalidateCheckInStreak,
  invalidateAllRealtimeData,
} from './realtime-data'

import {
  invalidateUserProfile,
  invalidateUserBadges,
  invalidateReferralStats,
  invalidateAllUserData,
} from './user-data'

import { invalidateStaticDataCache } from './static-data'

/**
 * Invalidate caches after check-in
 */
export function invalidateAfterCheckIn(userId: string) {
  console.log('🔄 Invalidating caches after check-in...')
  
  // Points and stamps changed
  invalidatePointsCache(userId)
  invalidateStampsCache(userId)
  
  // Check-in status changed
  invalidateCheckInStatus(userId)
  invalidateCheckInStreak(userId)
  
  // Rewards might have been claimed
  invalidateUserRewardsCache(userId)
  
  // Transactions updated
  invalidateTransactionsCache(userId)
  
  // Badges might have been earned
  invalidateUserBadges(userId)
}

/**
 * Invalidate caches after game play
 */
export function invalidateAfterGamePlay(userId: string) {
  console.log('🔄 Invalidating caches after game play...')
  
  // Points might have changed
  invalidatePointsCache(userId)
  
  // Game plays updated
  invalidateGamePlays(userId)
  
  // Rewards might have been won
  invalidateUserRewardsCache(userId)
  
  // Transactions updated
  invalidateTransactionsCache(userId)
}

/**
 * Invalidate caches after reward redemption
 */
export function invalidateAfterRewardRedemption(userId: string) {
  console.log('🔄 Invalidating caches after reward redemption...')
  
  // Points changed (spent)
  invalidatePointsCache(userId)
  
  // Rewards changed
  invalidateUserRewardsCache(userId)
  
  // Transactions updated
  invalidateTransactionsCache(userId)
}

/**
 * Invalidate caches after coffee stamp added
 */
export function invalidateAfterCoffeeStamp(userId: string) {
  console.log('🔄 Invalidating caches after coffee stamp...')
  
  // Stamps changed
  invalidateStampsCache(userId)
  
  // Rewards might have been earned (10 stamps = free coffee)
  invalidateUserRewardsCache(userId)
  
  // Transactions updated
  invalidateTransactionsCache(userId)
}

/**
 * Invalidate caches after profile update
 */
export function invalidateAfterProfileUpdate(userId: string) {
  console.log('🔄 Invalidating caches after profile update...')
  
  // Profile changed
  invalidateUserProfile(userId)
  
  // Badges might have changed
  invalidateUserBadges(userId)
}

/**
 * Invalidate caches after referral confirmed
 */
export function invalidateAfterReferral(userId: string) {
  console.log('🔄 Invalidating caches after referral...')
  
  // Referral stats changed
  invalidateReferralStats(userId)
  
  // Points might have been awarded
  invalidatePointsCache(userId)
  
  // Transactions updated
  invalidateTransactionsCache(userId)
}

/**
 * Invalidate caches after admin updates static data
 */
export function invalidateAfterAdminUpdate() {
  console.log('🔄 Invalidating static data caches after admin update...')
  invalidateStaticDataCache()
}

/**
 * Invalidate all caches for a user (nuclear option)
 */
export function invalidateAllCachesForUser(userId: string) {
  console.log('💣 Invalidating ALL caches for user...')
  invalidateAllDynamicData(userId)
  invalidateAllRealtimeData(userId)
  invalidateAllUserData(userId)
}

/**
 * Invalidate everything (use sparingly)
 */
export function invalidateEverything() {
  console.log('💥 Invalidating EVERYTHING...')
  
  if (typeof window !== 'undefined') {
    // Clear all cache entries
    const localKeys = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
    localKeys.forEach(key => localStorage.removeItem(key))
    
    const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('cache:'))
    sessionKeys.forEach(key => sessionStorage.removeItem(key))
    
    console.log(`🗑️ Cleared ${localKeys.length + sessionKeys.length} cache entries`)
  }
}
