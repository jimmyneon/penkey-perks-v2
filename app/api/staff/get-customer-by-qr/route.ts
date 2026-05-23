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

    // Check if user is staff or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['staff', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 })
    }

    const body = await request.json()
    const { qrCode } = body

    console.log('Received QR code:', qrCode)

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    // QR codes for customer profiles are in format: PROFILE-{userId}
    const parts = qrCode.trim().split('-')
    
    console.log('QR code parts:', parts)
    console.log('Parts length:', parts.length)
    console.log('First part:', parts[0])
    
    if (parts.length < 2 || parts[0].toUpperCase() !== 'PROFILE') {
      console.error('Invalid QR format. Parts:', parts)
      return NextResponse.json({ 
        error: `Invalid QR code format. Expected PROFILE-{userId}, got: ${qrCode}`,
        received: qrCode,
        parts: parts
      }, { status: 400 })
    }

    // Handle UUIDs with dashes (rejoin everything after PROFILE-)
    const customerId = parts.slice(1).join('-') // Keep original case for UUID

    console.log('Looking up customer ID:', customerId)

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError) {
      console.error('Customer lookup error:', customerError)
    }

    if (customerError || !customer) {
      return NextResponse.json({ 
        error: 'Customer not found',
        customerId: customerId,
        dbError: customerError?.message 
      }, { status: 404 })
    }

    console.log('Customer found:', customer.name)

    // Calculate points from transactions (sum of all points)
    const { data: pointsTransactions } = await supabase
      .from('points_transactions')
      .select('amount')
      .eq('user_id', customerId)

    const currentPoints = pointsTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0
    const lifetimePoints = pointsTransactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0

    // Count coffee stamps
    const { count: stampsCount } = await supabase
      .from('coffee_stamps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', customerId)

    // Check if can check in today
    const today = new Date().toISOString().split('T')[0]
    const { data: checkInData } = await supabase
      .from('points_transactions')
      .select('created_at')
      .eq('user_id', customerId)
      .eq('type', 'check_in')
      .gte('created_at', today)
      .maybeSingle()

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar_url: customer.avatar_url,
        current_points: currentPoints,
        lifetime_points: lifetimePoints,
        stamps: stampsCount || 0,
        can_check_in: !checkInData,
        last_check_in: checkInData?.created_at || null
      }
    })

  } catch (error: any) {
    console.error('Error in get-customer-by-qr route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
