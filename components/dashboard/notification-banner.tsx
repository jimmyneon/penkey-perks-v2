'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Gift, Flame, Coffee, MapPin, Sparkles, Award, TrendingUp, Calendar, Trophy, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationBannerProps {
  userId: string
  hasCheckedInToday: boolean
  hasCoffeeStampToday: boolean
  hasPlayedGameToday: boolean
  currentStreak: number
  streakType: 'daily' | 'weekly' | 'monthly' | null
  nextMilestone?: {
    type: string
    value: number
    current: number
  }
  hasUnredeemedRewards?: boolean
  stampsUntilReward?: number
  rewardExpiryDate?: string | null
  currentPoints?: number
  lifetimePoints?: number
}

export function NotificationBanner({
  userId,
  hasCheckedInToday,
  hasCoffeeStampToday,
  hasPlayedGameToday,
  currentStreak,
  streakType,
  nextMilestone,
  hasUnredeemedRewards = false,
  stampsUntilReward = 10,
  rewardExpiryDate = null,
  currentPoints = 0,
  lifetimePoints = 0
}: NotificationBannerProps) {
  // State for database notification (SERVER-SIDE ONLY)
  const [dbNotification, setDbNotification] = useState<any>(null)
  const [allNotifications, setAllNotifications] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [weather, setWeather] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [mouseStart, setMouseStart] = useState(0)
  const [mouseEnd, setMouseEnd] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch weather data (cache for 30 minutes)
  useEffect(() => {
    const cachedWeather = localStorage.getItem('weather-cache')
    if (cachedWeather) {
      try {
        const { data, timestamp } = JSON.parse(cachedWeather)
        const age = Date.now() - timestamp
        if (age < 30 * 60 * 1000) { // 30 minutes
          console.log('🌤️ Using cached weather (age:', Math.floor(age / 60000), 'min)')
          setWeather(data)
          return
        }
      } catch (e) {
        // Invalid cache, fetch fresh
      }
    }
    fetchWeather()
  }, [])

  // Fetch notification from database (cache for 2 minutes - fresher content)
  useEffect(() => {
    // Add timestamp to cache key to force refresh every 2 minutes
    const cacheTimestamp = Math.floor(Date.now() / (2 * 60 * 1000))
    const cacheKey = `notifications-${userId}-${cacheTimestamp}`
    const cached = sessionStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        if (age < 2 * 60 * 1000) { // 2 minutes (reduced from 5)
          console.log('📦 Using cached notifications (age:', Math.floor(age / 60000), 'min)')
          const notifications = Array.isArray(data) ? data : (data ? [data] : [])
          setAllNotifications(notifications)
          setDbNotification(notifications[0] || null)
          setLoading(false)
          return
        }
      } catch (e) {
        // Invalid cache, fetch fresh
      }
    }
    
    fetchNotification()
  }, [userId, hasUnredeemedRewards, currentStreak, hasCheckedInToday, hasPlayedGameToday, weather])

  // Rotate notifications every 10 seconds
  useEffect(() => {
    console.log('🔄 Rotation setup:', {
      notificationCount: allNotifications.length,
      willRotate: allNotifications.length > 1,
      notifications: allNotifications.map(n => n?.title),
      currentIndex
    })

    if (allNotifications.length <= 1) {
      console.log('⏸️ Not rotating - only', allNotifications.length, 'notification(s)')
      // Reset index to 0 if we only have one notification
      setCurrentIndex(0)
      return
    }

    console.log('✅ Starting rotation with', allNotifications.length, 'notifications')
    const interval = setInterval(() => {
      if (!isPaused && !isHovering) {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % allNotifications.length
          console.log('🔄 Rotating from', prev, 'to', next)
          return next
        })
      }
    }, 4500) // Rotate every 4.5 seconds (faster, more engaging)

    return () => {
      console.log('🛑 Stopping rotation interval')
      clearInterval(interval)
    }
  }, [allNotifications.length, isPaused, isHovering])

  const fetchWeather = async () => {
    try {
      const response = await fetch('/api/weather')
      if (response.ok) {
        const data = await response.json()
        setWeather(data)
        
        // Cache for 30 minutes
        localStorage.setItem('weather-cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }))
        console.log('🌤️ Weather data fetched and cached:', data)
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    }
  }

  const fetchNotification = async () => {
    try {
      setLoading(true)
      setFetchError(false)

      // Calculate time of day for conditions
      const hour = new Date().getHours()
      let timeOfDay = 'night'
      if (hour >= 5 && hour < 12) timeOfDay = 'morning'
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
      else timeOfDay = 'night' // After 5 PM or before 5 AM = closed

      const userState = {
        hasUnredeemedRewards,
        currentStreak,
        hasCheckedInToday,
        hasCoffeeStampToday,
        hasPlayedGameToday,
        stampsUntilReward,
        rewardExpiryDate,
        currentPoints,
        lifetimePoints,
        timeOfDay, // Add time of day for server-side matching
        weather: weather?.weather || 'unknown', // Add weather condition
        temperature: weather?.temperature || null, // Add temperature
        hoursUntilExpiry: rewardExpiryDate 
          ? Math.floor((new Date(rewardExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60))
          : null,
        daysUntilExpiry: rewardExpiryDate
          ? Math.floor((new Date(rewardExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        allComplete: hasCheckedInToday && hasCoffeeStampToday && hasPlayedGameToday
      }

      const response = await fetch('/api/notifications/get-for-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userState })
      })

      if (!response.ok) throw new Error('Failed to fetch notification')

      const data = await response.json()
      
      // Handle both single notification and array
      let notifications = Array.isArray(data) ? data : (data ? [data] : [])
      
      // Remove duplicates based on notification ID
      const uniqueNotifications = notifications.reduce((acc: any[], current: any) => {
        const exists = acc.find(item => item?.id === current?.id)
        if (!exists && current?.id) {
          return [...acc, current]
        }
        return acc
      }, [])
      
      // If we filtered out duplicates, log it
      if (notifications.length !== uniqueNotifications.length) {
        console.log('🔍 Filtered duplicates:', notifications.length, '→', uniqueNotifications.length)
      }
      
      setAllNotifications(uniqueNotifications)
      setDbNotification(uniqueNotifications[0] || null)
      
      // Cache for 2 minutes (fresher content)
      const cacheTimestamp = Math.floor(Date.now() / (2 * 60 * 1000))
      const cacheKey = `notifications-${userId}-${cacheTimestamp}`
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
      
      // DEBUG: Log what we got from database
      console.log('🔍 Database notifications fetched and cached:', notifications)
      console.log('🔍 Count:', notifications.length)
      console.log('🔍 Notification titles:', notifications.map(n => n?.title))
      console.log('🔍 User state sent:', userState)

      // Track view if notification exists (server-side analytics)
      if (data?.id) {
        const sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID()
        sessionStorage.setItem('sessionId', sessionId)
        
        fetch('/api/notifications/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            notificationId: data.id,
            sessionId,
            userAgent: navigator.userAgent
          })
        }).catch(err => {
          console.error('Failed to track view:', err)
          // Log to monitoring service in production
        })
      }
      
      // Check if dismissed (server-side check)
      if (data?.id) {
        checkServerDismissal(data.id)
      }

    } catch (error) {
      console.error('❌ Error fetching notification:', error)
      setFetchError(true)
      console.log('⚠️ Using fallback due to error')
    } finally {
      setLoading(false)
    }
  }
  
  // Check dismissal status from server (not localStorage)
  const checkServerDismissal = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/check-dismissal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId })
      })
      
      if (response.ok) {
        const { dismissed } = await response.json()
        setIsDismissed(dismissed)
      }
    } catch (error) {
      console.error('Failed to check dismissal:', error)
      // Fallback to localStorage with 30-minute timeout
      const dismissKey = `notification-dismissed-${notificationId}`
      const dismissDataStr = localStorage.getItem(dismissKey)
      if (dismissDataStr) {
        try {
          const dismissData = JSON.parse(dismissDataStr)
          const expiresAt = new Date(dismissData.expiresAt)
          const isExpired = Date.now() > expiresAt.getTime()
          
          if (isExpired) {
            // Timeout expired, remove from localStorage
            localStorage.removeItem(dismissKey)
            setIsDismissed(false)
          } else {
            // Still within 30-minute timeout
            setIsDismissed(true)
          }
        } catch (e) {
          // Old format or invalid data, remove it
          localStorage.removeItem(dismissKey)
          setIsDismissed(false)
        }
      }
    }
  }

  // Variable substitution for dynamic content
  const substituteVariables = (text: string): string => {
    if (!text) return ''
    
    let result = text
    
    // Replace {{variable}} with actual values
    const variables: Record<string, any> = {
      currentStreak,
      hoursUntilExpiry: rewardExpiryDate 
        ? Math.floor((new Date(rewardExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60))
        : 0,
      daysUntilExpiry: rewardExpiryDate
        ? Math.floor((new Date(rewardExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
      stampsUntilReward,
      currentPoints,
      lifetimePoints,
    }
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    }
    
    return result
  }
  // REMOVED: 285-line hardcoded fallback function
  // All notifications now come from database only

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { text: 'Monthly Warrior', icon: '🏆', color: 'bg-purple-500' }
    if (streak >= 14) return { text: 'Fortnight Champion', icon: '💪', color: 'bg-blue-500' }
    if (streak >= 7) return { text: 'Weekly Hero', icon: '⭐', color: 'bg-green-500' }
    if (streak >= 3) return { text: 'On Fire', icon: '🔥', color: 'bg-orange-500' }
    return null
  }

  // SERVER-SIDE ONLY: Use database notification, no fallback
  const notification = (!loading && allNotifications.length > 0) ? allNotifications[currentIndex] : null
  const streakBadge = currentStreak >= 3 ? getStreakBadge(currentStreak) : null
  
  // DEBUG: Log which notification is being used
  console.log('📊 Notification source:', {
    loading,
    hasDbNotification: !!dbNotification,
    hasFetchError: fetchError,
    usingDatabase: (!loading && dbNotification),
    usingFallback: fetchError,
    notificationTitle: notification?.title
  })

  // Server-side dismissal with 30-minute timeout
  const handleDismiss = async () => {
    if (!notification?.id) return
    
    // Immediate UI feedback
    setIsDismissed(true)
    
    // Track dismiss action for analytics
    fetch('/api/notifications/track-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notificationId: notification.id,
        actionType: 'dismiss',
        metadata: { variant: notification.variant, type: notification.type }
      })
    }).catch(err => console.error('Failed to track dismiss:', err))
    
    // Store dismissal with 30-minute timeout
    const dismissKey = `notification-dismissed-${notification.id}`
    const dismissData = {
      dismissedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    }
    localStorage.setItem(dismissKey, JSON.stringify(dismissData))
    
    // Sync to server (primary)
    try {
      const response = await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          notificationId: notification.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Server dismissal failed')
      }
    } catch (error) {
      console.error('Failed to dismiss notification on server:', error)
    }
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // Don't show while loading or if dismissed
  if (loading || isDismissed) {
    return null
  }
  
  // Don't show if no notification (server returned nothing)
  if (!notification) {
    return null
  }

  const variantStyles: Record<string, string> = {
    default: 'bg-gradient-to-r from-penkey-orange/20 via-penkey-cream to-penkey-orange/20 border-penkey-orange/40 shadow-lg',
    streak: 'bg-gradient-to-r from-orange-500/20 via-red-500/15 to-yellow-500/20 border-orange-500/60 shadow-xl',
    success: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40 shadow-lg',
    reward: 'bg-gradient-to-r from-penkey-orange/30 via-yellow-500/20 to-penkey-orange/30 border-penkey-orange shadow-xl'
  }

  const variantClass = variantStyles[notification.variant] || variantStyles.default

  // Get current notification from rotation
  const currentNotification = allNotifications[currentIndex] || notification
  
  // DEBUG: Log current notification details
  console.log('📍 Current notification:', {
    index: currentIndex,
    total: allNotifications.length,
    title: currentNotification?.title,
    id: currentNotification?.id,
    allTitles: allNotifications.map(n => n?.title)
  })

  // Animation variants based on notification type
  const getAnimationVariant = () => {
    if (currentNotification?.variant === 'reward') {
      return {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 15 } },
        exit: { scale: 0, opacity: 0 }
      }
    }
    if (currentNotification?.variant === 'streak') {
      return {
        initial: { y: -50, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
        exit: { y: 50, opacity: 0 }
      }
    }
    // Default slide
    return {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 }
    }
  }

  const animationVariant = getAnimationVariant()

  // Manual navigation handlers
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allNotifications.length) % allNotifications.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allNotifications.length)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      handleNext()
    }
    if (isRightSwipe) {
      handlePrevious()
    }
    
    // Reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setMouseStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setMouseEnd(e.clientX)
    // Calculate drag offset for visual feedback
    const offset = e.clientX - mouseStart
    setDragOffset(Math.max(-100, Math.min(100, offset)))
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (!mouseStart || !mouseEnd) return
    
    const distance = mouseStart - mouseEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      handleNext()
    }
    if (isRightSwipe) {
      handlePrevious()
    }
    
    // Reset
    setMouseStart(0)
    setMouseEnd(0)
    setDragOffset(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setMouseStart(0)
      setMouseEnd(0)
      setDragOffset(0)
    }
    setIsHovering(false)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentNotification?.id || 'fallback'}
        initial={animationVariant.initial}
        animate={isDragging ? { x: dragOffset, opacity: 1 } : animationVariant.animate}
        exit={animationVariant.exit}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className={`border-2 ${variantClass} relative h-[140px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]`}>
          {/* Animated border glow for rewards */}
          {currentNotification?.variant === 'reward' && (
            <motion.div
              className="absolute inset-0 border-2 border-orange-400/50 rounded-xl pointer-events-none"
              animate={{
                borderColor: ['rgba(251, 146, 60, 0.5)', 'rgba(251, 146, 60, 0)', 'rgba(251, 146, 60, 0.5)']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          {/* Shimmer effect for all variants */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2
            }}
          />
          
          <CardContent className="p-4 sm:p-5 relative z-10 h-full flex items-center">
            <div className="flex items-center gap-3 sm:gap-4 w-full">
              {/* Message - Fixed layout with consistent spacing */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <motion.div 
                  className="flex items-center gap-2 flex-wrap mb-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="font-bold text-penkey-dark text-lg sm:text-xl leading-tight line-clamp-1">
                    {substituteVariables(currentNotification.title)}
                  </h3>
                  {currentNotification.badge && (
                    <motion.span 
                      className={`text-xs px-2 py-1 rounded-full ${currentNotification.badge.color} text-white font-medium whitespace-nowrap`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      {currentNotification.badge.icon} {currentNotification.badge.text}
                    </motion.span>
                  )}
                </motion.div>
                <motion.p 
                  className="text-base sm:text-lg text-penkey-gray leading-relaxed pr-8 sm:pr-12 line-clamp-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {substituteVariables(currentNotification.message)}
                </motion.p>
                
                {/* Action Button for Rewards */}
                {currentNotification.variant === 'reward' && (
                  <div className="mt-3">
                    <Link 
                      href="/rewards"
                      onClick={() => {
                        // Track click action for analytics
                        if (currentNotification.id) {
                          fetch('/api/notifications/track-action', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId,
                              notificationId: currentNotification.id,
                              actionType: 'click',
                              metadata: { destination: '/rewards', variant: currentNotification.variant }
                            })
                          }).catch(err => console.error('Failed to track click:', err))
                        }
                      }}
                    >
                      <Button className="h-9 bg-penkey-orange hover:bg-penkey-orange/90" size="sm">
                        <Gift className="w-4 h-4 mr-2" />
                        View My Rewards
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Dismiss Button - Fixed position */}
              {currentNotification.dismissible && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* Simple Progress Indicator - Bottom Center */}
            {allNotifications.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {allNotifications.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-penkey-orange w-8' 
                        : 'bg-gray-300 w-1'
                    }`}
                    animate={{
                      scale: index === currentIndex ? 1 : 0.8
                    }}
                  />
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
