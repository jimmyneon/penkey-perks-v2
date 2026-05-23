import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UnsubscribeClient } from './unsubscribe-client'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    redirect('/')
  }

  const supabase = await createClient()

  // Verify token and get user info
  const { data: tokenData } = await supabase
    .from('unsubscribe_tokens')
    .select('user_id, used, expires_at')
    .eq('token', token)
    .single()

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-penkey-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-penkey-dark mb-4">Invalid Link</h1>
          <p className="text-penkey-text mb-6">
            This unsubscribe link is invalid or has expired.
          </p>
          <a
            href="/"
            className="inline-block bg-penkey-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-penkey-orange-dark transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  // Check if expired
  const isExpired = new Date(tokenData.expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen bg-penkey-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-penkey-dark mb-4">Link Expired</h1>
          <p className="text-penkey-text mb-6">
            This unsubscribe link has expired. Please contact support if you need assistance.
          </p>
          <a
            href="/"
            className="inline-block bg-penkey-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-penkey-orange-dark transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  // Get user email preferences
  const { data: preferences } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', tokenData.user_id)
    .single()

  return <UnsubscribeClient token={token} preferences={preferences} />
}
