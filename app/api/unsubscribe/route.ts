import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, unsubscribeAll, preferences } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('unsubscribe_tokens')
      .select('user_id, used, expires_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    // Check if already used
    if (tokenData.used) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    }

    if (unsubscribeAll) {
      // Unsubscribe from all emails
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          unsubscribed_all: true,
          unsubscribed_at: new Date().toISOString(),
          achievement_emails: false,
          reminder_emails: false,
          digest_emails: false,
          marketing_emails: false,
          reengagement_emails: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', tokenData.user_id)

      if (updateError) {
        console.error('Error unsubscribing:', updateError)
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
      }
    } else if (preferences) {
      // Update specific preferences
      const { error: updateError } = await supabase
        .from('email_preferences')
        .update({
          achievement_emails: preferences.achievement_emails,
          reminder_emails: preferences.reminder_emails,
          digest_emails: preferences.digest_emails,
          marketing_emails: preferences.marketing_emails,
          reengagement_emails: preferences.reengagement_emails,
          unsubscribed_all: false, // Re-subscribe if they update preferences
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', tokenData.user_id)

      if (updateError) {
        console.error('Error updating preferences:', updateError)
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
      }
    }

    // Mark token as used
    await supabase
      .from('unsubscribe_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token', token)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
