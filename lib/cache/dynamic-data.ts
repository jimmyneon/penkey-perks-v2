/**
 * Dynamic Data Cache
 * 
 * Caches frequently-changing user data like points, stamps, and rewards.
 * Uses sessionStorage with short cache duration and aggressive invalidation.
 */

import { getCache, setCache, invalidateCache } from './index'
import { createClient } from '@/lib/supabase/client'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STORAGE = 'session' as const

/**
 * Get cached user points or fetch from database
 */
export async function getCachedUserPoints(userId: string) {
  const cacheKey = `points:${userId}`
  const cached = getCache<number>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached !== null) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: points, error } = await supabase
    .rpc('get_user_points', { p_user_id: userId })

  if (error) {
    console.error('Error fetching user points:', error)
    return 0
  }

  // Cache the result
  setCache(cacheKey, points || 0, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return points || 0
}

/**
 * Get cached lifetime points or fetch from database
 */
export async function getCachedLifetimePoints(userId: string) {
  const cacheKey = `lifetime-points:${userId}`
  const cached = getCache<number>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached !== null) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: points, error } = await supabase
    .rpc('get_lifetime_points', { p_user_id: userId })

  if (error) {
    console.error('Error fetching lifetime points:', error)
    return 0
  }

  // Cache the result
  setCache(cacheKey, points || 0, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return points || 0
}

/**
 * Get cached coffee stamps or fetch from database
 */
export async function getCachedCoffeeStamps(userId: string) {
  const cacheKey = `stamps:${userId}`
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: stamps, error } = await supabase
    .from('coffee_stamps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching coffee stamps:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, stamps || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return stamps || []
}

/**
 * Get cached user rewards or fetch from database
 */
export async function getCachedUserRewards(userId: string) {
  const cacheKey = `user-rewards:${userId}`
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: rewards, error } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching user rewards:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, rewards || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return rewards || []
}

/**
 * Get cached points transactions or fetch from database
 */
export async function getCachedPointsTransactions(userId: string, limit = 20) {
  const cacheKey = `transactions:${userId}:${limit}`
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: transactions, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching points transactions:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, transactions || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return transactions || []
}

/**
 * Invalidate points cache
 */
export function invalidatePointsCache(userId: string) {
  invalidateCache(`points:${userId}`, STORAGE)
  invalidateCache(`lifetime-points:${userId}`, STORAGE)
}

/**
 * Invalidate stamps cache
 */
export function invalidateStampsCache(userId: string) {
  invalidateCache(`stamps:${userId}`, STORAGE)
}

/**
 * Invalidate user rewards cache
 */
export function invalidateUserRewardsCache(userId: string) {
  invalidateCache(`user-rewards:${userId}`, STORAGE)
}

/**
 * Invalidate transactions cache
 */
export function invalidateTransactionsCache(userId: string) {
  // Check if we're on the server (no window object)
  if (typeof window === 'undefined') {
    return
  }
  
  // Invalidate all transaction caches for this user
  const keys = Object.keys(sessionStorage).filter(k => 
    k.startsWith(`cache:transactions:${userId}`)
  )
  keys.forEach(key => sessionStorage.removeItem(key))
}

/**
 * Invalidate all dynamic data for a user
 */
export function invalidateAllDynamicData(userId: string) {
  invalidatePointsCache(userId)
  invalidateStampsCache(userId)
  invalidateUserRewardsCache(userId)
  invalidateTransactionsCache(userId)
  console.log(`🗑️ Invalidated all dynamic data for ${userId}`)
}
