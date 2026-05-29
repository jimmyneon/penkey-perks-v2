import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/api/cors'
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth'
import { lookupRatelimit } from '@/lib/ratelimit'
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security'
import { z } from 'zod'

const scanSchema = z.object({
  qr_data: z.string().min(1, 'QR data required'),
})

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    // 1. Enforce HTTPS in production
    if (!enforceHTTPS(request)) {
      return httpsRequiredResponse(corsHeaders)
    }

    // 2. Validate API key
    if (!validateIntegrationAuth(request)) {
      return unauthorizedResponse(corsHeaders)
    }

    // 3. Rate limiting
    const clientIP = getClientIP(request)
    const { success } = lookupRatelimit.limit(clientIP)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests - please try again later' },
        { status: 429, headers: corsHeaders }
      )
    }

    // 4. Validate input
    const body = await request.json()
    const validation = scanSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers: corsHeaders }
      )
    }

    const { qr_data } = validation.data
    const supabase = await createAdminClient()

    // Parse QR data to determine type
    if (qr_data.startsWith('PROFILE-')) {
      // Profile QR code
      return await handleProfileQR(qr_data, supabase, corsHeaders)
    } else if (qr_data.startsWith('VOUCHER-')) {
      // Voucher QR code
      return await handleVoucherQR(qr_data, supabase, corsHeaders)
    } else {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400, headers: corsHeaders }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

async function handleProfileQR(qrData: string, supabase: any, corsHeaders: Record<string, string>) {
  // Find customer by profile QR code
  const { data: customer, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      name,
      phone,
      avatar_url,
      created_at
    `)
    .eq('profile_qr_code', qrData)
    .single()

  if (error || !customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404, headers: corsHeaders }
    )
  }

  // Get bean balance
  const { data: beanBalance } = await supabase
    .from('bean_balances')
    .select('*')
    .eq('user_id', customer.id)
    .single()

  // Get active vouchers
  const { data: vouchers } = await supabase
    .from('user_vouchers')
    .select(`
      id,
      qr_code,
      status,
      expires_at,
      voucher_templates (
        id,
        name,
        description,
        category,
        bean_threshold
      )
    `)
    .eq('user_id', customer.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())

  // Check if already visited today
  const today = new Date().toISOString().split('T')[0]
  const { data: todayVisit } = await supabase
    .from('daily_visits')
    .select('base_bean_awarded')
    .eq('user_id', customer.id)
    .eq('visit_date', today)
    .single()

  const canAwardBean = !todayVisit || !todayVisit.base_bean_awarded

  return NextResponse.json({
    type: 'profile',
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar_url: customer.avatar_url,
    },
    bean_balance: {
      current_beans: beanBalance?.current_beans || 0,
      lifetime_beans: beanBalance?.lifetime_beans || 0,
      visit_count: beanBalance?.visit_count || 0,
    },
    vouchers: vouchers || [],
    can_award_bean: canAwardBean,
  }, { headers: corsHeaders })
}

async function handleVoucherQR(qrData: string, supabase: any, corsHeaders: Record<string, string>) {
  // Parse voucher QR: VOUCHER-{random}-{customer_id}-{timestamp}
  const parts = qrData.split('-')
  if (parts.length < 3) {
    return NextResponse.json(
      { error: 'Invalid voucher QR format' },
      { status: 400, headers: corsHeaders }
    )
  }

  const customerId = parts[2]

  // Find voucher by QR code
  const { data: voucher, error } = await supabase
    .from('user_vouchers')
    .select(`
      id,
      qr_code,
      status,
      expires_at,
      user_id,
      voucher_templates (
        id,
        name,
        description,
        category,
        bean_threshold
      )
    `)
    .eq('qr_code', qrData)
    .single()

  if (error || !voucher) {
    return NextResponse.json(
      { error: 'Voucher not found' },
      { status: 404, headers: corsHeaders }
    )
  }

  // Check if voucher is already redeemed
  if (voucher.status === 'redeemed') {
    return NextResponse.json(
      { error: 'Voucher already redeemed' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Check if voucher is expired
  if (new Date(voucher.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Voucher expired' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Get customer profile
  const { data: customer } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      name,
      phone,
      avatar_url
    `)
    .eq('id', voucher.user_id)
    .single()

  // Get bean balance
  const { data: beanBalance } = await supabase
    .from('bean_balances')
    .select('*')
    .eq('user_id', voucher.user_id)
    .single()

  return NextResponse.json({
    type: 'voucher',
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar_url: customer.avatar_url,
    },
    bean_balance: {
      current_beans: beanBalance?.current_beans || 0,
      lifetime_beans: beanBalance?.lifetime_beans || 0,
      visit_count: beanBalance?.visit_count || 0,
    },
    voucher: {
      id: voucher.id,
      qr_code: voucher.qr_code,
      name: voucher.voucher_templates?.name,
      description: voucher.voucher_templates?.description,
      category: voucher.voucher_templates?.category,
      bean_threshold: voucher.voucher_templates?.bean_threshold,
      expires_at: voucher.expires_at,
    },
  }, { headers: corsHeaders })
}
