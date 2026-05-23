import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    const body = await request.json()
    const { 
      display_name, 
      description, 
      subject, 
      html_body, 
      text_body,
      variables, 
      category, 
      active 
    } = body

    // Update template
    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        display_name,
        description,
        subject,
        html_body,
        text_body,
        variables,
        category,
        active
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Update email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner (only owners can delete templates)
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!staff || staff.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 })
    }

    // Delete template
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email template' },
      { status: 500 }
    )
  }
}
