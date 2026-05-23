import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!staff || !['admin', 'owner'].includes(staff.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      action_type,
      points_amount,
      description,
      min_interval_hours,
      max_per_day,
      requires_verification,
    } = body

    // Validate required fields
    if (!action_type || !description || points_amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert new points config
    const { data: config, error } = await supabase
      .from('points_config')
      .insert({
        action_type,
        points_amount,
        description,
        min_interval_hours,
        max_per_day,
        requires_verification: requires_verification || false,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating points config:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    console.error('Error in POST /api/admin/points-config:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
