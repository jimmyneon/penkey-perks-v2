import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    // Determine target user
    // If userId is provided, verify current user is staff/admin
    // Otherwise, use authenticated user
    let targetUserId = user.id
    
    if (userId) {
      // Verify current user is staff or admin
      const { data: staffData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (staffData && ['staff', 'admin'].includes(staffData.role)) {
        targetUserId = userId
      } else {
        return NextResponse.json(
          { error: 'Only staff can add stamps for other users' },
          { status: 403 }
        )
      }
    }

    // Count existing stamps
    const { count: currentStamps } = await supabase
      .from('coffee_stamps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)

    // Check if already at 10 stamps
    if (currentStamps && currentStamps >= 10) {
      return NextResponse.json({ 
        error: 'User already has 10 stamps. Please redeem free coffee first.' 
      }, { status: 400 })
    }

    // Add a stamp
    const { error: insertError } = await supabase
      .from('coffee_stamps')
      .insert({ 
        user_id: targetUserId,
        created_at: new Date().toISOString()
      })

    if (insertError) throw insertError

    const newStampCount = (currentStamps || 0) + 1

    // If reached 10 stamps, create free coffee reward
    if (newStampCount === 10) {
      // Get the free coffee reward
      const { data: coffeeReward } = await supabase
        .from('rewards')
        .select('id')
        .eq('name', 'Free Coffee')
        .eq('active', true)
        .single()

      if (coffeeReward) {
        // Generate QR code
        const qrCode = `COFFEE-${Math.random().toString(36).substring(2, 15)}`
        
        // Calculate expiry (30 days from now)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)

        // Create user reward
        await supabase
          .from('user_rewards')
          .insert({
            user_id: targetUserId,
            reward_id: coffeeReward.id,
            status: 'active',
            qr_code: qrCode,
            expires_at: expiryDate.toISOString()
          })

        // Delete all stamps (reset to 0)
        await supabase
          .from('coffee_stamps')
          .delete()
          .eq('user_id', targetUserId)

        return NextResponse.json({
          success: true,
          stampsCount: 0,
          rewardEarned: true,
          message: 'Congratulations! Free coffee reward earned!'
        })
      }
    }

    return NextResponse.json({
      success: true,
      stampsCount: newStampCount,
      rewardEarned: false,
      message: `Stamp added! ${newStampCount}/10`
    })

  } catch (error: any) {
    console.error('Error adding stamp:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
