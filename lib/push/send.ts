/**
 * Push Notification Sending Service
 * Uses web-push library to send notifications
 */

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

// Configure VAPID details
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:nfdrepairs@gmail.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export interface PushNotificationPayload {
  title: string
  message: string
  url?: string
  icon?: string
  image?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{ action: string; title: string; icon?: string }>
}

export interface PushSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      message: payload.message,
      body: payload.message, // Alias for compatibility
      url: payload.url,
      icon: payload.icon || '/icon-192.png',
      image: payload.image,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions,
      timestamp: Date.now()
    })

    console.log('📤 Sending push notification:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      title: payload.title,
      message: payload.message
    })

    const result = await webpush.sendNotification(pushSubscription, notificationPayload)
    
    console.log('📬 Push notification sent successfully:', result)

    return { success: true }
  } catch (error: any) {
    console.error('❌ Push send error:', error, {
      statusCode: error.statusCode,
      body: error.body
    })

    // Handle specific errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or not found
      return { success: false, error: 'subscription_expired' }
    }

    return { success: false, error: error.message }
  }
}

/**
 * Send push notification to a user (all their devices)
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload,
  notificationId?: string
): Promise<{
  sent: number
  failed: number
  expired: number
}> {
  const supabase = await createAdminClient()

  // Get all active subscriptions for user
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  console.log(`Push send for user ${userId}:`, {
    error,
    subscriptionCount: subscriptions?.length || 0,
    subscriptions: subscriptions?.map(s => ({ id: s.id, endpoint: s.endpoint.substring(0, 50) }))
  })

  if (error || !subscriptions || subscriptions.length === 0) {
    console.log('No active subscriptions for user:', userId, error)
    return { sent: 0, failed: 0, expired: 0 }
  }

  let sent = 0
  let failed = 0
  let expired = 0

  // Send to each subscription
  for (const sub of subscriptions) {
    const result = await sendPushToSubscription(sub, payload)

    console.log(`Push result for subscription ${sub.id}:`, result)

    if (result.success) {
      sent++
      console.log('✅ Push sent successfully to subscription:', sub.id)

      // Log successful send
      await supabase.rpc('log_push_notification', {
        p_user_id: userId,
        p_subscription_id: sub.id,
        p_notification_id: notificationId || null,
        p_title: payload.title,
        p_message: payload.message,
        p_url: payload.url || null,
        p_status: 'sent'
      })

      // Update last used timestamp
      await supabase.rpc('update_push_subscription_used', {
        p_subscription_id: sub.id
      })
    } else {
      if (result.error === 'subscription_expired') {
        expired++

        // Deactivate expired subscription
        await supabase.rpc('deactivate_push_subscription', {
          p_endpoint: sub.endpoint
        })

        // Log failed send
        await supabase.rpc('log_push_notification', {
          p_user_id: userId,
          p_subscription_id: sub.id,
          p_notification_id: notificationId || null,
          p_title: payload.title,
          p_message: payload.message,
          p_url: payload.url || null,
          p_status: 'failed',
          p_error_message: 'Subscription expired'
        })
      } else {
        failed++

        // Log failed send
        await supabase.rpc('log_push_notification', {
          p_user_id: userId,
          p_subscription_id: sub.id,
          p_notification_id: notificationId || null,
          p_title: payload.title,
          p_message: payload.message,
          p_url: payload.url || null,
          p_status: 'failed',
          p_error_message: result.error
        })
      }
    }
  }

  return { sent, failed, expired }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload,
  notificationId?: string
): Promise<{
  totalSent: number
  totalFailed: number
  totalExpired: number
  userResults: Array<{ userId: string; sent: number; failed: number; expired: number }>
}> {
  let totalSent = 0
  let totalFailed = 0
  let totalExpired = 0
  const userResults = []

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload, notificationId)
    totalSent += result.sent
    totalFailed += result.failed
    totalExpired += result.expired
    userResults.push({ userId, ...result })
  }

  return { totalSent, totalFailed, totalExpired, userResults }
}

/**
 * Generate VAPID keys (run once during setup)
 * Usage: node -e "require('./lib/push/send').generateVapidKeys()"
 */
export function generateVapidKeys() {
  const keys = webpush.generateVAPIDKeys()
  console.log('VAPID Keys Generated:')
  console.log('Public Key:', keys.publicKey)
  console.log('Private Key:', keys.privateKey)
  console.log('\nAdd these to your .env.local:')
  console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
  return keys
}
