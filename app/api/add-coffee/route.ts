import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { invalidateAfterCoffeeStamp } from '@/lib/cache/invalidation'
import { isWithinBusinessHours, getBusinessHoursMessage } from '@/lib/business-hours'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check business hours
    if (!isWithinBusinessHours()) {
      return NextResponse.json(
        { error: `Penkey is currently closed. ${getBusinessHoursMessage()}` },
        { status: 400 }
      )
    }

    // Get GPS coordinates from request
    let latitude, longitude
    try {
      const body = await request.json()
      latitude = body.latitude
      longitude = body.longitude
    } catch (e) {
      // No coordinates provided
      latitude = null
      longitude = null
    }

    // Require GPS coordinates for location validation
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return NextResponse.json(
        { error: 'Location required. Please enable GPS.' },
        { status: 400 }
      )
    }

    // Check 1-hour cooldown
    const { data: lastStamp } = await supabase
      .from('coffee_stamps')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastStamp) {
      const hoursSinceLastStamp = (Date.now() - new Date(lastStamp.created_at).getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastStamp < 1) {
        return NextResponse.json(
          { error: 'You can only add one stamp per hour. Please wait a bit!' },
          { status: 400 }
        )
      }
    }

    // Call database function to add stamp with validation
    const { data, error } = await supabase
      .rpc('add_coffee_stamp', {
        p_user_id: user.id,
        p_latitude: latitude,
        p_longitude: longitude
      })

    if (error) throw error

    // Parse the JSONB response
    const result = data as {
      success: boolean
      error?: string
      stamp_count?: number
      milestone_reached?: boolean
      message?: string
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Get updated stamp count
    const { data: stamps } = await supabase
      .from('coffee_stamps')
      .select('id')
      .eq('user_id', user.id)

    const stampCount = stamps?.length || 0

    // Invalidate caches after coffee stamp added
    invalidateAfterCoffeeStamp(user.id)

    return NextResponse.json({
      success: true,
      message: result.message,
      stamp_count: stampCount,
      milestone_reached: result.milestone_reached,
    })
  } catch (error: any) {
    console.error('Add coffee stamp error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add coffee stamp' },
      { status: 500 }
    )
  }
}
