import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isWithinBusinessHours, getBusinessHoursMessage } from '@/lib/business-hours'
import { invalidateAfterCheckIn } from '@/lib/cache/invalidation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check business hours
    const isOpen = isWithinBusinessHours()
    const hoursMessage = getBusinessHoursMessage()
    
    console.log('🕐 Business hours check:', {
      isOpen,
      currentTime: new Date().toTimeString().slice(0, 5),
      currentDate: new Date().toISOString(),
      ukTime: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      message: hoursMessage
    })
    
    if (!isOpen) {
      console.log('❌ BLOCKED - Shop is closed')
      return NextResponse.json(
        { 
          error: `Penkey is currently closed. ${hoursMessage}`,
          reason: 'outside_business_hours',
          details: {
            isOpen,
            message: hoursMessage
          }
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Shop is open - proceeding with check-in')

    // Get request body
    let latitude, longitude, targetUserId
    try {
      const body = await request.json()
      latitude = body.latitude
      longitude = body.longitude
      targetUserId = body.userId // For staff checking in customers
    } catch (e) {
      // No body provided, skip GPS validation for testing
    }

    // Determine which user to check in
    // If userId is provided and current user is staff/admin, check in that user
    // Otherwise, check in the authenticated user
    let userToCheckIn = user.id
    
    if (targetUserId) {
      // Verify current user is staff or admin
      const { data: staffData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (staffData && ['staff', 'admin'].includes(staffData.role)) {
        userToCheckIn = targetUserId
      } else {
        return NextResponse.json(
          { error: 'Only staff can check in other users' },
          { status: 403 }
        )
      }
    }

    // GPS VALIDATION DISABLED FOR TESTING
    // TODO: Re-enable GPS validation before production
    /*
    // Validate GPS coordinates provided
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location required. Please enable GPS.' },
        { status: 400 }
      )
    }

    // Validate location (must be at shop)
    const SHOP_LAT = 51.5074 // TODO: Replace with actual Penkey coordinates
    const SHOP_LNG = -0.1278
    const MAX_DISTANCE = 0.0005 // ~50 meters

    const distance = Math.sqrt(
      Math.pow(latitude - SHOP_LAT, 2) + 
      Math.pow(longitude - SHOP_LNG, 2)
    )

    if (distance > MAX_DISTANCE) {
      return NextResponse.json(
        { error: 'You must be at Penkey to check in. Please visit the shop!' },
        { status: 400 }
      )
    }
    */

    // Check if user can check in (daily reset at midnight)
    console.log('🔍 About to check can_check_in for user:', userToCheckIn)
    
    const { data: canCheckIn, error: checkInError } = await supabase
      .rpc('can_check_in', { p_user_id: userToCheckIn })

    console.log('🔍 Check-in validation result:', {
      userId: userToCheckIn,
      canCheckIn,
      error: checkInError,
      timestamp: new Date().toISOString()
    })

    if (checkInError) {
      console.error('❌ Error checking can_check_in:', checkInError)
      return NextResponse.json(
        { error: 'Failed to validate check-in status. Please try again.' },
        { status: 500 }
      )
    }

    if (!canCheckIn) {
      // Get today's check-in for debugging
      const { data: todaysCheckIn } = await supabase
        .rpc('get_todays_check_in', { p_user_id: userToCheckIn })
      
      // Also check raw check_ins table
      const { data: rawCheckIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userToCheckIn)
        .order('checked_in_at', { ascending: false })
        .limit(3)
      
      console.log('❌ BLOCKED - Already checked in today:', {
        todaysCheckIn,
        rawCheckIns,
        currentDate: new Date().toISOString(),
        ukDate: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
      })
      
      // Get last check-in time for better error message
      const lastCheckIn = todaysCheckIn?.[0] || rawCheckIns?.[0]
      const lastCheckInTime = lastCheckIn?.checked_in_at 
        ? new Date(lastCheckIn.checked_in_at).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Europe/London'
          })
        : null
      
      return NextResponse.json(
        { 
          error: lastCheckInTime 
            ? `You already checked in today at ${lastCheckInTime}. Come back tomorrow for your next check-in!`
            : 'You have already checked in today! Come back tomorrow.',
          reason: 'already_checked_in_today',
          lastCheckIn: lastCheckIn?.checked_in_at || null,
          debug: {
            todaysCheckIn,
            rawCheckIns
          }
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Check-in allowed! Proceeding...')

    // Update GPS location if provided
    if (latitude && longitude) {
      await supabase
        .from('users')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', userToCheckIn)
    }

    // Update check-in streak
    const { data: streakData } = await supabase
      .rpc('update_check_in_streak', { p_user_id: userToCheckIn })

    // Award 50 beans for visit (with streak multiplier)
    const streakMultiplier = streakData?.multiplier || 1.0
    const basePoints = 50  // Updated for beans system
    const bonusPoints = Math.floor(basePoints * (streakMultiplier - 1))
    const totalPoints = basePoints + bonusPoints

    const { data: newBalance, error: pointsError } = await supabase
      .rpc('add_points', {
        p_user_id: userToCheckIn,
        p_amount: totalPoints,
        p_source: 'visit',
        p_description: bonusPoints > 0 
          ? `Daily check-in: ${basePoints} beans (+${bonusPoints} streak bonus)`
          : `Daily check-in: ${basePoints} beans`
      })

    if (pointsError) {
      console.error('Error adding points:', pointsError)
      return NextResponse.json(
        { error: 'Failed to award points. Please contact support.' },
        { status: 500 }
      )
    }

    const pointsBalance = newBalance || 0

    // Record check-in in check_ins table
    await supabase.rpc('record_check_in', {
      p_user_id: userToCheckIn,
      p_latitude: latitude,
      p_longitude: longitude,
      p_points_awarded: totalPoints,
      p_streak_multiplier: streakMultiplier,
      p_streak_count: streakData?.streak || 1,
      p_metadata: {
        bonus_points: bonusPoints,
        base_points: basePoints
      }
    })

    // Claim pending rewards from pending_rewards table
    console.log('🎁 Claiming pending rewards for user:', userToCheckIn)
    const { data: claimResult, error: claimError } = await supabase
      .rpc('claim_pending_rewards', {
        p_user_id: userToCheckIn,
        p_latitude: null,  // Skip location validation - already checked
        p_longitude: null
      })
    
    console.log('🎁 Claim result:', { 
      claimResult, 
      claimError,
      success: claimResult?.success,
      claimedCount: claimResult?.claimed_count,
      totalPoints: claimResult?.total_points,
      message: claimResult?.message
    })
    
    if (claimError) {
      console.error('❌ Error claiming pending rewards:', claimError)
    }
    
    if (claimResult && !claimResult.success) {
      console.error('❌ Claim failed:', claimResult.error || claimResult.message)
    }

    // Note: Game winnings are already in pending_rewards table
    // The claim_pending_rewards function above handles them

    // Check combo progress
    const { data: comboResult } = await supabase
      .rpc('check_combo_progress', { p_user_id: userToCheckIn })

    // Check lucky time
    const { data: luckyResult } = await supabase
      .rpc('check_lucky_time')

    let luckyBonus = 0
    if (luckyResult?.is_lucky) {
      // Award lucky time bonus as pending
      await supabase.rpc('award_game_prize_pending', {
        p_user_id: userToCheckIn,
        p_game_id: null,
        p_prize_type: luckyResult.reward_type,
        p_prize_value: luckyResult.reward_amount,
        p_prize_label: `Lucky ${luckyResult.lucky_time} Bonus`
      })
      luckyBonus = luckyResult.reward_amount
    }

    // Check for surprise box (5% chance)
    const { data: surpriseResult } = await supabase
      .rpc('open_surprise_box', { p_user_id: userToCheckIn })

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: userToCheckIn,
      action: 'check_in',
      details: { 
        timestamp: new Date().toISOString(),
        points_earned: totalPoints,
        streak: streakData?.streak || 1,
        multiplier: streakMultiplier,
        pending_claimed: claimResult?.claimed_count || 0,
        combos_completed: comboResult?.count || 0,
        lucky_bonus: luckyBonus,
        surprise_box: surpriseResult?.has_surprise || false
      },
    })

    // Build success message
    const claimedPoints = claimResult?.total_points || 0
    const claimedStamps = claimResult?.total_stamps || 0
    const totalEarnedBeans = totalPoints + claimedPoints
    
    let message = `Check-in successful! You earned ${totalEarnedBeans} beans!`
    
    // Add details if there were pending rewards
    if (claimResult?.claimed_count > 0) {
      const details = []
      if (claimedPoints > 0) {
        details.push(`${claimedPoints} from pending rewards`)
      }
      if (claimedStamps > 0) {
        details.push(`${claimedStamps} stamp${claimedStamps > 1 ? 's' : ''}`)
      }
      if (details.length > 0) {
        message += ` (${details.join(' + ')})`
      }
    }
    
    if (comboResult?.count > 0) {
      message += ` 🎉 Combo bonus completed!`
    }
    if (luckyResult?.is_lucky) {
      message += ` 🍀 Lucky time bonus!`
    }
    if (surpriseResult?.has_surprise) {
      message += ` 🎁 Surprise box!`
    }

    // Invalidate caches after successful check-in
    invalidateAfterCheckIn(userToCheckIn)
    
    console.log('✅ Check-in complete! Returning success response:', {
      message,
      checkInPoints: totalPoints,
      claimedPoints,
      totalEarnedBeans,
      pointsBalance,
      pendingClaimed: claimResult?.claimed_count || 0
    })

    return NextResponse.json({
      success: true,
      message,
      points: totalPoints,
      points_earned: totalEarnedBeans, // Total including claimed rewards
      points_balance: pointsBalance,
      streak: streakData?.streak || 1,
      streak_multiplier: streakMultiplier,
      streak_broken: streakData?.streak_broken || false,
      pending_claimed: claimResult || null,
      combos_completed: comboResult || null,
      lucky_bonus: luckyResult || null,
      surprise_box: surpriseResult || null,
    })
  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check in' },
      { status: 500 }
    )
  }
}
