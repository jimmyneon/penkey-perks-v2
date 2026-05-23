import { NextResponse } from 'next/server'

/**
 * Clear notification cache for all users
 * Called after staff sends a message to force immediate display
 */
export async function POST(request: Request) {
  try {
    // Return a cache-busting timestamp
    // The client will use this to invalidate their cache
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      message: 'Cache cleared - notifications will refresh'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
