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

    if (!customerId) {
      return NextResponse.json({ 
        error: 'Customer ID required' 
      }, { status: 400, headers: corsHeaders });
    }

    // Create connection to database with service role
    const posSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'public' }
      }
    );

    // Fetch all receipts for analytics using RPC to bypass schema cache
    const { data: receipts, error: receiptsError } = await posSupabase
      .rpc('get_customer_receipts_for_analytics', { 
        p_customer_id: customerId 
      }) as any;

    if (receiptsError) {
      console.error('Database error:', receiptsError);
      return NextResponse.json({ 
        error: 'Failed to fetch analytics data' 
      }, { status: 500, headers: corsHeaders });
    }

    const receiptsList = receipts || [];

    // Calculate top 5 favorite items
    const itemFrequency: Record<string, { name: string; count: number; totalSpent: number; item_id: string }> = {};
    
    receiptsList.forEach((receipt: any) => {
      receipt.receipt_lines?.forEach((line: any) => {
        const key = line.item_id || line.name;
        if (!itemFrequency[key]) {
          itemFrequency[key] = {
            name: line.name,
            count: 0,
            totalSpent: 0,
            item_id: line.item_id
          };
        }
        itemFrequency[key].count += line.quantity;
        itemFrequency[key].totalSpent += line.line_total;
      });
    });

    const topItems = Object.values(itemFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        times_ordered: item.count,
        total_spent: item.totalSpent,
        item_id: item.item_id
      }));

    // Calculate purchase statistics and savings
    const totalSpent = receiptsList.reduce((sum: number, r: any) => sum + r.total, 0);
    const totalVisits = receiptsList.length;
    const averageOrderValue = totalVisits > 0 ? totalSpent / totalVisits : 0;
    
    // Calculate total savings from discounts
    const totalDiscountSavings = receiptsList.reduce((sum: number, r: any) => sum + (r.discount_total || 0), 0);
    
    // Calculate points earned (1 point per £1 spent)
    const totalPointsEarned = Math.floor(totalSpent);
    
    // Estimate free items received (assuming 10 stamps = 1 free coffee at ~£3.50)
    const estimatedFreeCoffees = Math.floor(totalVisits / 10);
    const freeCoffeeSavings = estimatedFreeCoffees * 3.50;
    
    // Total savings = discounts + free items value
    const totalSavings = totalDiscountSavings + freeCoffeeSavings;

    // Dining option preference
    const diningOptions: Record<string, number> = {};
    receiptsList.forEach((r: any) => {
      diningOptions[r.dining_option] = (diningOptions[r.dining_option] || 0) + 1;
    });
    const favoriteDiningOption = Object.entries(diningOptions)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'eat-in';

    // Time-based analytics
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};
    const monthlySpending: Record<string, number> = {};

    receiptsList.forEach((r: any) => {
      const date = new Date(r.created_at);
      const hour = date.getHours();
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
      const monthKey = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + r.total;
    });

    const mostActiveHour = parseInt(Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '12');
    const mostActiveDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';

    // Recent purchases (last 10)
    const recentPurchases = receiptsList.slice(0, 10).map((receipt: any) => ({
      receipt_id: receipt.id,
      receipt_number: receipt.receipt_number,
      date: receipt.created_at,
      total: receipt.total,
      subtotal: receipt.subtotal,
      tax_total: receipt.tax_total,
      dining_option: receipt.dining_option,
      items_count: receipt.receipt_lines?.length || 0,
      items: receipt.receipt_lines?.map((line: any) => ({
        name: line.name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        line_total: line.line_total,
        modifiers: line.modifiers || []
      })) || []
    }));

    // First purchase date
    const firstPurchaseDate = receiptsList.length > 0 
      ? receiptsList[receiptsList.length - 1].created_at 
      : null;

    // Calculate loyalty milestones
    const milestones = [
      { visits: 1, achieved: totalVisits >= 1, label: 'First Visit' },
      { visits: 5, achieved: totalVisits >= 5, label: 'Regular' },
      { visits: 10, achieved: totalVisits >= 10, label: 'Loyal Customer' },
      { visits: 25, achieved: totalVisits >= 25, label: 'VIP' },
      { visits: 50, achieved: totalVisits >= 50, label: 'Super Fan' },
      { visits: 100, achieved: totalVisits >= 100, label: 'Legend' },
    ];

    const nextMilestone = milestones.find(m => !m.achieved) || milestones[milestones.length - 1];

    return NextResponse.json({
      summary: {
        total_visits: totalVisits,
        total_savings: totalSavings,
        discount_savings: totalDiscountSavings,
        free_coffee_savings: freeCoffeeSavings,
        estimated_free_coffees: estimatedFreeCoffees,
        total_points_earned: totalPointsEarned,
        favorite_dining_option: favoriteDiningOption,
        most_active_hour: mostActiveHour,
        most_active_day: mostActiveDay,
        first_purchase_date: firstPurchaseDate,
        member_since_days: firstPurchaseDate 
          ? Math.floor((Date.now() - new Date(firstPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      },
      top_items: topItems,
      recent_purchases: recentPurchases,
      monthly_spending: Object.entries(monthlySpending)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 6), // Last 6 months
      milestones: {
        achieved: milestones.filter(m => m.achieved),
        next: nextMilestone,
        progress: totalVisits / nextMilestone.visits
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500, headers: corsHeaders });
  }
}
