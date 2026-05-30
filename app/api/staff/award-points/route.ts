import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, staffId, awardType, points, reason, notes } = await request.json()

    if (!userId || !staffId || !awardType || !points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check if user is staff or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get award type details
    const { data: awardTypeData, error: awardTypeError } = await supabase
      .from('award_type_limits')
      .select('*')
      .eq('award_type', awardType)
      .eq('active', true)
      .single()

    if (awardTypeError || !awardTypeData) {
      return NextResponse.json(
        { error: 'Invalid award type' },
        { status: 400 }
      )
    }

    // Check limits
    if (awardTypeData.limit_type && awardTypeData.limit_type !== 'unlimited' && awardTypeData.limit_count) {
      const limitCheck = await checkAwardLimit(
        supabase,
        userId,
        awardType,
        awardTypeData.limit_type,
        awardTypeData.limit_count
      )

      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: limitCheck.message },
          { status: 400 }
        )
      }
    }

    // Check staff daily limits
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: staffAwardsToday } = await supabase
      .from('manual_points_awards')
      .select('points')
      .eq('staff_id', staffId)
      .gte('created_at', today.toISOString())

    const totalPointsToday = staffAwardsToday?.reduce((sum, award) => sum + award.points, 0) || 0

    if (totalPointsToday + points > 200) {
      return NextResponse.json(
        { error: 'You have reached your daily limit of 200 beans' },
        { status: 400 }
      )
    }

    // Check customer's current bean balance
    const { data: beanBalance } = await supabase
      .from('bean_balances')
      .select('current_beans')
      .eq('user_id', userId)
      .single()

    const currentBeans = beanBalance?.current_beans || 0

    // Check if awarding would exceed cap
    if (currentBeans >= 25) {
      // Broadcast max beans notification to customer
      await supabase
        .channel(`user_notifications:${userId}`)
        .send({
          type: 'broadcast',
          event: 'max_beans_reached',
          payload: {
            message: 'You have reached the maximum bean cap of 25! Convert your beans to vouchers to earn more.',
            current_beans: currentBeans,
            action: 'convert_to_vouchers'
          }
        })
      
      return NextResponse.json(
        { 
          error: 'Customer has reached maximum bean cap of 25. Convert beans to vouchers first.',
          at_max_beans: true,
          current_beans: currentBeans
        },
        { status: 400 }
      )
    }

    // Create award record
    const { data: award, error: awardError } = await supabase
      .from('manual_points_awards')
      .insert({
        user_id: userId,
        staff_id: staffId,
        award_type: awardType,
        points,
        reason: reason || awardTypeData.description,
        notes
      })
      .select()
      .single()

    if (awardError) {
      console.error('Error creating award:', awardError)
      return NextResponse.json(
        { error: 'Failed to create award' },
        { status: 500 }
      )
    }

    // Award beans immediately (no approval needed)
    const { error: beansError, data: awardResult } = await supabase.rpc('award_beans', {
      p_user_id: userId,
      p_amount: points,
      p_source: 'manual_award',
      p_description: `${awardTypeData.name}${reason ? ': ' + reason : ''}`,
      p_metadata: {
        award_type: awardType,
        staff_id: staffId,
        award_id: award.id
      }
    })

    if (beansError) {
      console.error('Error awarding beans:', beansError)
      
      // Check if it's a max beans error
      if (beansError.message?.includes('maximum bean cap')) {
        // Rollback the award
        await supabase
          .from('manual_points_awards')
          .delete()
          .eq('id', award.id)
        
        return NextResponse.json(
          { 
            error: 'Customer has reached maximum bean cap of 25. Convert beans to vouchers first.',
            at_max_beans: true,
            current_beans: currentBeans
          },
          { status: 400 }
        )
      }
      
      // Rollback the award if beans failed
      await supabase
        .from('manual_points_awards')
        .delete()
        .eq('id', award.id)
      
      return NextResponse.json(
        { error: 'Failed to award beans: ' + beansError.message },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('staff_activity_log')
      .insert({
        staff_id: staffId,
        action_type: 'award_points',
        target_user_id: userId,
        metadata: {
          award_type: awardType,
          points
        }
      })

    return NextResponse.json({
      success: true,
      award
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function checkAwardLimit(
  supabase: any,
  userId: string,
  awardType: string,
  limitType: string,
  limitCount: number
): Promise<{ allowed: boolean; message?: string }> {
  
  let startDate = new Date()
  
  switch (limitType) {
    case 'per_day':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'per_week':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'per_month':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'per_year':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      return { allowed: true }
  }

  const { count } = await supabase
    .from('manual_points_awards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('award_type', awardType)
    .in('status', ['approved', 'auto_approved'])
    .gte('created_at', startDate.toISOString())

  if (count && count >= limitCount) {
    return {
      allowed: false,
      message: `Customer has already received this award ${limitCount} time(s) ${limitType.replace('per_', 'this ')}`
    }
  }

  return { allowed: true }
}
