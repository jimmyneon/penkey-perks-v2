import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { lookupRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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
    const { success } = lookupRatelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests - please try again later' },
        { status: 429, headers: corsHeaders }
      );
    }

    const code = (await params).code;

    if (!code) {
      return NextResponse.json({ error: 'Customer code required' }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    if (code.length > 50) {
      return NextResponse.json({ error: 'Customer code too long' }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const supabase = await createAdminClient();

    // Find customer by generated code (first 8 chars of ID)
    // Since customer_code column doesn't exist, we'll search by ID pattern
    const codeWithoutPrefix = code.replace('CUST', '').toLowerCase();
    
    const { data: customer, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        phone,
        name,
        avatar_url,
        last_check_in,
        check_in_streak,
        total_check_ins,
        referral_code
      `)
      .or(`referral_code.eq.${code},id.ilike.${codeWithoutPrefix}%`)
      .eq('status', 'active')
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Fetch points balance
    const { data: pointsBalance } = await supabase
      .rpc('get_user_points', { p_user_id: customer.id });

    // Transform to shared format
    const sharedCustomer = {
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      first_name: customer.name?.split(' ')[0] || '',
      last_name: customer.name?.split(' ').slice(1).join(' ') || '',
      customer_code: customer.referral_code || `CUST${customer.id.slice(0, 8).toUpperCase()}`,
      profile_qr_code: `profile:${customer.id}`,
      points_balance: pointsBalance || 0,
      membership_tier: 'bronze',
      is_checked_in: customer.last_check_in ? true : false,
      last_checkin_at: customer.last_check_in,
      checkin_store_id: null,
      total_spent: 0,
      visit_count: customer.total_check_ins || 0,
      avatar_url: customer.avatar_url,
      check_in_streak: customer.check_in_streak || 0
    };

    return NextResponse.json(sharedCustomer, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
