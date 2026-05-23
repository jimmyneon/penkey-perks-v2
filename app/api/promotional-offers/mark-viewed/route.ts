import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { offerId } = await request.json()

    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    // Mark as viewed
    const { error } = await supabase
      .rpc('mark_promotional_offer_viewed', {
        p_user_id: user.id,
        p_offer_id: offerId
      })

    if (error) {
      console.error('Error marking promotional offer as viewed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in mark viewed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
