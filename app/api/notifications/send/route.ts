import { NextResponse } from 'next/server'
import { sendNotification } from '@/lib/messaging/send-notification'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Check for cron secret (for database triggers)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Allow cron/database triggers to call this endpoint
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Authenticated via cron secret - allow the request
      const body = await request.json()
      const { userId, templateName, variables, channels, priority, expiresInHours } = body

      if (!userId || !templateName) {
        return NextResponse.json({ 
          error: 'userId and templateName are required' 
        }, { status: 400 })
      }

      console.log('📧 Sending notification (via trigger):', { userId, templateName, channels })

      // Send notification using the unified system
      const results = await sendNotification({
        userId,
        templateName,
        variables,
        channels,
        priority,
        expiresInHours
      })

      console.log('✅ Notification results:', results)

      return NextResponse.json({
        success: true,
        results
      })
    }
    
    // Otherwise, require user authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff/admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, templateName, variables, channels, priority, expiresInHours } = body

    if (!userId || !templateName) {
      return NextResponse.json({ 
        error: 'userId and templateName are required' 
      }, { status: 400 })
    }

    console.log('📧 Sending notification:', { userId, templateName, channels })

    // Send notification using the unified system
    const results = await sendNotification({
      userId,
      templateName,
      variables,
      channels,
      priority,
      expiresInHours
    })

    console.log('✅ Notification results:', results)

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('❌ Send notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}
