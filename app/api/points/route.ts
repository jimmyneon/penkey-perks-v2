import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Get user's points balance and recent transactions
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current points balance
    const { data: balance } = await supabase
      .rpc('get_user_points', { p_user_id: user.id })

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get available rewards
    const { data: rewards } = await supabase
      .from('points_rewards')
      .select('*')
      .eq('active', true)
      .order('points_required', { ascending: true })

    return NextResponse.json({
      balance: balance || 0,
      transactions: transactions || [],
      rewards: rewards || [],
    })
  } catch (error: any) {
    console.error('Points GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch points' },
      { status: 500 }
    )
  }
}

// POST: Redeem points for a reward
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reward_id } = await request.json()

    if (!reward_id) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 })
    }

    // Get reward details
    const { data: reward } = await supabase
      .from('points_rewards')
      .select('*')
      .eq('id', reward_id)
      .eq('active', true)
      .single()

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Check user has enough points
    const { data: balance } = await supabase
      .rpc('get_user_points', { p_user_id: user.id })

    if ((balance || 0) < reward.points_required) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    // Check stock
    if (reward.stock !== null && reward.stock <= 0) {
      return NextResponse.json(
        { error: 'Reward out of stock' },
        { status: 400 }
      )
    }

    // Deduct points
    const { data: newBalance } = await supabase
      .rpc('add_points', {
        p_user_id: user.id,
        p_amount: -reward.points_required,
        p_source: 'redemption',
        p_description: `Redeemed: ${reward.name}`,
        p_metadata: { reward_id: reward.id }
      })

    // Create reward voucher
    const { data: userReward, error: rewardError } = await supabase
      .from('user_rewards')
      .insert({
        user_id: user.id,
        reward_id: reward.id,
        qr_code: 'PTS-' + Math.random().toString(36).substring(2, 14).toUpperCase(),
        expires_at: reward.expiry_days 
          ? new Date(Date.now() + reward.expiry_days * 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select()
      .single()

    if (rewardError) throw rewardError

    // Decrease stock if applicable
    if (reward.stock !== null) {
      await supabase
        .from('points_rewards')
        .update({ stock: reward.stock - 1 })
        .eq('id', reward.id)
    }

    return NextResponse.json({
      success: true,
      message: `You redeemed ${reward.name}!`,
      new_balance: newBalance,
      voucher: userReward,
    })
  } catch (error: any) {
    console.error('Points redemption error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to redeem points' },
      { status: 500 }
    )
  }
}
