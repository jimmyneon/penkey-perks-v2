import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rewardId, userId } = await request.json()

    if (!rewardId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user matches
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (!reward.active) {
      return NextResponse.json({ error: 'Reward is not available' }, { status: 400 })
    }

    // Check stock
    if (reward.stock !== null && reward.stock <= 0) {
      return NextResponse.json({ error: 'Reward is out of stock' }, { status: 400 })
    }

    // Get user's current points
    const { data: currentPoints } = await supabase
      .rpc('get_user_points', { p_user_id: user.id })

    if (!currentPoints || currentPoints < reward.points_cost) {
      return NextResponse.json(
        { error: `Not enough points. You need ${reward.points_cost} points but only have ${currentPoints || 0}.` },
        { status: 400 }
      )
    }

    // Deduct points
    const { error: deductError } = await supabase
      .rpc('add_points', {
        p_user_id: user.id,
        p_amount: -reward.points_cost, // Negative to deduct
        p_source: 'reward_redemption',
        p_description: `Redeemed: ${reward.name}`,
        p_metadata: { reward_id: rewardId }
      })

    if (deductError) {
      console.error('Error deducting points:', deductError)
      return NextResponse.json({ error: 'Failed to deduct points' }, { status: 500 })
    }

    // Create user reward with QR code
    const qrCode = `REWARD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

    const { data: userReward, error: createError } = await supabase
      .from('user_rewards')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        qr_code: qrCode,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user reward:', createError)
      
      // Refund points if reward creation failed
      await supabase.rpc('add_points', {
        p_user_id: user.id,
        p_amount: reward.points_cost,
        p_source: 'refund',
        p_description: `Refund for failed redemption: ${reward.name}`
      })

      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 })
    }

    // Decrease stock if applicable
    if (reward.stock !== null) {
      await supabase
        .from('rewards')
        .update({ stock: reward.stock - 1 })
        .eq('id', rewardId)
    }

    // Log transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        action: 'reward_redeemed',
        details: {
          reward_id: rewardId,
          reward_name: reward.name,
          points_cost: reward.points_cost,
          qr_code: qrCode
        }
      })

    return NextResponse.json({
      success: true,
      userReward,
      newBalance: currentPoints - reward.points_cost
    })
  } catch (error: any) {
    console.error('Redeem reward error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}
