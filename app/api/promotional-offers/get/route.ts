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

    // Get promotional offers for user
    const { data: offers, error } = await supabase
      .rpc('get_user_promotional_offers', { p_user_id: user.id })

    if (error) {
      console.error('Error fetching promotional offers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ offers })
  } catch (error: any) {
    console.error('Error in promotional offers GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
