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

    const { userId, amount } = await request.json()

    if (!userId || !amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Add ducks
    const ducksToAdd = Array.from({ length: amount }, () => ({
      user_id: userId,
    }))

    const { error: duckError } = await supabase
      .from('coffee_stamps')
      .insert(ducksToAdd)

    if (duckError) throw duckError

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      action: 'manual_duck_add',
      details: { amount, added_by: user.id },
      staff_id: user.id,
    })

    return NextResponse.json({
      success: true,
      message: `Added ${amount} duck${amount > 1 ? 's' : ''}`,
    })
  } catch (error: any) {
    console.error('Add ducks error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add ducks' },
      { status: 500 }
    )
  }
}
