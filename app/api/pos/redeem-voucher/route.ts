import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { voucherId, staffId, locationId } = body
    
    // Validate required fields
    if (!voucherId) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 })
    }
    
    // Get voucher details
    const { data: voucher, error: voucherError } = await supabase
      .from('user_vouchers')
      .select('*, voucher_templates(*)')
      .eq('id', voucherId)
      .single()
    
    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }
    
    // Check if voucher is already redeemed
    if (voucher.status === 'redeemed') {
      return NextResponse.json({ error: 'Voucher already redeemed' }, { status: 400 })
    }
    
    // Check if voucher is expired
    if (new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 })
    }
    
    // Redeem voucher using database function
    const { error: redeemError } = await supabase.rpc('redeem_voucher', {
      p_voucher_id: voucherId,
      p_staff_id: staffId || null,
      p_location_id: locationId || null,
    })
    
    if (redeemError) {
      console.error('Error redeeming voucher:', redeemError)
      return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher.id,
        name: voucher.voucher_templates?.name,
        description: voucher.voucher_templates?.description,
        category: voucher.voucher_templates?.category,
      },
    })
  } catch (error) {
    console.error('Error redeeming voucher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
