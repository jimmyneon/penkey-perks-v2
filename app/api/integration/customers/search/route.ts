import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { searchRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        customers: [], 
        query: query || '', 
        total: 0 
      }, { headers: corsHeaders });
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'Search query too long (max 100 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createAdminClient();

    // ✅ 5. Search customers by name, email, phone (minimal data)
    const { data: customers, error } = await supabase
      .from('users')
      .select('id, email, phone, name, referral_code, last_check_in, total_check_ins')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .eq('status', 'active')
      .order('last_check_in', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to search customers' }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Fetch points balance for all customers
    const customerIds = (customers || []).map((c: any) => c.id);
    const pointsPromises = customerIds.map((id: string) => 
      supabase.rpc('get_user_points', { p_user_id: id })
    );
    const pointsResults = await Promise.all(pointsPromises);
    const pointsMap = new Map(customerIds.map((id: string, i: number) => [id, pointsResults[i].data || 0]));

    // ✅ 6. Transform to shared format (minimal data exposure)
    const sharedCustomers = (customers || []).map((customer: any) => ({
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      first_name: customer.name?.split(' ')[0] || '',
      last_name: customer.name?.split(' ').slice(1).join(' ') || '',
      customer_code: customer.referral_code || `CUST${customer.id.slice(0, 8).toUpperCase()}`,
      points_balance: pointsMap.get(customer.id) || 0,
      membership_tier: 'bronze',
      visit_count: customer.total_check_ins || 0
      // Removed: avatar_url, check_in_streak, profile_qr_code (not needed for search)
    }));

    return NextResponse.json({
      customers: sharedCustomers,
      query,
      total: sharedCustomers.length
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
