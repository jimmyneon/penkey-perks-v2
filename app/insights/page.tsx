import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsClient } from './insights-client'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to find customer_id
  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', user.id)
    .single()

  // Fetch analytics data from POS integration API (cross-database call)
  const posBaseUrl = process.env.NEXT_PUBLIC_POS_API_URL || 'http://localhost:3001'
  const analyticsUrl = `${posBaseUrl}/api/integration/customers/${user.id}/analytics`
  
  let analyticsData = null
  try {
    console.log('[Insights] Fetching analytics from POS:', analyticsUrl)
    const response = await fetch(analyticsUrl, {
      cache: 'no-store', // Always fetch fresh data
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERKS_API_KEY}`, // Use same API key
      }
    })
    
    if (response.ok) {
      analyticsData = await response.json()
      console.log('[Insights] Analytics data loaded successfully')
    } else {
      console.error('[Insights] Failed to fetch analytics:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('[Insights] Error fetching analytics:', error)
  }

  return (
    <InsightsClient
      user={{
        id: user.id,
        name: profile?.name || 'User',
        email: profile?.email || user.email || '',
      }}
      analyticsData={analyticsData}
    />
  )
}
