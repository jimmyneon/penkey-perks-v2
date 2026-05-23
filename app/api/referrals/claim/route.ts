import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/messaging/send-notification'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json({ 
        error: 'Referral code is required',
        message: 'No referral code provided'
      }, { status: 400 })
    }

    console.log('Processing referral claim:', { userId: user.id, referralCode })

    // Look up referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('referral_code', referralCode)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ 
        error: 'Invalid referral code',
        message: 'The referral code is not valid or the user does not exist'
      }, { status: 400 })
    }

    // Check if trying to refer themselves
    if (referrer.id === user.id) {
      return NextResponse.json({ 
        error: 'Cannot refer yourself',
        message: 'You cannot use your own referral code'
      }, { status: 400 })
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', user.id)
      .single()

    if (existingReferral) {
      return NextResponse.json({ 
        error: 'Already referred',
        message: 'You have already been referred by someone else'
      }, { status: 400 })
    }

    // Create referral record
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        confirmed: true, // Auto-confirm since they signed up
      })

    if (insertError) {
      console.error('Error creating referral:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create referral',
        message: 'Could not process your referral. Please contact support.'
      }, { status: 500 })
    }

    // Award points to referrer (optional - you can configure this)
    const REFERRAL_BONUS = 50 // 50 beans for successful referral
    const { error: pointsError } = await supabase.rpc('add_points', {
      p_user_id: referrer.id,
      p_amount: REFERRAL_BONUS,
      p_source: 'referral',
      p_description: `Referral bonus for inviting ${user.email}`,
    })

    if (pointsError) {
      console.error('Error awarding referral points:', pointsError)
      // Don't fail the whole request if points fail
    }

    // Get referred user's name for notifications
    const { data: referredUser } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const referredName = referredUser?.name || referredUser?.email?.split('@')[0] || 'Someone'

    // Send notification to REFERRER (person who referred)
    try {
      await sendNotification({
        userId: referrer.id,
        templateName: 'referral_success',
        variables: {
          referredName,
          beans: REFERRAL_BONUS
        },
        channels: {
          push: true,
          email: true,
          inApp: true
        }
      })
      console.log('✅ Referrer notification sent to:', referrer.id)
    } catch (notifError) {
      console.error('❌ Failed to send referrer notification:', notifError)
    }

    // Send welcome notification to REFERRED USER (new user)
    try {
      await sendNotification({
        userId: user.id,
        templateName: 'referred_welcome',
        variables: {
          referrerName: referrer.name || 'your friend',
          beans: REFERRAL_BONUS
        },
        channels: {
          push: true,
          email: true,
          inApp: false // They'll see the modal instead
        }
      })
      console.log('✅ Referred user notification sent to:', user.id)
    } catch (notifError) {
      console.error('❌ Failed to send referred user notification:', notifError)
    }

    console.log('Referral claimed successfully:', { referrerId: referrer.id, referredId: user.id })

    return NextResponse.json({ 
      success: true,
      message: `Thanks for using ${referrer.name}'s referral link!`,
      referrer: {
        name: referrer.name,
      }
    })

  } catch (error) {
    console.error('Referral claim error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}
