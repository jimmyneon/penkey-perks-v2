/**
 * User Data Cache
 * 
 * Caches semi-static user data like profile, badges, and referral stats.
 * Uses sessionStorage with medium cache duration.
 */

import { getCache, setCache, invalidateCache, invalidateCachePattern } from './index'
import { createClient } from '@/lib/supabase/client'

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const STORAGE = 'session' as const

/**
 * Get cached user profile or fetch from database
 */
export async function getCachedUserProfile(userId: string) {
  const cacheKey = `profile:${userId}`
  const cached = getCache<any>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  // Cache the result
  setCache(cacheKey, profile, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return profile
}

/**
 * Get cached user badges or fetch from database
 */
export async function getCachedUserBadges(userId: string) {
  const cacheKey = `badges:${userId}`
  const cached = getCache<any>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: badge, error } = await supabase
    .from('user_badges')
    .select('*, badge_tiers(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
    console.error('Error fetching user badges:', error)
    return null
  }

  // Cache the result
  setCache(cacheKey, badge, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return badge
}

/**
 * Get cached referral stats or fetch from database
 */
export async function getCachedReferralStats(userId: string) {
  const cacheKey = `referrals:${userId}`
  const cached = getCache<any>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)

  if (error) {
    console.error('Error fetching referrals:', error)
    return { total: 0, confirmed: 0 }
  }

  const stats = {
    total: referrals?.length || 0,
    confirmed: referrals?.filter(r => r.confirmed).length || 0,
  }

  // Cache the result
  setCache(cacheKey, stats, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return stats
}

/**
 * Invalidate user profile cache
 */
export function invalidateUserProfile(userId: string) {
  invalidateCache(`profile:${userId}`, STORAGE)
}

/**
 * Invalidate user badges cache
 */
export function invalidateUserBadges(userId: string) {
  invalidateCache(`badges:${userId}`, STORAGE)
}

/**
 * Invalidate referral stats cache
 */
export function invalidateReferralStats(userId: string) {
  invalidateCache(`referrals:${userId}`, STORAGE)
}

/**
 * Invalidate all user data caches for a specific user
 */
export function invalidateAllUserData(userId: string) {
  invalidateCachePattern(userId, STORAGE)
  console.log(`🗑️ Invalidated all user data for ${userId}`)
}
