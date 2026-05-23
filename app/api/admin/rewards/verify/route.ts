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

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    // Find the reward by ID (code is the user_reward ID)
    const { data: reward, error } = await supabase
      .from('user_rewards')
      .select(`
        *,
        rewards (*),
        users (name, email)
      `)
      .eq('id', code)
      .single()

    if (error || !reward) {
      return NextResponse.json({ error: 'Invalid reward code' }, { status: 404 })
    }

    // Check if expired
    if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Reward has expired' }, { status: 400 })
    }

    return NextResponse.json({ success: true, reward })
  } catch (error: any) {
    console.error('Verify reward error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify reward' },
      { status: 500 }
    )
  }
}
