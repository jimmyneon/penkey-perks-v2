import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, value, duck_threshold, expiry_days, stock } = body

    if (!name || !type || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('rewards')
      .insert({
        name,
        description,
        type,
        value,
        duck_threshold: duck_threshold || 10,
        expiry_days: expiry_days || null,
        stock: stock || null,
        active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Create reward error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create reward' },
      { status: 500 }
    )
  }
}
