import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('🧪 TEST ENDPOINT HIT')
    console.log('User:', user?.id)

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile:', profile)

    // Use admin client to bypass RLS
    const adminClient = await createAdminClient()

    // Try to find a reward with ILIKE
    const testQR = 'COFFEE-133ed21bb086'
    console.log('Testing QR lookup:', testQR)

    // Try without .single() first to see how many rows
    const { data: allRewards, error: allError } = await adminClient
      .from('user_rewards')
      .select('id, qr_code, status, user_id')
      .ilike('qr_code', testQR)

    console.log('All matching rewards (admin):', { count: allRewards?.length, allRewards, allError: allError?.message })

    // Now try with .single()
    const { data: reward, error } = await adminClient
      .from('user_rewards')
      .select('id, qr_code, status')
      .ilike('qr_code', testQR)
      .single()

    console.log('Single result (admin):', { reward, error: error?.message })

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      userRole: profile?.role,
      testQR,
      allRewardsCount: allRewards?.length || 0,
      allRewards,
      rewardFound: !!reward,
      reward,
      error: error?.message
    })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
