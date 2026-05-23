/**
 * Static Data Cache
 * 
 * Caches rarely-changing data like game configurations, rewards catalog,
 * and points configuration. Uses localStorage with long cache duration.
 */

import { getCache, setCache, invalidateCache } from './index'
import { createClient } from '@/lib/supabase/client'

const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours
const STORAGE = 'local' as const

/**
 * Get cached games or fetch from database
 */
export async function getCachedGames() {
  const cacheKey = 'games:all'
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: games, error } = await supabase
    .from('mini_games')
    .select('*')
    .eq('enabled', true)
    .order('name')

  if (error) {
    console.error('Error fetching games:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, games || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return games || []
}

/**
 * Get cached game prizes or fetch from database
 */
export async function getCachedGamePrizes(gameId: string) {
  const cacheKey = `game-prizes:${gameId}`
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: prizes, error } = await supabase
    .from('game_prizes')
    .select('*')
    .eq('game_id', gameId)

  if (error) {
    console.error('Error fetching game prizes:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, prizes || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return prizes || []
}

/**
 * Get cached rewards catalog or fetch from database
 */
export async function getCachedRewardsCatalog() {
  const cacheKey = 'rewards:catalog'
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
    .from('rewards')
    .select('*')

  if (error) {
    console.error('Error fetching rewards catalog:', error)
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
 * Get cached points rewards or fetch from database
 */
export async function getCachedPointsRewards() {
  const cacheKey = 'points-rewards:all'
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
    .from('points_rewards')
    .select('*')
    .eq('active', true)
    .order('points_required', { ascending: true })

  if (error) {
    console.error('Error fetching points rewards:', error)
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
 * Get cached points configuration or fetch from database
 */
export async function getCachedPointsConfig() {
  const cacheKey = 'points-config:all'
  const cached = getCache<any[]>(cacheKey, {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: config, error } = await supabase
    .from('points_config')
    .select('*')
    .eq('active', true)
    .order('points_amount', { ascending: false })

  if (error) {
    console.error('Error fetching points config:', error)
    return []
  }

  // Cache the result
  setCache(cacheKey, config || [], {
    storage: STORAGE,
    duration: CACHE_DURATION,
  })

  return config || []
}

/**
 * Invalidate all static data caches (call when admin updates data)
 */
export function invalidateStaticDataCache() {
  invalidateCache('games:all', STORAGE)
  invalidateCache('rewards:catalog', STORAGE)
  invalidateCache('points-rewards:all', STORAGE)
  invalidateCache('points-config:all', STORAGE)
  
  // Also invalidate all game prizes
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:game-prizes:'))
  keys.forEach(key => {
    localStorage.removeItem(key)
  })
  
  console.log('🗑️ Invalidated all static data caches')
}
