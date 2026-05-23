import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin or staff role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check notifications table
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: false })
      .limit(1)

    if (notifError) {
      return NextResponse.json({ 
        error: 'Notifications table error', 
        details: notifError.message 
      }, { status: 500 })
    }

    // Check email_templates table
    const { data: emailTemplates, error: emailError } = await supabase
      .from('email_templates')
      .select('id', { count: 'exact', head: false })
      .limit(1)

    if (emailError) {
      return NextResponse.json({ 
        error: 'Email templates table error', 
        details: emailError.message 
      }, { status: 500 })
    }

    // Check push_subscriptions table
    const { data: pushSubs, error: pushError } = await supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: false })
      .limit(1)

    if (pushError) {
      return NextResponse.json({ 
        error: 'Push subscriptions table error', 
        details: pushError.message 
      }, { status: 500 })
    }

    // Get counts
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    const { count: emailCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact', head: true })

    const { count: pushCount } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)

    return NextResponse.json({
      success: true,
      notifications: notifCount || 0,
      emailTemplates: emailCount || 0,
      pushSubscriptions: pushCount || 0,
    })
  } catch (error: any) {
    console.error('Check tables error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
