import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { searchRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';
import { z } from 'zod';

const checkinSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  store_id: z.string().uuid('Invalid store ID'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  method: z.enum(['gps', 'qr_scan', 'manual']).optional(),
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
    const validation = checkinSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const { customer_id, store_id, latitude, longitude, method = 'gps' } = validation.data;
    const supabase = await createAdminClient();

    // Update customer check-in status in Perks database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_checked_in: true,
        last_checkin_at: new Date().toISOString(),
        checkin_store_id: store_id,
        current_location: `POINT(${longitude} ${latitude})`
      })
      .eq('id', customer_id);

    if (updateError) {
      console.error('Customer update error:', updateError);
      return NextResponse.json({ error: 'Failed to update customer status' }, { status: 500, headers: corsHeaders });
    }

    // Create check-in record if you have a separate table for tracking
    // This is optional - you might want to add this to your Perks database schema
    
    return NextResponse.json({
      success: true,
      message: 'Successfully checked in'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Update customer status to checked out
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_checked_in: false,
        current_location: null,
        checkin_store_id: null
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('Customer update error:', updateError);
      return NextResponse.json({ error: 'Failed to check out' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully checked out'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
