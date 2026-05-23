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

    // Get user's ducks
    const { data: ducks } = await supabase
      .from('coffee_stamps')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(amount)

    if (!ducks || ducks.length === 0) {
      return NextResponse.json({ error: 'User has no ducks to remove' }, { status: 400 })
    }

    const ducksToRemove = ducks.slice(0, Math.min(amount, ducks.length))

    // Remove ducks
    const { error: deleteError } = await supabase
      .from('coffee_stamps')
      .delete()
      .in('id', ducksToRemove.map(d => d.id))

    if (deleteError) throw deleteError

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      action: 'manual_duck_remove',
      details: { amount: ducksToRemove.length, removed_by: user.id },
      staff_id: user.id,
    })

    return NextResponse.json({
      success: true,
      message: `Removed ${ducksToRemove.length} duck${ducksToRemove.length > 1 ? 's' : ''}`,
    })
  } catch (error: any) {
    console.error('Remove ducks error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove ducks' },
      { status: 500 }
    )
  }
}
