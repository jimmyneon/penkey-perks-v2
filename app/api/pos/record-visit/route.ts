import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/api/cors'

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { userId, beanRules, menuItems, staffId, locationId } = body
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders })
    }
    
    // Check if user already visited today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingVisit } = await supabase
      .from('daily_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('visit_date', today)
      .single()
    
    let baseBeans = 0
    let bonusBeans = 0
    
    // Only award base bean if no visit today
    if (!existingVisit) {
      baseBeans = 1
      
      // Record daily visit
      await supabase.from('daily_visits').insert({
        user_id: userId,
        visit_date: today,
        location_id: locationId || null,
      })
    }
    
    // Calculate bonus beans from rules
    if (beanRules) {
      if (beanRules.foodDrinkCombo) bonusBeans += 1
      if (beanRules.reusableCup) bonusBeans += 1
      if (beanRules.penkeyCup) bonusBeans += 1
      if (beanRules.before9am) bonusBeans += 1
      if (beanRules.after230pm) bonusBeans += 1
      if (beanRules.monthlySpecial) bonusBeans += 2
      if (beanRules.broughtFriend) bonusBeans += 2
    }
    
    const totalBeans = baseBeans + bonusBeans
    
    if (totalBeans > 0) {
      // Award beans using the database function
      const { error: awardError } = await supabase.rpc('award_beans', {
        p_user_id: userId,
        p_amount: totalBeans,
        p_source: 'purchase',
        p_reference_id: null,
        p_metadata: { beanRules, menuItems, staffId, locationId },
      })
      
      if (awardError) {
        console.error('Error awarding beans:', awardError)
        return NextResponse.json({ error: 'Failed to award beans' }, { status: 500, headers: corsHeaders })
      }
    }
    
    // Record purchase
    if (menuItems && menuItems.length > 0) {
      await supabase.from('purchases').insert({
        user_id: userId,
        total_amount: menuItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0),
        bean_rules: beanRules || {},
        menu_items: menuItems,
        staff_id: staffId || null,
        location_id: locationId || null,
      })
    }
    
    return NextResponse.json({
      success: true,
      beansAwarded: totalBeans,
      baseBeans,
      bonusBeans,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error recording visit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
