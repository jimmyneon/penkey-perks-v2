import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Server-side validation function
function validateNotification(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.type) errors.push('Type is required')
  if (!data.priority) errors.push('Priority is required')
  if (!data.title) errors.push('Title is required')
  if (!data.message) errors.push('Message is required')

  // Type validation
  const validTypes = ['reward', 'streak', 'checkin', 'stamp', 'game', 'milestone', 'custom']
  if (data.type && !validTypes.includes(data.type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`)
  }

  // Priority validation (1-10)
  if (data.priority && (data.priority < 1 || data.priority > 10)) {
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

  // Conditions validation (must be valid JSON)
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

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Server-side validation
    const validation = validateNotification(data)
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

    // Insert notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        icon: data.icon || null,
        conditions: data.conditions || {},
        variant: data.variant || 'default',
        dismissible: data.dismissible ?? true,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        target_audience: data.targetAudience || 'all',
        min_points: data.minPoints || null,
        max_points: data.maxPoints || null,
        active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
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
