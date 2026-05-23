import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, notificationId, sessionId, userAgent } = await request.json()

    if (!userId || !notificationId) {
      return NextResponse.json(
        { error: 'User ID and Notification ID are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert view record
    const { error } = await supabase
      .from('notification_views')
      .insert({
        user_id: userId,
        notification_id: notificationId,
        session_id: sessionId || null,
        user_agent: userAgent || null,
        viewed_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error tracking view:', error)
      // Don't fail the request if tracking fails
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}
