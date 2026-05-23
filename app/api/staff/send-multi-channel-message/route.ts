import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendStaffMessage } from '@/lib/messaging/send-notification'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff or admin
    const { data: profile } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, channels } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    if (!channels || (!channels.push && !channels.email && !channels.inApp)) {
      return NextResponse.json(
        { error: 'At least one channel must be selected' },
        { status: 400 }
      )
    }

    // Use unified messaging system
    const results = await sendStaffMessage({
      title,
      message,
      staffId: user.id,
      channels,
      priority: 80, // High priority for staff messages
      expiresInHours: 24 // Shows for 24 hours
    })

    return NextResponse.json({
      success: true,
      pushSent: results.push.sent,
      emailsQueued: results.email.queued,
      inAppCreated: results.inApp.created,
      message: 'Message sent successfully'
    })

  } catch (error: any) {
    console.error('Multi-channel send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
