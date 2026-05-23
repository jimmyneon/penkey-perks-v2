/**
 * Real-Time Data Cache
 * 
 * Caches real-time data like check-in status and game plays.
 * Uses sessionStorage with very short cache duration and date-based keys.
 */

import { getCache, setCache, invalidateCache } from './index'
import { createClient } from '@/lib/supabase/client'

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
const STORAGE = 'session' as const

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get cached check-in status or fetch from database
 * DISABLED CACHING - Always fetch fresh to avoid false "already checked in"
 */
export async function getCachedCheckInStatus(userId: string) {
  // CACHE DISABLED - Always fetch fresh check-in status
  // This prevents false "already checked in" errors from stale cache
  
  const supabase = createClient()
  const { data: canCheckIn, error } = await supabase
    .rpc('can_check_in', { p_user_id: userId })

  if (error) {
    console.error('Error fetching check-in status:', error)
    return true // Default to allowing check-in on error
  }

  console.log('🔍 Fresh check-in status (no cache):', canCheckIn)
  return canCheckIn ?? true
}

/**
 * Get cached game plays for today or fetch from database
 */
export async function getCachedGamePlaysToday(userId: string) {
  const cacheKey = `gameplays:${userId}:${getTodayKey()}`
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: plays, error } = await supabase
    .from('game_plays')
    .select('game_id')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())

  if (error) {
    console.error('Error fetching game plays:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, plays || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return plays || []
}

/**
 * Get cached check-in streak or fetch from database
 * Note: Using coffee_stamps as proxy for check-ins since check_ins table doesn't exist
 */
export async function getCachedCheckInStreak(userId: string) {
  const cacheKey = `streak:${userId}`
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database - use coffee_stamps as proxy
  const supabase = createClient()
  const { data: stamps, error } = await supabase
    .from('coffee_stamps')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error fetching check-in streak:', error)
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
 * Invalidate check-in status cache
 */
export function invalidateCheckInStatus(userId: string) {
  invalidateCache(`checkin:${userId}:${getTodayKey()}`, STORAGE)
}

/**
 * Invalidate game plays cache
 */
export function invalidateGamePlays(userId: string) {
  invalidateCache(`gameplays:${userId}:${getTodayKey()}`, STORAGE)
}

/**
 * Invalidate check-in streak cache
 */
export function invalidateCheckInStreak(userId: string) {
  invalidateCache(`streak:${userId}`, STORAGE)
}

/**
 * Invalidate all real-time data for a user
 */
export function invalidateAllRealtimeData(userId: string) {
  invalidateCheckInStatus(userId)
  invalidateGamePlays(userId)
  invalidateCheckInStreak(userId)
  console.log(`🗑️ Invalidated all real-time data for ${userId}`)
}
