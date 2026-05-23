import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get rotation hours from query params (default 4 hours)
    const { searchParams } = new URL(request.url)
    const rotationHours = parseInt(searchParams.get('hours') || '4', 10)

    // Call the database function to get current game rotation
    const { data: games, error } = await supabase.rpc('get_user_game_rotation', {
      p_user_id: user.id,
      p_rotation_hours: rotationHours
    })

    if (error) {
      console.error('Error fetching game rotation:', error)
      return NextResponse.json(
        { error: 'Failed to fetch game rotation', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data for frontend consumption
    const rotationData = {
      games: games || [],
      refreshAt: games?.[0]?.refresh_at || null,
      rotationNumber: games?.[0]?.rotation_number || 0,
      totalGames: games?.length || 0,
      playedCount: games?.filter((g: any) => g.has_played).length || 0
    }

    return NextResponse.json(rotationData)
  } catch (error: any) {
    console.error('Unexpected error in game rotation API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
