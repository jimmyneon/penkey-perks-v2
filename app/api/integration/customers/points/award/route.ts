import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { awardPointsRatelimit } from '@/lib/ratelimit';
import { awardPointsSchema, validateRequest } from '@/lib/api/validation';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
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
    const { success } = awardPointsRatelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests - please try again later' },
        { status: 429, headers: corsHeaders }
      );
    }

    // ✅ 4. Parse and validate input
    const body = await request.json();
    const validation = validateRequest(awardPointsSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const { customer_id, points, receipt_id, reason } = validation.data;

    const supabase = await createAdminClient();

    // Get current customer data
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, points_balance, membership_tier')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ 
        error: 'Customer not found' 
      }, { status: 404, headers: corsHeaders });
    }

    const currentPoints = customer.points_balance || 0;
    const newPointsBalance = currentPoints + points;

    // Determine new membership tier based on total points
    let newTier = customer.membership_tier || 'bronze';
    if (newPointsBalance >= 1000) {
      newTier = 'platinum';
    } else if (newPointsBalance >= 500) {
      newTier = 'gold';
    } else if (newPointsBalance >= 200) {
      newTier = 'silver';
    } else {
      newTier = 'bronze';
    }

    // Update customer points and tier
    const { error: updateError } = await supabase
      .from('users')
      .update({
        points_balance: newPointsBalance,
        membership_tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id);

    if (updateError) {
      console.error('Customer update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update customer points' 
      }, { status: 500, headers: corsHeaders });
    }

    // ✅ 5. Check for duplicate transaction (idempotency)
    const { data: existingTransaction } = await supabase
      .from('customer_points_transactions')
      .select('id, points')
      .eq('receipt_id', receipt_id)
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (existingTransaction) {
      console.log(`[Perks] Points already awarded for receipt ${receipt_id}`);
      
      // Return success with existing transaction details
      return NextResponse.json({
        success: true,
        points_awarded: existingTransaction.points,
        already_awarded: true,
        message: 'Points were already awarded for this receipt'
      }, { headers: corsHeaders });
    }

    // Create points transaction record
    const { error: transactionError } = await supabase
      .from('customer_points_transactions')
      .insert({
        customer_id,
        receipt_id,
        type: 'earned',
        points,
        reason: reason || 'Purchase points',
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Failed to create points transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to record points transaction' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`[Perks] Awarded ${points} points to customer ${customer_id}. New balance: ${newPointsBalance}`);

    return NextResponse.json({
      success: true,
      points_awarded: points,
      new_balance: newPointsBalance,
      previous_balance: currentPoints,
      new_tier: newTier,
      tier_changed: newTier !== customer.membership_tier,
      already_awarded: false
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500, headers: corsHeaders });
  }
}
