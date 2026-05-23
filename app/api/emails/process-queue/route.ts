import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Use admin client to bypass RLS for email queue processing
    const supabase = await createAdminClient()
    
    // Verify this is called from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get batch size from request or use default
    const body = await request.json().catch(() => ({}))
    const batchSize = body.batchSize || 10

    // Fetch pending emails from queue
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(batchSize)

    if (fetchError) {
      console.error('Error fetching email queue:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No emails to process',
        processed: 0 
      })
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[]
    }

    // Helper function to delay between emails (avoid rate limits)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Process each email
    for (let i = 0; i < queuedEmails.length; i++) {
      const email = queuedEmails[i]
      
      try {
        // Add delay between emails to respect rate limits (2 emails/second = 500ms delay)
        // Only delay if not the first email
        if (i > 0) {
          await delay(600) // 600ms = ~1.6 emails/second (safe buffer)
        }

        // Send email via Resend
        const result = await sendEmail({
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
        })

        if (result.success) {
          // Mark as sent
          await supabase.rpc('mark_email_sent', {
            p_queue_id: email.id,
            p_resend_id: result.data?.id || null,
            p_success: true,
            p_error_message: null
          })
          
          results.sent++
        } else {
          // Mark as failed
          const errorMessage = result.error && typeof result.error === 'object' && 'message' in result.error 
            ? String(result.error.message) 
            : 'Unknown error'
          
          await supabase.rpc('mark_email_sent', {
            p_queue_id: email.id,
            p_resend_id: null,
            p_success: false,
            p_error_message: errorMessage
          })
          
          results.failed++
          results.errors.push({
            queue_id: email.id,
            recipient: email.recipient_email,
            error: result.error
          })
        }
      } catch (error: any) {
        console.error('Error processing email:', error)
        
        // Mark as failed
        await supabase.rpc('mark_email_sent', {
          p_queue_id: email.id,
          p_resend_id: null,
          p_success: false,
          p_error_message: error.message || 'Exception during send'
        })
        
        results.failed++
        results.errors.push({
          queue_id: email.id,
          recipient: email.recipient_email,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: queuedEmails.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    })
  } catch (error: any) {
    console.error('Email queue processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process email queue' },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET(request: Request) {
  return POST(request)
}
