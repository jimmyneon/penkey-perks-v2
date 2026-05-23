import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Get random message from database
 * Bypasses cache - always returns fresh message
 */
export async function POST(request: Request) {
  try {
    const { category, context = 'default', count = 1 } = await request.json()

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get random message(s) from database
    const { data, error } = await supabase.rpc(
      count > 1 ? 'get_rotating_messages' : 'get_random_message',
      {
        p_category: category,
        p_context: context,
        ...(count > 1 && { p_count: count })
      }
    )

    if (error) {
      console.error('Error fetching message:', error)
      return NextResponse.json(
        { error: 'Failed to fetch message', details: error.message },
        { status: 500 }
      )
    }

    // Return single message or array
    if (count === 1) {
      return NextResponse.json(data?.[0] || null)
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error in get-random message:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Allow GET requests too (for easier testing)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const context = searchParams.get('context') || 'default'
  const count = parseInt(searchParams.get('count') || '1')

  if (!category) {
    return NextResponse.json(
      { error: 'Category is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    count > 1 ? 'get_rotating_messages' : 'get_random_message',
    {
      p_category: category,
      p_context: context,
      ...(count > 1 && { p_count: count })
    }
  )

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch message', details: error.message },
      { status: 500 }
    )
  }

  if (count === 1) {
    return NextResponse.json(data?.[0] || null)
  }

  return NextResponse.json(data || [])
}
