import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (staffError || !staffData) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    // Get all promotional offers
    const { data: offers, error } = await supabase
      .from('promotional_offers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promotional offers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ offers })
  } catch (error: any) {
    console.error('Error in promotional offers list:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
