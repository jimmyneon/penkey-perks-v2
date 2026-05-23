import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, notificationId, actionType, metadata } = await request.json()

    if (!userId || !notificationId || !actionType) {
      return NextResponse.json(
        { error: 'User ID, Notification ID, and Action Type are required' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActionTypes = ['dismiss', 'click', 'convert']
    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { error: `Invalid action type. Must be one of: ${validActionTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert action record
    const { error } = await supabase
      .from('notification_actions')
      .insert({
        user_id: userId,
        notification_id: notificationId,
        action_type: actionType,
        action_at: new Date().toISOString(),
        metadata: metadata || null
      })

    if (error) {
      console.error('Error tracking action:', error)
      // Don't fail the request if tracking fails
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}
