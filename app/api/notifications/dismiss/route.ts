import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, notificationId } = await request.json()

    if (!userId || !notificationId) {
      return NextResponse.json(
        { error: 'User ID and Notification ID are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert dismissal record (or update if exists due to UNIQUE constraint)
    const { error } = await supabase
      .from('notification_dismissals')
      .upsert({
        user_id: userId,
        notification_id: notificationId,
        dismissed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_id'
      })

    if (error) {
      console.error('Error dismissing notification:', error)
      return NextResponse.json(
        { error: 'Failed to dismiss notification', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
