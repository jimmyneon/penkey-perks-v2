// =============================================
// SERVICE WORKER FOR PUSH NOTIFICATIONS
// =============================================
// Handles push events and notification clicks
// =============================================

const CACHE_NAME = 'penkey-v3' // Increment version for updates
const APP_URL = self.location.origin

// Install event - DON'T auto-update, wait for user action
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version...')
  // Don't use skipWaiting() - let the page control when to activate
  // This prevents the infinite reload loop
})

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new version...')
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients immediately
      clients.claim()
    ])
  )
  
  // Notify all clients about the update
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_UPDATED',
          message: 'Service worker updated successfully'
        })
      })
    })
  )
})

// Push event - Receive and display notification
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received:', event)
  
  try {
    if (event.data) {
      const data = event.data.json()
      console.log('📦 Push data:', data)
      
      const options = {
        body: data.message || data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        image: data.image,
        tag: data.tag || 'penkey-notification',
        requireInteraction: data.requireInteraction || false,
        vibrate: [200, 100, 200], // Vibration pattern
        data: {
          url: data.url || '/dashboard',
          timestamp: data.timestamp || Date.now()
        }
      }

      console.log('📢 Showing notification:', data.title, options)

      event.waitUntil(
        self.registration.showNotification(
          data.title || 'Penkey Perks',
          options
        ).then(() => console.log('✅ Notification shown'))
          .catch(err => console.error('❌ Error showing notification:', err))
      )
    } else {
      console.log('⚠️ Push event has no data')
    }
  } catch (error) {
    console.error('[Service Worker] Error processing push:', error)
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action)
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || `${APP_URL}/dashboard`
  const notificationId = event.notification.data?.notificationId

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
      .then(() => {
        // Track click (optional - can send to analytics endpoint)
        if (notificationId) {
          fetch(`${APP_URL}/api/push/track-click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationId,
              timestamp: Date.now()
            })
          }).catch(err => console.error('[Service Worker] Failed to track click:', err))
        }
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed')
  
  const notificationId = event.notification.data?.notificationId
  
  if (notificationId) {
    // Track dismissal (optional)
    fetch(`${APP_URL}/api/push/track-dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId,
        timestamp: Date.now()
      })
    }).catch(err => console.error('[Service Worker] Failed to track dismiss:', err))
  }
})

// Background sync (optional - for offline support)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Sync any pending notifications
      Promise.resolve()
    )
  }
})

console.log('[Service Worker] Loaded and ready')
