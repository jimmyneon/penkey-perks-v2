import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['staff', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, icon, type = 'custom' } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Insert into notifications table
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        type: type,
        title: title || 'Staff Message',
        message: message.trim(),
        icon: icon || '💬',
        variant: 'default',
        priority: 50,
        active: true,
        target_audience: 'all',
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating notification:', insertError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // Log staff activity
    await supabase
      .from('staff_activity_log')
      .insert({
        staff_id: user.id,
        action_type: 'send_message',
        details: {
          notification_id: notification.id,
          title: title,
          message_preview: message.substring(0, 100)
        }
      })

    return NextResponse.json({ 
      success: true, 
      notification,
      message: 'Message sent successfully'
    })

  } catch (error: any) {
    console.error('Error in send-message route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
