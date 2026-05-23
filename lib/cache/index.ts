/**
 * Centralized Cache Management System
 * 
 * Provides a unified interface for caching data with automatic expiration,
 * invalidation, and cleanup. Supports both localStorage and sessionStorage.
 */

export type CacheStorage = 'local' | 'session'

export interface CacheOptions {
  storage?: CacheStorage
  duration?: number // milliseconds
  version?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
  expiresAt: number
}

const DEFAULT_VERSION = '1.0'

/**
 * Get cached data
 */
export function getCache<T>(
  key: string,
  options: CacheOptions = {}
): T | null {
  const {
    storage = 'session',
    duration = 5 * 60 * 1000, // 5 minutes default
    version = DEFAULT_VERSION,
  } = options

  try {
    // Check if we're on the server (no window object)
    if (typeof window === 'undefined') {
      return null
    }
    
    const storageObj = storage === 'local' ? localStorage : sessionStorage
    const cached = storageObj.getItem(`cache:${key}`)

    if (!cached) {
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(cached)

    // Check version
    if (entry.version !== version) {
      console.log(`🗑️ Cache version mismatch for ${key}, clearing`)
      storageObj.removeItem(`cache:${key}`)
      return null
    }

    // Check expiration
    const now = Date.now()
    if (now > entry.expiresAt) {
      console.log(`⏰ Cache expired for ${key}`)
      storageObj.removeItem(`cache:${key}`)
      return null
    }

    const age = Math.floor((now - entry.timestamp) / 1000)
    console.log(`✅ Cache hit for ${key} (age: ${age}s)`)
    return entry.data
  } catch (error) {
    console.error(`❌ Error reading cache for ${key}:`, error)
    return null
  }
}

/**
 * Set cached data
 */
export function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const {
    storage = 'session',
    duration = 5 * 60 * 1000, // 5 minutes default
    version = DEFAULT_VERSION,
  } = options

  try {
    // Check if we're on the server (no window object)
    if (typeof window === 'undefined') {
      return
    }
    
    const storageObj = storage === 'local' ? localStorage : sessionStorage
    const now = Date.now()

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      version,
      expiresAt: now + duration,
    }

    storageObj.setItem(`cache:${key}`, JSON.stringify(entry))
    console.log(`💾 Cached ${key} for ${Math.floor(duration / 1000)}s`)
  } catch (error) {
    console.error(`❌ Error setting cache for ${key}:`, error)
  }
}

/**
 * Invalidate (remove) cached data
 */
export function invalidateCache(
  key: string,
  storage: CacheStorage = 'session'
): void {
  try {
    // Check if we're on the server (no window object)
    if (typeof window === 'undefined') {
      return
    }
    
    const storageObj = storage === 'local' ? localStorage : sessionStorage
    storageObj.removeItem(`cache:${key}`)
    console.log(`🗑️ Invalidated cache for ${key}`)
  } catch (error) {
    console.error(`❌ Error invalidating cache for ${key}:`, error)
  }
}

/**
 * Invalidate multiple cache keys matching a pattern
 */
export function invalidateCachePattern(
  pattern: string,
  storage: CacheStorage = 'session'
): void {
  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage
    const keys = Object.keys(storageObj)
    const cacheKeys = keys.filter(key => 
      key.startsWith('cache:') && key.includes(pattern)
    )

    cacheKeys.forEach(key => {
      storageObj.removeItem(key)
    })

    console.log(`🗑️ Invalidated ${cacheKeys.length} cache entries matching "${pattern}"`)
  } catch (error) {
    console.error(`❌ Error invalidating cache pattern ${pattern}:`, error)
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(storage?: CacheStorage): void {
  try {
    if (storage === 'local' || !storage) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
      keys.forEach(key => localStorage.removeItem(key))
      console.log(`🗑️ Cleared ${keys.length} localStorage cache entries`)
    }

    if (storage === 'session' || !storage) {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith('cache:'))
      keys.forEach(key => sessionStorage.removeItem(key))
      console.log(`🗑️ Cleared ${keys.length} sessionStorage cache entries`)
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanExpiredCache(): void {
  try {
    const now = Date.now()
    let cleaned = 0

    // Clean localStorage
    const localKeys = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
    localKeys.forEach(key => {
      try {
        const entry = JSON.parse(localStorage.getItem(key)!)
        if (entry.expiresAt && now > entry.expiresAt) {
          localStorage.removeItem(key)
          cleaned++
        }
      } catch (e) {
        // Invalid entry, remove it
        localStorage.removeItem(key)
        cleaned++
      }
    })

    // Clean sessionStorage
    const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('cache:'))
    sessionKeys.forEach(key => {
      try {
        const entry = JSON.parse(sessionStorage.getItem(key)!)
        if (entry.expiresAt && now > entry.expiresAt) {
          sessionStorage.removeItem(key)
          cleaned++
        }
      } catch (e) {
        // Invalid entry, remove it
        sessionStorage.removeItem(key)
        cleaned++
      }
    })

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`)
    }
  } catch (error) {
    console.error('❌ Error cleaning expired cache:', error)
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const localKeys = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
  const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('cache:'))

  const now = Date.now()
  let expired = 0
  let valid = 0

  const allKeys = localKeys.concat(sessionKeys)
  allKeys.forEach(key => {
    try {
      const storage = localKeys.includes(key) ? localStorage : sessionStorage
      const entry = JSON.parse(storage.getItem(key)!)
      if (entry.expiresAt && now > entry.expiresAt) {
        expired++
      } else {
        valid++
      }
    } catch (e) {
      expired++
    }
  })

  return {
    total: localKeys.length + sessionKeys.length,
    localStorage: localKeys.length,
    sessionStorage: sessionKeys.length,
    valid,
    expired,
  }
}

/**
 * Initialize cache system (call on app mount)
 */
export function initCache(): void {
  console.log('🚀 Initializing cache system...')
  cleanExpiredCache()
  const stats = getCacheStats()
  console.log('📊 Cache stats:', stats)
}
