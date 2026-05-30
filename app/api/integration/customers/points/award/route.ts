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

    // Get current customer bean balance
    const { data: beanBalance, error: beanError } = await supabase
      .from('bean_balances')
      .select('current_beans, lifetime_beans')
      .eq('user_id', customer_id)
      .single();

    if (beanError && beanError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok for new users
      console.error('Bean balance check error:', beanError);
      return NextResponse.json({ 
        error: 'Failed to check customer bean balance' 
      }, { status: 500, headers: corsHeaders });
    }

    const currentBeans = beanBalance?.current_beans || 0;
    
    // Check if adding beans would exceed cap
    if (currentBeans >= 25) {
      // Broadcast max beans notification to customer
      await supabase
        .channel(`user_notifications:${customer_id}`)
        .send({
          type: 'broadcast',
          event: 'max_beans_reached',
          payload: {
            message: 'You have reached the maximum bean cap of 25! Convert your beans to vouchers to earn more.',
            current_beans: currentBeans,
            action: 'convert_to_vouchers'
          }
        })
      
      return NextResponse.json({
        success: false,
        error: 'Customer has reached maximum bean cap of 25. Convert beans to vouchers first.',
        at_max_beans: true,
        current_beans: currentBeans
      }, { status: 400, headers: corsHeaders });
    }

    // Award beans using the award_beans function
    const { data: awardResult, error: awardError } = await supabase.rpc('award_beans', {
      p_user_id: customer_id,
      p_amount: points,
      p_source: 'pos_purchase',
      p_description: reason || 'Purchase points',
      p_metadata: {
        receipt_id: receipt_id,
        source: 'pos_integration'
      }
    });

    if (awardError) {
      console.error('Award beans error:', awardError);
      
      // Check if it's a max beans error
      if (awardError.message?.includes('maximum bean cap')) {
        return NextResponse.json({
          success: false,
          error: 'Customer has reached maximum bean cap of 25. Convert beans to vouchers first.',
          at_max_beans: true,
          current_beans: currentBeans
        }, { status: 400, headers: corsHeaders });
      }
      
      return NextResponse.json({ 
        error: 'Failed to award beans: ' + awardError.message 
      }, { status: 500, headers: corsHeaders });
    }

    // Get updated bean balance
    const { data: newBeanBalance } = await supabase
      .from('bean_balances')
      .select('current_beans, lifetime_beans')
      .eq('user_id', customer_id)
      .single();

    console.log(`[Perks] Awarded ${points} beans to customer ${customer_id}. New balance: ${newBeanBalance?.current_beans}`);

    return NextResponse.json({
      success: true,
      beans_awarded: points,
      new_balance: newBeanBalance?.current_beans || 0,
      previous_balance: currentBeans,
      lifetime_beans: newBeanBalance?.lifetime_beans || 0,
      description: reason || 'Purchase points'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500, headers: corsHeaders });
  }
}
