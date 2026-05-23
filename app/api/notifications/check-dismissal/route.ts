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

    // Check if notification was dismissed in last 24 hours
    const { data, error } = await supabase
      .from('notification_dismissals')
      .select('dismissed_at')
      .eq('user_id', userId)
      .eq('notification_id', notificationId)
      .gte('dismissed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (error) {
      console.error('Error checking dismissal:', error)
      // Don't fail - return not dismissed
      return NextResponse.json({ dismissed: false })
    }

    return NextResponse.json({ dismissed: !!data })

  } catch (error: any) {
    console.error('Unexpected error checking dismissal:', error)
    return NextResponse.json(
      { dismissed: false }, // Fail open - show notification
      { status: 200 }
    )
  }
}
