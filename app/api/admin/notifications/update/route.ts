import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Server-side validation function (same as create)
function validateNotificationUpdate(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // ID is required
  if (!data.id) errors.push('ID is required')

  // Type validation
  const validTypes = ['reward', 'streak', 'checkin', 'stamp', 'game', 'milestone', 'custom']
  if (data.type && !validTypes.includes(data.type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`)
  }

  // Priority validation (1-10)
  if (data.priority !== undefined && (data.priority < 1 || data.priority > 10)) {
    errors.push('Priority must be between 1 and 10')
  }

  // Title length
  if (data.title && data.title.length > 100) {
    errors.push('Title must be 100 characters or less')
  }

  // Message length
  if (data.message && data.message.length > 500) {
    errors.push('Message must be 500 characters or less')
  }

  // Variant validation
  const validVariants = ['default', 'streak', 'success', 'reward']
  if (data.variant && !validVariants.includes(data.variant)) {
    errors.push(`Variant must be one of: ${validVariants.join(', ')}`)
  }

  // Date validation
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    if (start >= end) {
      errors.push('Start date must be before end date')
    }
  }

  // Points range validation
  if (data.minPoints !== undefined && data.maxPoints !== undefined) {
    if (data.minPoints > data.maxPoints) {
      errors.push('Min points must be less than or equal to max points')
    }
  }

  // Conditions validation
  if (data.conditions) {
    try {
      if (typeof data.conditions === 'string') {
        JSON.parse(data.conditions)
      } else if (typeof data.conditions !== 'object') {
        errors.push('Conditions must be a valid JSON object')
      }
    } catch (e) {
      errors.push('Conditions must be valid JSON')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // Server-side validation
    const validation = validateNotificationUpdate(data)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'staff'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update notification
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update provided fields
    if (data.type !== undefined) updateData.type = data.type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.title !== undefined) updateData.title = data.title
    if (data.message !== undefined) updateData.message = data.message
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.conditions !== undefined) updateData.conditions = data.conditions
    if (data.variant !== undefined) updateData.variant = data.variant
    if (data.dismissible !== undefined) updateData.dismissible = data.dismissible
    if (data.startDate !== undefined) updateData.start_date = data.startDate || null
    if (data.endDate !== undefined) updateData.end_date = data.endDate || null
    if (data.targetAudience !== undefined) updateData.target_audience = data.targetAudience
    if (data.minPoints !== undefined) updateData.min_points = data.minPoints
    if (data.maxPoints !== undefined) updateData.max_points = data.maxPoints

    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(notification)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
