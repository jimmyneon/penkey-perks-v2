/**
 * Unified Notification Sender
 * Sends notifications via push and in-app channels
 * Uses database templates and handles all messaging logic
 */

import { createAdminClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push/send'

export interface NotificationOptions {
  userId: string
  templateName: string // e.g., 'game_won', 'reward_earned'
  variables?: Record<string, any> // e.g., { beans: 50, rewardName: 'Free Coffee' }
  channels?: {
    push?: boolean
    email?: boolean
    inApp?: boolean
  }
  priority?: number // Override template priority
  expiresInHours?: number // How long the in-app notification stays visible
}

/**
 * Send notification using database template
 * Sends push and in-app notifications based on template settings
 */
export async function sendNotification(options: NotificationOptions) {
  const {
    userId,
    templateName,
    variables = {},
    channels = { push: true, email: false, inApp: true },
    priority,
    expiresInHours = 24
  } = options

  const supabase = await createAdminClient()
  const results = {
    push: { sent: false, count: 0 },
    email: { sent: false, id: null },
    inApp: { sent: false, id: null }
  }

  try {
    // 1. Get template from database
    const { data: template, error: templateError } = await supabase
      .from('push_notification_templates')
      .select('*')
      .eq('name', templateName)
      .eq('active', true)
      .single()

    if (templateError || !template) {
      console.error(`Template '${templateName}' not found:`, templateError)
      return results
    }

    // 2. Substitute variables in title and message
    let title = template.title
    let message = template.message

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      title = title.replace(regex, String(value))
      message = message.replace(regex, String(value))
    }

    // 3. Send Push Notification
    if (channels.push) {
      try {
        const pushResult = await sendPushToUser(userId, {
          title,
          message,
          url: template.url || '/dashboard',
          icon: template.icon || '/icon-192.png'
        })

        results.push.sent = pushResult.sent > 0
        results.push.count = pushResult.sent
        console.log(`✅ Push sent for ${templateName}:`, pushResult)
      } catch (error) {
        console.error(`❌ Push failed for ${templateName}:`, error)
      }
    }

    // 4. Create In-App Notification
    if (channels.inApp) {
      try {
        const endDate = new Date()
        endDate.setHours(endDate.getHours() + expiresInHours)

        const { data: notification, error: notifError } = await supabase
          .from('notifications')
          .insert({
            title,
            message,
            type: template.trigger_event || 'custom',
            priority: priority || template.priority || 50,
            active: true,
            dismissible: true,
            end_date: endDate.toISOString(),
            conditions: {
              // Target specific user (optional - can be used for filtering)
              targetUserId: userId
            },
            variant: 'default'
          })
          .select('id')
          .single()

        if (!notifError && notification) {
          results.inApp.sent = true
          results.inApp.id = notification.id
          console.log(`✅ In-app notification created for ${templateName}:`, notification.id)
        }
      } catch (error) {
        console.error(`❌ In-app notification failed for ${templateName}:`, error)
      }
    }

    return results

  } catch (error) {
    console.error(`❌ sendNotification failed for ${templateName}:`, error)
    return results
  }
}

/**
 * Send staff message to all customers
 * Creates a high-priority in-app notification that shows for all users
 */
export async function sendStaffMessage(options: {
  title: string
  message: string
  staffId: string
  channels?: {
    push?: boolean
    email?: boolean
    inApp?: boolean
  }
  priority?: number // Default: 80 (high priority, shows above most notifications)
  expiresInHours?: number // Default: 24 hours
}) {
  const {
    title,
    message,
    staffId,
    channels = { push: true, email: false, inApp: true },
    priority = 80, // High priority for staff messages
    expiresInHours = 24
  } = options

  const supabase = await createAdminClient()
  const results = {
    push: { sent: 0 },
    email: { queued: 0 },
    inApp: { created: false, id: null }
  }

  try {
    // 1. Create In-App Notification (shows for ALL users)
    if (channels.inApp) {
      const endDate = new Date()
      endDate.setHours(endDate.getHours() + expiresInHours)

      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type: 'custom', // Use 'custom' type for staff messages
          priority, // High priority ensures it shows above automated notifications
          active: true,
          dismissible: true,
          end_date: endDate.toISOString(),
          created_by: staffId,
          conditions: {}, // Empty conditions = shows for everyone
          variant: 'default'
        })
        .select('id')
        .single()

      if (!notifError && notification) {
        results.inApp.created = true
        results.inApp.id = notification.id
        console.log(`✅ Staff in-app notification created:`, notification.id)
      }
    }

    // 2. Send Push to All Customers
    if (channels.push) {
      const { data: customers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer')

      if (customers && customers.length > 0) {
        // Import here to avoid circular dependency
        const { sendPushToUsers } = await import('@/lib/push/send')
        
        const pushResult = await sendPushToUsers(
          customers.map(c => c.id),
          {
            title,
            message,
            url: '/dashboard',
            icon: '/icon-192.png'
          }
        )

        results.push.sent = pushResult.totalSent
        console.log(`✅ Staff push sent to ${pushResult.totalSent} users`)
      }
    }

    // 3. Log staff activity
    await supabase
      .from('staff_activity_log')
      .insert({
        staff_id: staffId,
        action: 'send_staff_message',
        details: {
          title,
          message,
          channels,
          priority,
          results
        }
      })

    return results

  } catch (error) {
    console.error('❌ sendStaffMessage failed:', error)
    return results
  }
}
