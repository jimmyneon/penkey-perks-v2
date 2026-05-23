import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { lookupRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { success } = lookupRatelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: corsHeaders }
      );
    }

    const customerId = (await params).id;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!customerId) {
      return NextResponse.json({ 
        error: 'Customer ID required' 
      }, { status: 400, headers: corsHeaders });
    }

    // Create connection to POS database
    const posSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query POS database for customer's receipts
    const { data: receipts, error } = await posSupabase
      .from('receipts')
      .select(`
        id,
        receipt_number,
        total,
        subtotal,
        tax_total,
        created_at,
        dining_option,
        receipt_lines (
          id,
          name,
          quantity,
          unit_price,
          line_total,
          modifiers
        )
      `)
      .eq('customer_id', customerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch purchase history' 
      }, { status: 500, headers: corsHeaders });
    }

    // Transform receipts to purchase history format
    const purchases = (receipts || []).map((receipt: any) => ({
      receipt_id: receipt.id,
      receipt_number: receipt.receipt_number,
      date: receipt.created_at,
      total: receipt.total,
      subtotal: receipt.subtotal,
      tax_total: receipt.tax_total,
      dining_option: receipt.dining_option,
      items_count: receipt.receipt_lines?.length || 0,
      points_earned: Math.floor(receipt.total), // 1 point per £1
      items: receipt.receipt_lines?.map((line: any) => ({
        name: line.name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        line_total: line.line_total,
        modifiers: line.modifiers || []
      })) || []
    }));

    // Calculate summary statistics
    const totalSpent = purchases.reduce((sum: number, p: any) => sum + p.total, 0);
    const totalVisits = purchases.length;
    const totalPointsEarned = purchases.reduce((sum: number, p: any) => sum + p.points_earned, 0);

    return NextResponse.json({
      purchases,
      summary: {
        total_spent: totalSpent,
        total_visits: totalVisits,
        total_points_earned: totalPointsEarned,
        average_order_value: totalVisits > 0 ? totalSpent / totalVisits : 0
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500, headers: corsHeaders });
  }
}
