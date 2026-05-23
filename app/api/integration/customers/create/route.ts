import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/api/cors'
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth'
import { searchRatelimit } from '@/lib/ratelimit'
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone too long').optional().or(z.literal('')),
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // ✅ 1. Enforce HTTPS in production
    if (!enforceHTTPS(request)) {
      return httpsRequiredResponse(corsHeaders);
    }

    // ✅ 2. Validate API key
    if (!validateIntegrationAuth(request)) {
      return unauthorizedResponse(corsHeaders);
    }

    // ✅ 3. Rate limiting
    const clientIP = getClientIP(request);
    const { success } = searchRatelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests - please try again later' },
        { status: 429, headers: corsHeaders }
      );
    }

    // ✅ 4. Validate input
    const body = await request.json();
    const validation = createCustomerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const { name, email, phone } = validation.data;
    const supabase = await createAdminClient();

    // Create new user in Perks database
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: 'active',
        role: 'customer',
        gps_consent: false,
        marketing_consent: false,
      })
      .select(`
        id,
        name,
        email,
        phone,
        avatar_url,
        last_check_in,
        check_in_streak,
        total_check_ins,
        referral_code
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Get points balance (will be 0 for new customer)
    const { data: pointsBalance } = await supabase
      .rpc('get_user_points', { p_user_id: newUser.id })

    // ✅ 5. Transform to shared format (minimal data)
    const sharedCustomer = {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      first_name: newUser.name?.split(' ')[0] || '',
      last_name: newUser.name?.split(' ').slice(1).join(' ') || '',
      customer_code: newUser.referral_code || `CUST${newUser.id.slice(0, 8).toUpperCase()}`,
      points_balance: pointsBalance || 0,
      membership_tier: 'bronze',
      visit_count: 0
      // Removed: avatar_url, check_in_streak, profile_qr_code (not needed)
    }

    return NextResponse.json(sharedCustomer, { headers: corsHeaders })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
