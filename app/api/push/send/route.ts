import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPushToUser, sendPushToUsers } from '@/lib/push/send'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      userIds, 
      title, 
      message, 
      url, 
      icon,
      notificationId 
    } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const payload = {
      title,
      message,
      url: url || '/dashboard',
      icon: icon || '/icon-192.png'
    }

    let result

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      result = await sendPushToUsers(userIds, payload, notificationId)
    } else {
      // Send to all users (broadcast)
      const { data: allUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer')

      console.log('Broadcasting push to all customers:', allUsers?.length || 0)

      if (allUsers && allUsers.length > 0) {
        const ids = allUsers.map(u => u.id)
        result = await sendPushToUsers(ids, payload, notificationId)
      } else {
        result = { totalSent: 0, totalFailed: 0, totalExpired: 0 }
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: `Sent to ${result.totalSent} device(s), ${result.totalFailed} failed, ${result.totalExpired} expired`
    })

  } catch (error: any) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send push notification' },
      { status: 500 }
    )
  }
}
