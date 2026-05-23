import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin or staff role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { to, template, variables } = await request.json()

    if (!to || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: to, template' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS
    const adminClient = await createAdminClient()

    // Get template from database
    const { data: emailTemplate, error: templateError } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('name', template)
      .eq('active', true)
      .single()

    if (templateError || !emailTemplate) {
      return NextResponse.json(
        { error: `Template '${template}' not found or inactive` },
        { status: 404 }
      )
    }

    // Substitute variables in subject and body
    let subject = emailTemplate.subject
    let htmlBody = emailTemplate.html_body

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, String(value))
        htmlBody = htmlBody.replace(regex, String(value))
      }
    }

    // Queue email using admin client to bypass RLS
    const { data: queuedEmail, error: queueError } = await adminClient
      .from('email_queue')
      .insert({
        template_id: emailTemplate.id,
        recipient_email: to,
        subject,
        html_body: htmlBody,
        text_body: htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        variables: { test: true, ...variables },
        status: 'pending',
      })
      .select()
      .single()

    if (queueError) {
      throw queueError
    }

    return NextResponse.json({
      success: true,
      message: 'Email queued successfully',
      emailId: queuedEmail.id,
      to,
      subject,
    })
  } catch (error: any) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
