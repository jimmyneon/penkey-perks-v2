import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { lookupRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrData: string }> }
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

    const qrData = decodeURIComponent((await params).qrData);

    if (!qrData) {
      return NextResponse.json({ error: 'QR data required' }, { status: 400, headers: corsHeaders });
    }

    const supabase = await createAdminClient();

    // Parse profile QR data (format: "profile:customer_id:timestamp")
    if (qrData.startsWith('profile:')) {
      const parts = qrData.split(':');
      if (parts.length >= 2) {
        const customerId = parts[1];
        
        // Find customer by ID
        const { data: customer, error } = await supabase
          .from('users')
          .select(`
            id,
            email,
            phone,
            first_name,
            last_name,
            customer_code,
            profile_qr_code,
            points_balance,
            membership_tier,
            is_checked_in,
            last_checkin_at,
            checkin_store_id,
            total_spent,
            visit_count,
            profile_qr_expires_at
          `)
          .eq('id', customerId)
          .single();

        if (error || !customer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404, headers: corsHeaders });
        }

        // Check if profile QR has expired
        if (customer.profile_qr_expires_at) {
          const expiresAt = new Date(customer.profile_qr_expires_at);
          if (expiresAt < new Date()) {
            return NextResponse.json({ error: 'QR code has expired' }, { status: 410, headers: corsHeaders });
          }
        }

        // Transform to shared format
        const sharedCustomer = {
          id: customer.id,
          email: customer.email,
          phone: customer.phone,
          first_name: customer.first_name,
          last_name: customer.last_name,
          customer_code: customer.customer_code,
          profile_qr_code: customer.profile_qr_code,
          points_balance: customer.points_balance || 0,
          membership_tier: customer.membership_tier || 'bronze',
          is_checked_in: customer.is_checked_in || false,
          last_checkin_at: customer.last_checkin_at,
          checkin_store_id: customer.checkin_store_id,
          total_spent: customer.total_spent || 0,
          visit_count: customer.visit_count || 0,
          proximity_status: customer.is_checked_in ? 'checked_in' : 'unknown'
        };

        return NextResponse.json(sharedCustomer, { headers: corsHeaders });
      }
    }

    // If not a profile QR, try as regular customer code
    const { data: customer, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        phone,
        first_name,
        last_name,
        customer_code,
        profile_qr_code,
        points_balance,
        membership_tier,
        is_checked_in,
        last_checkin_at,
        checkin_store_id,
        total_spent,
        visit_count
      `)
      .eq('customer_code', qrData)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404, headers: corsHeaders });
    }

    const sharedCustomer = {
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      first_name: customer.first_name,
      last_name: customer.last_name,
      customer_code: customer.customer_code,
      profile_qr_code: customer.profile_qr_code,
      points_balance: customer.points_balance || 0,
      membership_tier: customer.membership_tier || 'bronze',
      is_checked_in: customer.is_checked_in || false,
      last_checkin_at: customer.last_checkin_at,
      checkin_store_id: customer.checkin_store_id,
      total_spent: customer.total_spent || 0,
      visit_count: customer.visit_count || 0,
      proximity_status: customer.is_checked_in ? 'checked_in' : 'unknown'
    };

    return NextResponse.json(sharedCustomer, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
