'use client'

import { useEffect } from 'react'
import { initCache } from '@/lib/cache'

export function CacheProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize cache system on mount
    initCache()
    
    // Clean up expired cache every 5 minutes
    const interval = setInterval(() => {
      initCache()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return <>{children}</>
}
