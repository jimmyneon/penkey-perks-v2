import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
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

    const { id, ...offerData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    // Update promotional offer
    const { data: offer, error } = await supabase
      .from('promotional_offers')
      .update({
        title: offerData.title,
        description: offerData.description,
        terms: offerData.terms,
        reward_type: offerData.rewardType,
        reward_value: offerData.rewardValue,
        reward_description: offerData.rewardDescription,
        icon: offerData.icon,
        image_url: offerData.imageUrl,
        button_text: offerData.buttonText,
        redemption_limit: offerData.redemptionLimit,
        total_redemption_limit: offerData.totalRedemptionLimit,
        voucher_expiry_hours: offerData.voucherExpiryHours,
        auto_create_voucher: offerData.autoCreateVoucher,
        active: offerData.active,
        start_date: offerData.startDate,
        end_date: offerData.endDate,
        target_audience: offerData.targetAudience,
        min_beans: offerData.minBeans,
        max_beans: offerData.maxBeans,
        priority: offerData.priority,
        show_as_modal: offerData.showAsModal,
        show_as_notification: offerData.showAsNotification,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating promotional offer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ offer })
  } catch (error: any) {
    console.error('Error in promotional offer update:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
