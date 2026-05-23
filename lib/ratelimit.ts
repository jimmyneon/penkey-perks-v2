/**
 * Simple in-memory rate limiter
 * FREE alternative to Upstash Redis
 * 
 * NOTE: This is suitable for single-server deployments (Vercel/Netlify).
 * For multi-server setups, use Vercel KV or Upstash Redis.
 */

class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private lastCleanup: number = Date.now();

  /**
   * Check if a request should be allowed based on rate limits
   * @param key - Unique identifier (e.g., IP address)
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false if rate limited
   */
  limit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const timestamps = this.requests.get(key) || [];
    
    // Filter out old requests outside the window
    const recentRequests = timestamps.filter(t => t > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      console.log(`[RateLimit] Blocked ${key}: ${recentRequests.length}/${maxRequests} requests`);
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    // Periodic cleanup (every 5 minutes)
    if (now - this.lastCleanup > 300000) {
      this.cleanup(windowStart);
      this.lastCleanup = now;
    }
    
    return true; // Allow request
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanup(before: number) {
    let cleaned = 0;
    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(t => t > before);
      if (recent.length === 0) {
        this.requests.delete(key);
        cleaned++;
      } else {
        this.requests.set(key, recent);
      }
    }
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats() {
    return {
      totalKeys: this.requests.size,
      totalRequests: Array.from(this.requests.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear() {
    this.requests.clear();
  }
}

// Singleton instance
const rateLimiter = new SimpleRateLimiter();

// Export rate limiters for different endpoints
export const searchRatelimit = {
  limit: (ip: string) => ({
    success: rateLimiter.limit(`search:${ip}`, 20, 60000) // 20 requests per minute
  })
};

export const awardPointsRatelimit = {
  limit: (ip: string) => ({
    success: rateLimiter.limit(`award:${ip}`, 10, 60000) // 10 requests per minute
  })
};

export const lookupRatelimit = {
  limit: (ip: string) => ({
    success: rateLimiter.limit(`lookup:${ip}`, 30, 60000) // 30 requests per minute
  })
};

export const nearbyRatelimit = {
  limit: (ip: string) => ({
    success: rateLimiter.limit(`nearby:${ip}`, 20, 60000) // 20 requests per minute
  })
};

// Export for monitoring/testing
export { rateLimiter };
