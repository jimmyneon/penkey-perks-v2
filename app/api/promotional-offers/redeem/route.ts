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

    const { offerId } = await request.json()

    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    // Redeem the offer
    const { data, error } = await supabase
      .rpc('redeem_promotional_offer', {
        p_user_id: user.id,
        p_offer_id: offerId
      })

    if (error) {
      console.error('Error redeeming promotional offer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json({ error: result?.message || 'Failed to redeem offer' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      voucher: {
        id: result.voucher_id,
        code: result.voucher_code
      }
    })
  } catch (error: any) {
    console.error('Error in promotional offer redemption:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
