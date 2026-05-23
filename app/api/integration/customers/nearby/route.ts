import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { nearbyRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';

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
    const { success } = nearbyRatelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests - please try again later' },
        { status: 429, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const radiusMeters = parseInt(searchParams.get('radius') || '100');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400, headers: corsHeaders });
    }

    const supabase = await createAdminClient();

    // Get all users from Perks database (filtering will be done client-side)
    const { data: customers, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        last_check_in,
        location_updated_at
      `);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Get beans for each customer
    const nearbyCustomers = await Promise.all((customers || []).map(async (customer: any) => {
      // Split name into first_name and last_name for compatibility
      const nameParts = (customer.name || '').split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      
      // Get total available beans using the database function
      const { data: beans, error: beansError } = await supabase.rpc('get_user_points', {
        p_user_id: customer.id
      });
      
      if (beansError) {
        console.error('Error fetching beans for user:', customer.id, beansError);
      }
      
      return {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        first_name,
        last_name,
        customer_code: customer.id, // Use ID as customer_code if not available
        points_balance: beans || 0, // Today's beans from game_plays
        membership_tier: 'bronze',
        is_checked_in: false,
        last_checkin_at: customer.last_check_in,
        last_nearby_at: customer.location_updated_at
        // ✅ GPS coordinates removed for privacy
      };
    }));

    return NextResponse.json({
      customers: nearbyCustomers,
      search_radius: radiusMeters
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
