/**
 * Server-Side Cache Helpers
 * 
 * These functions work in server components by using the database directly.
 * They check cache first, then fall back to database queries.
 * 
 * Note: Server components can't access localStorage/sessionStorage,
 * so we use a simple in-memory cache with short TTL for server-side rendering.
 */

import { createClient } from '@/lib/supabase/server'

// Simple in-memory cache for server components (resets on each deployment/restart)
const serverCache = new Map<string, { data: any; expiresAt: number }>()

function getServerCache<T>(key: string): T | null {
  const cached = serverCache.get(key)
  if (!cached) return null
  
  if (Date.now() > cached.expiresAt) {
    serverCache.delete(key)
    return null
  }
  
  return cached.data as T
}

function setServerCache<T>(key: string, data: T, durationMs: number): void {
  serverCache.set(key, {
    data,
    expiresAt: Date.now() + durationMs,
  })
}

/**
 * Get cached games or fetch from database
 */
export async function getCachedGamesServer() {
  const cacheKey = 'games:all'
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: games')
    return cached
  }
  
  const supabase = await createClient()
  const { data: games, error } = await supabase
    .from('mini_games')
    .select('*')
    .eq('enabled', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching games:', error)
    return []
  }
  
  setServerCache(cacheKey, games || [], 2 * 60 * 60 * 1000) // 2 hours
  console.log('💾 Server cached: games')
  return games || []
}

/**
 * Get cached rewards catalog or fetch from database
 */
export async function getCachedRewardsCatalogServer() {
  const cacheKey = 'rewards:catalog'
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: rewards catalog')
    return cached
  }
  
  const supabase = await createClient()
  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('*')
  
  if (error) {
    console.error('Error fetching rewards catalog:', error)
    return []
  }
  
  setServerCache(cacheKey, rewards || [], 2 * 60 * 60 * 1000) // 2 hours
  console.log('💾 Server cached: rewards catalog')
  return rewards || []
}

/**
 * Get cached user profile or fetch from database
 */
export async function getCachedUserProfileServer(userId: string) {
  const cacheKey = `profile:${userId}`
  const cached = getServerCache<any>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: user profile')
    return cached
  }
  
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  setServerCache(cacheKey, profile, 30 * 60 * 1000) // 30 minutes
  console.log('💾 Server cached: user profile')
  return profile
}

/**
 * Get cached user points or fetch from database
 */
export async function getCachedUserPointsServer(userId: string) {
  const cacheKey = `points:${userId}`
  const cached = getServerCache<number>(cacheKey)
  
  if (cached !== null && cached !== undefined) {
    console.log('✅ Server cache hit: user points')
    return cached
  }
  
  const supabase = await createClient()
  const { data: points, error } = await supabase
    .rpc('get_user_points', { p_user_id: userId })
  
  if (error) {
    console.error('Error fetching user points:', error)
    return 0
  }
  
  setServerCache(cacheKey, points || 0, 5 * 60 * 1000) // 5 minutes
  console.log('💾 Server cached: user points')
  return points || 0
}

/**
 * Get cached lifetime points or fetch from database
 */
export async function getCachedLifetimePointsServer(userId: string) {
  const cacheKey = `lifetime-points:${userId}`
  const cached = getServerCache<number>(cacheKey)
  
  if (cached !== null && cached !== undefined) {
    console.log('✅ Server cache hit: lifetime points')
    return cached
  }
  
  const supabase = await createClient()
  const { data: points, error } = await supabase
    .rpc('get_lifetime_points', { p_user_id: userId })
  
  if (error) {
    console.error('Error fetching lifetime points:', error)
    return 0
  }
  
  setServerCache(cacheKey, points || 0, 5 * 60 * 1000) // 5 minutes
  console.log('💾 Server cached: lifetime points')
  return points || 0
}

/**
 * Get cached coffee stamps or fetch from database
 */
export async function getCachedCoffeeStampsServer(userId: string) {
  const cacheKey = `stamps:${userId}`
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: coffee stamps')
    return cached
  }
  
  const supabase = await createClient()
  const { data: stamps, error } = await supabase
    .from('coffee_stamps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching coffee stamps:', error)
    return []
  }
  
  setServerCache(cacheKey, stamps || [], 5 * 60 * 1000) // 5 minutes
  console.log('💾 Server cached: coffee stamps')
  return stamps || []
}

/**
 * Get cached user badges or fetch from database
 */
export async function getCachedUserBadgesServer(userId: string) {
  const cacheKey = `badges:${userId}`
  const cached = getServerCache<any>(cacheKey)
  
  if (cached !== undefined) {
    console.log('✅ Server cache hit: user badges')
    return cached
  }
  
  const supabase = await createClient()
  const { data: badge, error } = await supabase
    .from('user_badges')
    .select('*, badge_tiers(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user badges:', error)
    return null
  }
  
  setServerCache(cacheKey, badge, 30 * 60 * 1000) // 30 minutes
  console.log('💾 Server cached: user badges')
  return badge
}

/**
 * Get cached check-in status or fetch from database
 * DISABLED CACHING - Always fetch fresh to avoid false "already checked in"
 */
