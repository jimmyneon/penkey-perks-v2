import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff or admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('User profile check:', { 
      userId: user.id, 
      profile, 
      profileError: profileError?.message 
    })

    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      console.error('Access denied - not staff/admin:', { profile })
      return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 })
    }

    console.log('✅ User is staff/admin:', profile.role)

    const { qrCode } = await request.json()

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code required' }, { status: 400 })
    }

    console.log('Verifying reward QR code:', qrCode)

    // Use admin client to bypass RLS for staff operations
    const adminClient = await createAdminClient()

    // Find the reward by QR code (case-insensitive)
    // Specify the relationship explicitly to avoid ambiguity
    const { data: userReward, error } = await adminClient
      .from('user_rewards')
      .select(`
        id,
        status,
        expires_at,
        qr_code,
        reward_id,
        user_id,
        rewards (
          id,
          name,
          description,
          points_cost
        ),
        users!user_rewards_user_id_fkey (
          id,
          name,
          email,
          phone
        )
      `)
      .ilike('qr_code', qrCode)
      .single()

    if (error || !userReward) {
      console.error('Reward not found:', {
        qrCode,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details
      })
      
      // Try to find similar QR codes for debugging
      const { data: allRewards } = await adminClient
        .from('user_rewards')
        .select('qr_code, status')
        .ilike('qr_code', `%${qrCode.substring(0, 10)}%`)
        .limit(5)
      
      console.log('Similar QR codes found:', allRewards)
      
      return NextResponse.json({ 
        error: 'Reward not found. Please check the QR code.',
        details: error?.message,
        qrCodeSearched: qrCode,
        similarCodes: allRewards?.map(r => r.qr_code)
      }, { status: 404 })
    }

    // Check if already redeemed
    if (userReward.status === 'redeemed') {
      return NextResponse.json({ 
        error: 'This reward has already been redeemed' 
      }, { status: 400 })
    }

    // Check if expired
    if (userReward.status === 'expired') {
      return NextResponse.json({ 
        error: 'This reward has expired' 
      }, { status: 400 })
    }

    if (userReward.expires_at && new Date(userReward.expires_at) < new Date()) {
      // Mark as expired
      await adminClient
        .from('user_rewards')
        .update({ status: 'expired' })
        .eq('id', userReward.id)

      return NextResponse.json({ 
        error: 'This reward has expired' 
      }, { status: 400 })
    }

    // Check if status is active
    if (userReward.status !== 'active') {
      return NextResponse.json({ 
        error: `Reward is ${userReward.status}. Only active rewards can be redeemed.` 
      }, { status: 400 })
    }

    // Return reward details for confirmation
    const rewardData = Array.isArray(userReward.rewards) ? userReward.rewards[0] : userReward.rewards
    const userData = Array.isArray(userReward.users) ? userReward.users[0] : userReward.users

    return NextResponse.json({
      success: true,
      reward: {
        id: userReward.id,
        reward_name: rewardData?.name || 'Unknown Reward',
        reward_description: rewardData?.description,
        points_cost: rewardData?.points_cost,
        expires_at: userReward.expires_at,
        qr_code: userReward.qr_code
      },
      customer: {
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        phone: userData?.phone
      }
    })
  } catch (error: any) {
    console.error('Verify reward by QR error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify reward' },
      { status: 500 }
    )
  }
}
