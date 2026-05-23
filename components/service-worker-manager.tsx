'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerManager() {
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Check if we just reloaded due to SW update - prevent infinite loop
    const justReloaded = sessionStorage.getItem('sw-just-reloaded')
    if (justReloaded) {
      console.log('[SW Manager] Just reloaded, skipping controllerchange handler')
      sessionStorage.removeItem('sw-just-reloaded')
      return
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW Manager] Service Worker registered:', registration)

        // Check for updates periodically (every 5 minutes instead of 1 minute)
        setInterval(() => {
          registration.update()
        }, 300000)

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          console.log('[SW Manager] New service worker found, installing...')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Manager] New service worker installed, will activate on next page load')
              
              // Show toast notification about update
              toast({
                title: 'Update Available',
                description: 'A new version is available. Refresh to update.',
                duration: 10000,
              })
            }
          })
        })
      })
      .catch((error) => {
        console.error('[SW Manager] Service Worker registration failed:', error)
      })

    // Listen for controllerchange event (when new SW takes control)
    const handleControllerChange = () => {
      console.log('[SW Manager] New service worker activated, reloading page...')
      // Set flag before reload to prevent loop
      sessionStorage.setItem('sw-just-reloaded', 'true')
      window.location.reload()
    }
    
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    
    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SW_UPDATED') {
        console.log('[SW Manager] Service worker updated:', event.data.message)
      }
    })
  }, [toast])

  return null
}
