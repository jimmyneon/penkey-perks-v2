import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (staffError || !staffData) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const offerData = await request.json()

    // Create promotional offer
    const { data: offer, error } = await supabase
      .from('promotional_offers')
      .insert({
        title: offerData.title,
        description: offerData.description,
        terms: offerData.terms,
        reward_type: offerData.rewardType,
        reward_value: offerData.rewardValue,
        reward_description: offerData.rewardDescription,
        icon: offerData.icon || '🎁',
        image_url: offerData.imageUrl,
        button_text: offerData.buttonText || 'Redeem Now',
        redemption_limit: offerData.redemptionLimit,
        total_redemption_limit: offerData.totalRedemptionLimit,
        voucher_expiry_hours: offerData.voucherExpiryHours || 48,
        auto_create_voucher: offerData.autoCreateVoucher ?? true,
        active: offerData.active ?? true,
        start_date: offerData.startDate || null,
        end_date: offerData.endDate || null,
        target_audience: offerData.targetAudience || 'all',
        min_beans: offerData.minBeans || null,
        max_beans: offerData.maxBeans || null,
        priority: offerData.priority || 10,
        show_as_modal: offerData.showAsModal ?? true,
        show_as_notification: offerData.showAsNotification ?? true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating promotional offer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If reward_id is provided, link it
    if (offerData.rewardId) {
      await supabase
        .from('promotional_offer_rewards')
        .insert({
          offer_id: offer.id,
          reward_id: offerData.rewardId
        })
    }

    // Create notification if show_as_notification is true
    if (offerData.showAsNotification ?? true) {
      try {
        const { data: notificationId, error: notifError } = await supabase
          .rpc('create_notification_from_promo_offer', {
            p_offer_id: offer.id
          })
        
        if (notifError) {
          console.error('Error creating notification for promo offer:', notifError)
          // Don't fail the whole request, just log the error
        } else {
          console.log('✅ Created temporary notification for promo offer:', notificationId)
        }
      } catch (err) {
        console.error('Failed to create notification:', err)
      }
    }

    return NextResponse.json({ offer })
  } catch (error: any) {
    console.error('Error in promotional offer creation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
