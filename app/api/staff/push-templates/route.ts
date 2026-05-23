import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff or admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all push notification templates
    const { data: templates, error } = await supabase
      .from('push_notification_templates')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('priority', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    })

  } catch (error: any) {
    console.error('Error fetching push templates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
