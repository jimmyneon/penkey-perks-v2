import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('Staff check:', { userId: user.id, staff, staffError })

    if (!staff) {
      console.error('Staff check failed:', { userId: user.id, email: user.email, staffError })
      return NextResponse.json({ 
        error: 'Forbidden - Not in staff table', 
        details: staffError?.message 
      }, { status: 403 })
    }

    const { userRewardId } = await request.json()

    if (!userRewardId) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 })
    }

    // Use admin client for staff operations
    const adminClient = await createAdminClient()

    // Get the reward with full details
    // Specify relationship explicitly to avoid ambiguity
    const { data: reward } = await adminClient
      .from('user_rewards')
      .select(`
        *,
        users!user_rewards_user_id_fkey (id, name, email),
        rewards (id, name, description)
      `)
      .eq('id', userRewardId)
      .single()

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (reward.status !== 'active') {
      return NextResponse.json({ error: 'Reward is not active' }, { status: 400 })
    }

    // Check if expired
    if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
      // Mark as expired
      await adminClient
        .from('user_rewards')
        .update({ status: 'expired' })
        .eq('id', userRewardId)

      return NextResponse.json({ error: 'Reward has expired' }, { status: 400 })
    }

    // Redeem the reward
    const { error: updateError } = await adminClient
      .from('user_rewards')
      .update({ 
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: user.id
      })
      .eq('id', userRewardId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    // Log transaction (skip if it fails - not critical)
    try {
      await adminClient.from('transactions').insert({
        user_id: reward.users.id,
        action: 'reward_redeemed',
        details: { 
          reward_id: reward.reward_id, 
          user_reward_id: userRewardId,
          reward_name: reward.rewards?.name,
          redeemed_by_staff: user.id
        },
        staff_id: user.id,
      })
    } catch (txError) {
      console.error('Transaction logging failed (non-critical):', txError)
    }

    console.log('Reward redeemed successfully:', {
      userRewardId,
      customerId: reward.users.id,
      rewardName: reward.rewards?.name,
      staffId: user.id
    })

    return NextResponse.json({ 
      success: true,
      reward: {
        name: reward.rewards?.name,
        description: reward.rewards?.description
      },
      customer: {
        id: reward.users.id,
        name: reward.users.name,
        email: reward.users.email
      }
    })
  } catch (error: any) {
    console.error('Redeem reward error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}
