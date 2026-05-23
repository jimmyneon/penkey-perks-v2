import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { validateIntegrationAuth, unauthorizedResponse } from '@/lib/api/integration-auth';
import { nearbyRatelimit } from '@/lib/ratelimit';
import { enforceHTTPS, httpsRequiredResponse, getClientIP } from '@/lib/api/security';
import { z } from 'zod';

const proximitySchema = z.object({
  store_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_meters: z.number().int().min(10).max(1000).optional(),
  include_checked_in: z.boolean().optional(),
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
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
    const { success } = nearbyRatelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: corsHeaders }
      );
    }

    // ✅ 4. Validate input
    const body = await request.json();
    const validation = proximitySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      store_id,
      latitude,
      longitude,
      radius_meters = 25,
      include_checked_in = true
    } = validation.data;

    const supabase = await createAdminClient();

    // Get all customers with GPS location data
    const { data: allCustomers, error } = await supabase
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
        referral_code,
        current_latitude,
        current_longitude,
        location_updated_at
      `)
      .eq('status', 'active')
      .not('current_latitude', 'is', null)
      .not('current_longitude', 'is', null)
      .order('location_updated_at', { ascending: false, nullsFirst: false })
      .limit(100); // Get more since we'll filter by distance

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log(`[Proximity] Found ${allCustomers?.length || 0} customers with GPS data`);
    if (allCustomers && allCustomers.length > 0) {
      console.log('[Proximity] Sample customer:', {
        id: allCustomers[0].id,
        name: allCustomers[0].name,
        lat: allCustomers[0].current_latitude,
        lng: allCustomers[0].current_longitude
      });
    }

    const storeLocation = { latitude, longitude };
    const detectedCustomers: any[] = [];
    let checkedInCount = 0;
    let nearbyCount = 0;

    // Fetch points balance for all customers in parallel
    const customerIds = (allCustomers || []).map((c: any) => c.id);
    const pointsPromises = customerIds.map((id: string) => 
      supabase.rpc('get_user_points', { p_user_id: id })
    );
    const pointsResults = await Promise.all(pointsPromises);
    const pointsMap = new Map(customerIds.map((id: string, i: number) => [id, pointsResults[i].data || 0]));

    // Process each customer and calculate real distance
    (allCustomers || []).forEach((customer: any) => {
      // Calculate actual distance using GPS coordinates
      const distance = calculateDistance(
        storeLocation.latitude,
        storeLocation.longitude,
        customer.current_latitude,
        customer.current_longitude
      );

      // Only include customers within the specified radius
      if (distance > radius_meters) {
        console.log(`[Proximity] Skipping ${customer.name} - ${Math.round(distance)}m away (radius: ${radius_meters}m)`);
        return; // Skip customers outside radius
      }

      console.log(`[Proximity] Including ${customer.name} - ${Math.round(distance)}m away`);

      const proximityStatus = customer.last_check_in ? 'checked_in' : 'nearby';
      
      if (customer.last_check_in) {
        checkedInCount++;
      } else {
        nearbyCount++;
      }

      detectedCustomers.push({
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        first_name: customer.name?.split(' ')[0] || '',
        last_name: customer.name?.split(' ').slice(1).join(' ') || '',
        customer_code: customer.referral_code || `CUST${customer.id.slice(0, 8).toUpperCase()}`,
        profile_qr_code: `profile:${customer.id}`,
        points_balance: pointsMap.get(customer.id) || 0, // Actual beans balance
        membership_tier: 'bronze', // Tier based on check-in streak
        is_checked_in: customer.last_check_in ? true : false,
        is_nearby: true, // All returned customers are "nearby"
        last_checkin_at: customer.last_check_in,
        last_nearby_at: new Date().toISOString(),
        checkin_store_id: store_id,
        total_spent: 0, // Purchase history not in users table
        visit_count: customer.total_check_ins || 0,
        distance_meters: Math.round(distance),
        proximity_status: proximityStatus,
        avatar_url: customer.avatar_url,
        check_in_streak: customer.check_in_streak || 0
      });
    });

    // Sort by proximity status (checked-in first) then by distance
    detectedCustomers.sort((a, b) => {
      if (a.proximity_status === 'checked_in' && b.proximity_status !== 'checked_in') return -1;
      if (b.proximity_status === 'checked_in' && a.proximity_status !== 'checked_in') return 1;
      return a.distance_meters - b.distance_meters;
    });

    console.log(`[Proximity] Returning ${detectedCustomers.length} customers within ${radius_meters}m`);

    return NextResponse.json({
      customers: detectedCustomers,
      checked_in_count: checkedInCount,
      nearby_count: nearbyCount,
      total_detected: detectedCustomers.length,
      detection_radius: radius_meters,
      store_location: storeLocation
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Helper function to calculate distance between two GPS points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Helper function to update nearby status
async function updateNearbyStatus(supabase: any, customerId: string, storeId: string, isNearby: boolean) {
  try {
    await supabase
      .from('users')
      .update({
        is_nearby: isNearby,
        last_nearby_at: new Date().toISOString(),
        nearby_store_id: isNearby ? storeId : null
      })
      .eq('id', customerId);
  } catch (error) {
    console.error('Failed to update nearby status:', error);
  }
}
