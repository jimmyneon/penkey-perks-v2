import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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

    // Use admin client to bypass RLS
    const adminClient = await createAdminClient()

    // Get all active subscriptions
    const { data: subscriptions, error } = await adminClient
      .from('push_subscriptions')
      .select('*')
      .eq('active', true)

    console.log('Push subscriptions query:', { count: subscriptions?.length, error })

    if (error) {
      throw error
    }

    // Group by user
    const userCount = new Set(subscriptions?.map(s => s.user_id)).size

    return NextResponse.json({
      success: true,
      activeSubscriptions: subscriptions?.length || 0,
      uniqueUsers: userCount,
      subscriptions: subscriptions?.map(s => ({
        id: s.id,
        userId: s.user_id,
        deviceName: s.device_name,
        createdAt: s.created_at,
      }))
    })
  } catch (error: any) {
    console.error('Check subscriptions error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
