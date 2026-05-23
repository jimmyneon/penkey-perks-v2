/**
 * Unified Notification Sender
 * Sends notifications via push, email, and in-app channels
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
 * Automatically sends via push, email, and/or in-app based on template settings
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

    // 4. Queue Email
    if (channels.email) {
      try {
        // Find matching email template
        const { data: emailTemplate } = await supabase
          .from('email_templates')
          .select('id, subject, html_body')
          .eq('name', templateName)
          .eq('active', true)
          .single()

        if (emailTemplate) {
          // Get user email
          const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single()

          if (user?.email) {
            // Substitute variables in email
            let subject = emailTemplate.subject
            let htmlBody = emailTemplate.html_body

            for (const [key, value] of Object.entries(variables)) {
              const regex = new RegExp(`{{${key}}}`, 'g')
              subject = subject.replace(regex, String(value))
              htmlBody = htmlBody.replace(regex, String(value))
            }

            // Queue email
            const { data: queuedEmail, error: queueError } = await supabase
              .from('email_queue')
              .insert({
                template_id: emailTemplate.id,
                recipient_email: user.email,
                recipient_user_id: userId,
                subject,
                html_body: htmlBody,
                text_body: htmlBody.replace(/<[^>]*>/g, ''),
                variables,
                status: 'pending'
              })
              .select('id')
              .single()

            if (!queueError && queuedEmail) {
              results.email.sent = true
              results.email.id = queuedEmail.id
              console.log(`✅ Email queued for ${templateName}:`, queuedEmail.id)
            }
          }
        }
      } catch (error) {
        console.error(`❌ Email failed for ${templateName}:`, error)
      }
    }

    // 5. Create In-App Notification
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

    // 3. Queue Emails for All Customers
    if (channels.email) {
      const { data: customers } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'customer')

      if (customers && customers.length > 0) {
        // Get staff announcement email template
        const { data: emailTemplate } = await supabase
          .from('email_templates')
          .select('id')
          .eq('name', 'staff_announcement')
          .single()

        if (emailTemplate) {
          const emailInserts = customers.map(customer => ({
            template_id: emailTemplate.id,
            recipient_email: customer.email,
            recipient_user_id: customer.id,
            subject: title,
            html_body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #8B6F47;">${title}</h2>
                <p style="color: #333; line-height: 1.6;">${message}</p>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  - The Penkey Team
                </p>
              </div>
            `,
            text_body: `${title}\n\n${message}\n\n- The Penkey Team`,
            variables: { title, message },
            status: 'pending'
          }))

          const { error: queueError } = await supabase
            .from('email_queue')
            .insert(emailInserts)

          if (!queueError) {
            results.email.queued = emailInserts.length
            console.log(`✅ Staff emails queued: ${emailInserts.length}`)
          }
        }
      }
    }

    // 4. Log staff activity
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
