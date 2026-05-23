import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchesConditions, buildUserState, type UserState } from '@/lib/notification-matcher'

/**
 * Filter notifications to prevent duplicates of the same type
 * Rules:
 * - Only ONE time-based notification (morning/afternoon/evening/night)
 * - Only ONE weather-based notification
 * - Only ONE of each category (rewards, streaks, stamps, etc.)
 * - But ALLOW different categories to coexist for rotation
 */
function filterDuplicateTypes(notifications: any[]) {
  const seen = {
    timeOfDay: false,
    weather: false,
    rewards: false,
    streaks: false,
    stamps: false,
    checkin: false,
    games: false,
    milestones: false,
    custom: false
  }

  return notifications.filter((notification) => {
    const conditions = notification.conditions || {}
    const type = notification.type || 'custom'
    
    // Determine the primary category for this notification
    let category: keyof typeof seen | null = null
    
    // Priority order: most specific to least specific
    if (conditions.hasUnredeemedRewards || type === 'reward') {
      category = 'rewards'
    } else if (conditions.currentStreak || type === 'streak') {
      category = 'streaks'
    } else if (conditions.stampsUntilReward !== undefined || conditions.hasCoffeeStampToday !== undefined) {
      category = 'stamps'
    } else if (conditions.weather) {
      category = 'weather'
    } else if (conditions.timeOfDay && (conditions.hasCheckedInToday !== undefined || type === 'checkin')) {
      category = 'checkin'
    } else if (conditions.hasPlayedGameToday !== undefined || type === 'game') {
      category = 'games'
    } else if (conditions.lifetimePoints || type === 'milestone') {
      category = 'milestones'
    } else if (conditions.timeOfDay) {
      category = 'timeOfDay'
    } else {
      category = 'custom'
    }
    
    // Check if we've already seen this category
    if (category && seen[category]) {
      return false
    }
    
    // Mark this category as seen
    if (category) {
      seen[category] = true
    }
    
    return true
  })
}

export async function POST(request: Request) {
  try {
    const { userId, userState: rawUserState } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Build complete user state with calculated fields
    const userState = buildUserState(rawUserState || {})

    // First, deactivate any expired temporary notifications
    try {
      await supabase.rpc('deactivate_expired_temporary_notifications')
    } catch (err) {
      console.warn('Failed to deactivate expired notifications:', err)
    }

    // Get ALL active notifications from database
    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      )
    }

    // Get dismissed notifications for this user (within last 24 hours)
    const { data: dismissedNotifications } = await supabase
      .from('notification_dismissals')
      .select('notification_id')
      .eq('user_id', userId)
      .gte('dismissed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const dismissedIds = new Set(dismissedNotifications?.map(d => d.notification_id) || [])
    
    console.log('🚫 Dismissed notifications:', {
      count: dismissedIds.size,
      ids: Array.from(dismissedIds)
    })

    // Filter out dismissed notifications
    const nonDismissedNotifications = (allNotifications || []).filter(
      notification => !dismissedIds.has(notification.id)
    )

    // Filter by conditions (client-side matching with advanced operators)
    const matchingNotifications = nonDismissedNotifications.filter(notification => 
      matchesConditions(notification.conditions || {}, userState)
    )

    // Debug logging
    console.log('🎯 Notification matching:', {
      total: allNotifications?.length || 0,
      nonDismissed: nonDismissedNotifications.length,
      matched: matchingNotifications.length,
      userState: {
        hasUnredeemedRewards: userState.hasUnredeemedRewards,
        hoursUntilExpiry: userState.hoursUntilExpiry,
        daysUntilExpiry: userState.daysUntilExpiry,
        currentStreak: userState.currentStreak,
        timeOfDay: userState.timeOfDay,
        weather: userState.weather,
        allComplete: userState.allComplete
      },
      matchedTitles: matchingNotifications.slice(0, 5).map(n => n.title)
    })

    // Filter to prevent duplicate types (only one time-based, one weather, etc.)
    const filteredNotifications = filterDuplicateTypes(matchingNotifications)
    
    console.log('🔄 After filtering duplicates:', {
      beforeFilter: matchingNotifications.length,
      afterFilter: filteredNotifications.length,
      filteredTitles: filteredNotifications.map(n => n.title),
      filteredTypes: filteredNotifications.map(n => n.type)
    })
    
    // Smart prioritization - adjust priority based on urgency
    const prioritizedNotifications = filteredNotifications.map(notification => {
      let adjustedPriority = notification.priority
      
      // Boost priority for urgent items
      if (notification.type === 'reward' && userState.hasUnredeemedRewards) {
        adjustedPriority -= 2 // Higher priority (lower number)
      }
      
      if (notification.type === 'stamp' && userState.stampsUntilReward === 1) {
        adjustedPriority -= 3 // Very high priority
      }
      
      if (notification.type === 'streak' && (userState.currentStreak || 0) >= 7 && !userState.hasCheckedInToday) {
        adjustedPriority -= 2 // Don't lose streak!
      }
      
      // Reduce priority for less urgent
      if (notification.type === 'game' && userState.hasPlayedGameToday) {
        adjustedPriority += 5 // Already played
      }
      
      if (notification.type === 'checkin' && userState.hasCheckedInToday) {
        adjustedPriority += 3 // Already checked in
      }
      
      return {
        ...notification,
        originalPriority: notification.priority,
        adjustedPriority
      }
    })
    
    // Sort by adjusted priority
    const sortedNotifications = prioritizedNotifications.sort(
      (a, b) => a.adjustedPriority - b.adjustedPriority
    )
    
    // Randomize selection for variety, then take top 10 (increased from 5)
    const shuffled = sortedNotifications
      .slice(0, 15) // Take top 15 by priority
      .sort(() => Math.random() - 0.5) // Shuffle them
      .slice(0, 10) // Take random 10
    
    const topNotifications = shuffled
    
    // Mark temporary notifications as shown (first view timestamp)
    const temporaryNotifications = topNotifications.filter(n => n.is_temporary && !n.first_shown_at)
    if (temporaryNotifications.length > 0) {
      for (const notification of temporaryNotifications) {
        try {
          await supabase.rpc('mark_temporary_notification_shown', {
            p_notification_id: notification.id
          })
          console.log('⏰ Marked temporary notification as shown:', notification.title)
        } catch (err) {
          console.warn('Failed to mark temporary notification:', err)
        }
      }
    }
    
    console.log('📤 Returning notifications:', {
      count: topNotifications.length,
      titles: topNotifications.map(n => n.title),
      temporary: temporaryNotifications.length,
      willRotate: topNotifications.length > 1
    })
    
    return NextResponse.json(topNotifications)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
