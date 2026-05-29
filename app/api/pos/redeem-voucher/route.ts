import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/api/cors'
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth'
import { awardPointsRatelimit } from '@/lib/ratelimit'
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security'
import { z } from 'zod'

const redeemVoucherSchema = z.object({
  voucher_id: z.string().optional(),
  qr_code: z.string().optional(),
  staff_id: z.string().optional(),
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
    const { success } = awardPointsRatelimit.limit(clientIP)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests - please try again later' },
        { status: 429, headers: corsHeaders }
      )
    }

    // 4. Validate input
    const body = await request.json()
    const validation = redeemVoucherSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers: corsHeaders }
      )
    }

    const { voucher_id, qr_code, staff_id } = validation.data

    // Require either voucher_id or qr_code
    if (!voucher_id && !qr_code) {
      return NextResponse.json(
        { error: 'Either voucher_id or qr_code is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = await createAdminClient()

    // Get voucher details
    let voucherQuery = supabase
      .from('user_vouchers')
      .select('*, voucher_templates(*)')

    if (qr_code) {
      voucherQuery = voucherQuery.eq('qr_code', qr_code)
    } else {
      voucherQuery = voucherQuery.eq('id', voucher_id)
    }

    const { data: voucher, error: voucherError } = await voucherQuery.single()
    
    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404, headers: corsHeaders })
    }
    
    // Check if voucher is already redeemed
    if (voucher.status === 'redeemed') {
      return NextResponse.json({ error: 'Voucher already redeemed' }, { status: 400, headers: corsHeaders })
    }
    
    // Check if voucher is expired
    if (new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400, headers: corsHeaders })
    }
    
    // Redeem voucher using database function
    const { error: redeemError } = await supabase.rpc('redeem_voucher', {
      p_qr_code: voucher.qr_code,
      p_staff_id: staff_id || null,
    })
    
    if (redeemError) {
      console.error('Error redeeming voucher:', redeemError)
      return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500, headers: corsHeaders })
    }
    
    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher.id,
        name: voucher.voucher_templates?.name,
        description: voucher.voucher_templates?.description,
        category: voucher.voucher_templates?.category,
      },
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error redeeming voucher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