export async function getCachedCheckInStatusServer(userId: string) {
  // CACHE DISABLED - Always fetch fresh check-in status
  // This prevents false "already checked in" errors from stale cache
  
  const supabase = await createClient()
  const { data: canCheckIn, error } = await supabase
    .rpc('can_check_in', { p_user_id: userId })
  
  if (error) {
    console.error('Error fetching check-in status:', error)
    return true
  }
  
  console.log('🔍 Fresh check-in status (no cache):', canCheckIn)
  return canCheckIn ?? true
}

/**
 * Get cached user rewards or fetch from database
 */
export async function getCachedUserRewardsServer(userId: string) {
  const cacheKey = `user-rewards:${userId}`
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: user rewards')
    return cached
  }
  
  const supabase = await createClient()
  const { data: rewards, error } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
  
  if (error) {
    console.error('Error fetching user rewards:', error)
    return []
  }
  
  setServerCache(cacheKey, rewards || [], 5 * 60 * 1000) // 5 minutes
  console.log('💾 Server cached: user rewards')
  return rewards || []
}

/**
 * Get cached game plays for today or fetch from database
 */
export async function getCachedGamePlaysTodayServer(userId: string) {
  const todayKey = new Date().toISOString().split('T')[0]
  const cacheKey = `gameplays:${userId}:${todayKey}`
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: game plays today')
    return cached
  }
  
  const supabase = await createClient()
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
  
  setServerCache(cacheKey, plays || [], 2 * 60 * 1000) // 2 minutes
  console.log('💾 Server cached: game plays today')
  return plays || []
}

/**
 * Get cached referral stats or fetch from database
 */
export async function getCachedReferralStatsServer(userId: string) {
  const cacheKey = `referrals:${userId}`
  const cached = getServerCache<any>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: referral stats')
    return cached
  }
  
  const supabase = await createClient()
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
  
  if (error) {
    console.error('Error fetching referrals:', error)
    return { total: 0, confirmed: 0, referrals: [] }
  }
  
  const stats = {
    total: referrals?.length || 0,
    confirmed: referrals?.filter(r => r.confirmed).length || 0,
    referrals: referrals || [],
  }
  
  setServerCache(cacheKey, stats, 30 * 60 * 1000) // 30 minutes
  console.log('💾 Server cached: referral stats')
  return stats
}

/**
 * Get cached check-in streak or fetch from database
 * Note: Using coffee_stamps as proxy for check-ins since check_ins table doesn't exist
 */
export async function getCachedCheckInStreakServer(userId: string) {
  const cacheKey = `streak:${userId}`
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: check-in streak')
    return cached
  }
  
  // Use coffee_stamps as a proxy for check-ins
  const supabase = await createClient()
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
  
  setServerCache(cacheKey, stamps || [], 2 * 60 * 1000) // 2 minutes
  console.log('💾 Server cached: check-in streak')
  return stamps || []
}

/**
 * Get cached available game (singular - one at a time)
 */
export async function getCachedAvailableGamesServer(userId: string) {
  const cacheKey = `available_game:${userId}`
  const cached = getServerCache<any[]>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: available game')
    return cached
  }
  
  const supabase = await createClient()
  const { data: game, error } = await supabase.rpc('get_available_game', {
    p_user_id: userId
  })
  
  if (error) {
    console.error('Error fetching available game:', error)
    return []
  }
  
  // Cache for 2 minutes
  setServerCache(cacheKey, game || [], 2 * 60 * 1000)
  console.log('💾 Server cached: available game')
  return game || []
}

/**
 * Get today's beans total
 */
export async function getCachedTodaysBeansServer(userId: string) {
  const cacheKey = `todays_beans:${userId}`
  const cached = getServerCache<number>(cacheKey)
  
  if (cached !== undefined) {
    console.log('✅ Server cache hit: todays beans')
    return cached
  }
  
  const supabase = await createClient()
  const { data: beans, error } = await supabase.rpc('get_todays_beans', {
    p_user_id: userId
  })
  
  if (error) {
    console.error('Error fetching todays beans:', error)
    return 0
  }
  
  // Cache for 1 minute
  setServerCache(cacheKey, beans || 0, 1 * 60 * 1000)
  console.log('💾 Server cached: todays beans')
  return beans || 0
}

/**
 * Get last game result
 */
export async function getCachedLastGameResultServer(userId: string) {
  const cacheKey = `last_game_result:${userId}`
  const cached = getServerCache<any>(cacheKey)
  
  if (cached) {
    console.log('✅ Server cache hit: last game result')
    return cached
  }
  
  const supabase = await createClient()
  const { data: result, error } = await supabase.rpc('get_last_game_result', {
    p_user_id: userId
  })
  
  if (error) {
    console.error('Error fetching last game result:', error)
    return null
  }
  
  // Cache for 1 minute
  const lastResult = result && result.length > 0 ? result[0] : null
  setServerCache(cacheKey, lastResult, 1 * 60 * 1000)
  console.log('💾 Server cached: last game result')
  return lastResult
}
