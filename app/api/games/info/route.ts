import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ error: 'Game name required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const { data: game, error } = await supabase
      .from('mini_games')
      .select('*')
      .eq('name', name)
      .single()

    if (error || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch game info' },
      { status: 500 }
    )
  }
}
