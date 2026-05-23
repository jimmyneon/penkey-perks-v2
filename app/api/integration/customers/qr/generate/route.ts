import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { searchRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';
import { z } from 'zod';

const generateQRSchema = z.object({
  customer_id: z.string().uuid(),
  qr_type: z.enum(['checkin', 'profile']).optional(),
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
    // ✅ 1. Enforce HTTPS
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
        { error: 'Too many requests' },
        { status: 429, headers: corsHeaders }
      );
    }

    // ✅ 4. Validate input
    const body = await request.json();
    const validation = generateQRSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const { customer_id, qr_type = 'profile' } = validation.data;
    const supabase = await createAdminClient();

    // Get customer details
    const { data: customer, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, customer_code')
      .eq('id', customer_id)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404, headers: corsHeaders });
    }

    let qrData: string;
    let expiresAt: string | undefined;

    if (qr_type === 'checkin') {
      // Check-in QR - uses existing customer_code
      qrData = customer.customer_code;
    } else {
      // Profile QR - links to customer profile
      qrData = `profile:${customer.id}:${Date.now()}`;
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    }

    // Update customer with profile QR if needed
    if (qr_type === 'profile') {
      await supabase
        .from('users')
        .update({ 
          profile_qr_code: qrData,
          profile_qr_expires_at: expiresAt
        })
        .eq('id', customer_id);
    }

    return NextResponse.json({
      qr_code: qrData,
      qr_data: qrData,
      expires_at: expiresAt,
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
