import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const templateId = searchParams.get('template_id')
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('email_logs')
      .select(`
        *,
        email_templates (name, display_name),
        users (name, email)
      `, { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    if (userId) {
      query = query.eq('recipient_user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: logs, error, count } = await query

    if (error) throw error

    // Get summary stats
    const { data: stats } = await supabase
      .from('email_logs')
      .select('status')

    const summary = {
      total: count || 0,
      sent: stats?.filter(s => s.status === 'sent').length || 0,
      delivered: stats?.filter(s => s.status === 'delivered').length || 0,
      opened: stats?.filter(s => s.status === 'opened').length || 0,
      clicked: stats?.filter(s => s.status === 'clicked').length || 0,
      bounced: stats?.filter(s => s.status === 'bounced').length || 0,
      failed: stats?.filter(s => s.status === 'failed').length || 0,
    }

    return NextResponse.json({ 
      logs, 
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    })
  } catch (error: any) {
    console.error('Get email logs error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email logs' },
      { status: 500 }
    )
  }
}
