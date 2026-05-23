import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys, userAgent, deviceName } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing required subscription data' },
        { status: 400 }
      )
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .single()

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent,
          device_name: deviceName,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        subscription: data,
        message: 'Subscription updated'
      })
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
        device_name: deviceName,
        active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      subscription: data,
      message: 'Subscription created'
    })

  } catch (error: any) {
    console.error('Push subscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
