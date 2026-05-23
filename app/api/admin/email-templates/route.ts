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

    // Get all email templates
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Get email templates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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
      name, 
      display_name, 
      description, 
      subject, 
      html_body, 
      text_body,
      variables, 
      category, 
      active 
    } = body

    // Create new template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        display_name,
        description,
        subject,
        html_body,
        text_body,
        variables,
        category,
        active,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Create email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create email template' },
      { status: 500 }
    )
  }
}
