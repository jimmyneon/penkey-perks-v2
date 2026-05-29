'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PushNotificationToggleProps {
  onToggle?: (enabled: boolean) => void
  disabled?: boolean
}

export function PushNotificationToggle({ onToggle, disabled }: PushNotificationToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if push notifications are supported
    const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      // Check current permission status
      setIsEnabled(Notification.permission === 'granted')
      checkSubscription()
    }
  }, [mounted])

  const checkSubscription = async () => {
    try {
      // First register the service worker if not already registered
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js')
      }
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsEnabled(!!subscription)
      console.log('Push subscription status:', !!subscription)
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

  const handleToggle = async () => {
    console.log('Push toggle clicked:', isEnabled)
    
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in your browser',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      if (!isEnabled) {
        console.log('Enabling push notifications...')
        
        // Enable push notifications
        const permission = await Notification.requestPermission()
        console.log('Permission result:', permission)

        if (permission !== 'granted') {
          toast({
            title: 'Permission Denied',
            description: 'Please enable notifications in your browser settings',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }

        // Register service worker
        console.log('Registering service worker...')
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service worker registered:', registration)
        await navigator.serviceWorker.ready

        // Get VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        console.log('VAPID key available:', !!vapidPublicKey)
        
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured. Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local')
        }

        // Subscribe to push
        console.log('Subscribing to push...')
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
        console.log('Push subscription created:', subscription)

        // Send subscription to server
        console.log('Saving subscription to server...')
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
          const errorData = await response.json()
          console.error('Server error:', errorData)
          throw new Error(errorData.error || 'Failed to save subscription')
        }

        console.log('Subscription saved successfully!')
        setIsEnabled(true)
        onToggle?.(true)

        toast({
          title: '🔔 Notifications Enabled!',
          description: 'You\'ll now receive push notifications for special offers and updates!',
        })
      } else {
        console.log('Disabling push notifications...')
        // Disable push notifications
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          await subscription.unsubscribe()

          // Notify server
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          })
        }

        setIsEnabled(false)
        onToggle?.(false)

        toast({
          title: 'Notifications Disabled',
          description: 'You won\'t receive push notifications anymore',
        })
      }
    } catch (error: any) {
      console.error('Push notification error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification settings',
        variant: 'destructive',
      })
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

  if (!isSupported) {
    return null // Don't show if not supported
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[14px] font-medium" style={{ color: '#1C2B3A' }}>Push Notifications</p>
        <p className="text-[12px]" style={{ color: '#8A96A0' }}>Get instant alerts about rewards and offers</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`w-12 h-7 rounded-full p-1 transition-all ${isEnabled ? 'bg-[#E07A3A]' : 'bg-[#E8E2D8]'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-all ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}
