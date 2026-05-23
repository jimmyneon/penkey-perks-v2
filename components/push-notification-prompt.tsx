'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Bell, BellOff, X, Gift, Coffee, Sparkles, Clock } from 'lucide-react'

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCount, setShowCount] = useState(0)
  const [lastShown, setLastShown] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side
    setIsClient(true)

    // Check if notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    // Check current permission
    setPermission(Notification.permission)

    // Check if already subscribed
    checkSubscription()
    
    // Load show count and last shown from localStorage
    const stored = localStorage.getItem('notification-prompt-data')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setShowCount(data.showCount || 0)
        setLastShown(data.lastShown || null)
      } catch (e) {
        console.error('Error parsing notification prompt data:', e)
      }
    }
  }, [])

  const checkSubscription = async () => {
    try {
      // Check if service worker and push manager are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Push notifications not supported')
        return
      }
      
      const registration = await navigator.serviceWorker.ready
      
      // Check if pushManager exists on registration (Safari may not have it)
      if (!registration.pushManager) {
        console.log('[Push] Push manager not available on this browser')
        return
      }
      
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeToPush = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('[Push] Starting subscription process...')
      
      // Check browser support
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported in this browser')
      }
      
      if (!('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser. Please use Chrome, Firefox, or Edge.')
      }
      
      // Request permission
      const permission = await Notification.requestPermission()
      console.log('[Push] Permission result:', permission)
      setPermission(permission)

      if (permission !== 'granted') {
        setError('Permission denied. Please enable notifications in your browser settings.')
        setIsLoading(false)
        return
      }

      // Register service worker
      console.log('[Push] Registering service worker...')
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      console.log('[Push] Service worker ready')
      
      // Check if pushManager is available (Safari compatibility)
      if (!registration.pushManager) {
        throw new Error('Push notifications are not supported in Safari on iOS. Please use Safari on macOS or another browser.')
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log('[Push] VAPID key available:', !!vapidPublicKey)
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured')
      }

      // Subscribe to push
      console.log('[Push] Subscribing to push notifications...')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
      console.log('[Push] Subscription created')

      // Send subscription to server
      console.log('[Push] Sending subscription to server...')
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          },
          userAgent: navigator.userAgent,
          deviceName: getDeviceName()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Push] Server error:', errorData)
        throw new Error(errorData.error || 'Failed to save subscription')
      }

      console.log('[Push] Subscription saved successfully!')
      setIsSubscribed(true)
      setIsDismissed(true) // Auto-dismiss after successful subscription

    } catch (error: any) {
      console.error('[Push] Subscription error:', error)
      setError(error.message || 'Failed to enable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe()

        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        })
      }

      setIsSubscribed(false)

    } catch (error: any) {
      console.error('Push unsubscribe error:', error)
      setError(error.message || 'Failed to disable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const getDeviceName = () => {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'Mobile'
    if (/tablet/i.test(ua)) return 'Tablet'
    return 'Desktop'
  }

  const handleDismiss = () => {
    const newShowCount = showCount + 1
    const now = Date.now()
    
    setIsDismissed(true)
    setShowCount(newShowCount)
    setLastShown(now)
    
    // Save to localStorage
    localStorage.setItem('notification-prompt-data', JSON.stringify({
      showCount: newShowCount,
      lastShown: now
    }))
  }

  // Don't render on server-side
  if (!isClient) {
    return null
  }

  // Don't show if notifications not supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }
  
  // Don't show if service workers or push manager not supported (Safari iOS)
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  // Don't show if already subscribed
  if (isSubscribed) {
    return null
  }

  // Don't show if permission already denied
  if (permission === 'denied') {
    return null
  }
  
  // Don't show if dismissed
  if (isDismissed) {
    return null
  }
  
  // Smart showing logic: Show once, then every 2 weeks if not enabled
  // First time: Show immediately (showCount = 0)
  // After dismissal: Wait 2 weeks (336 hours) before showing again
  
  // If shown before, check if enough time has passed
  if (lastShown) {
    const hoursSinceLastShown = (Date.now() - lastShown) / (1000 * 60 * 60)
    const twoWeeksInHours = 14 * 24 // 336 hours = 2 weeks
    
    if (hoursSinceLastShown < twoWeeksInHours) {
      return null // Don't show until 2 weeks have passed
    }
  }

  return (
    <Dialog open={!isDismissed} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-penkey-orange to-yellow-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Never Miss Out! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            Enable notifications to stay updated with your rewards and special offers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-penkey-orange/20">
            <p className="text-sm font-semibold text-penkey-dark mb-3">
              Get instant alerts about:
            </p>
            
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-penkey-orange" />
                </div>
                <span className="text-sm text-penkey-gray">New rewards & prizes available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-4 h-4 text-penkey-orange" />
                </div>
                <span className="text-sm text-penkey-gray">Free coffee & rewards earned</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-penkey-orange" />
                </div>
                <span className="text-sm text-penkey-gray">Exclusive special offers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-penkey-orange" />
                </div>
                <span className="text-sm text-penkey-gray">Limited-time deals & promotions</span>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-gray-500 text-center">
            You can disable notifications anytime in your browser settings
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="w-full bg-penkey-orange hover:bg-orange-600 text-white h-11"
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Enabling...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="w-full text-penkey-gray hover:text-penkey-dark"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {showCount > 0 ? "We'll ask again in 2 weeks" : "You can enable this later in settings"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
