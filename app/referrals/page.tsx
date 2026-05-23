import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReferralsClient } from './referrals-client'

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with referral code
  const { data: profile } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  // Get user's referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const totalReferrals = referrals?.length || 0
  const confirmedReferrals = referrals?.filter(r => r.confirmed).length || 0
  const pendingReferrals = totalReferrals - confirmedReferrals

  // Use referral code from database
  const referralCode = profile?.referral_code || 'ERROR'
  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.rewards.penkey.co.uk'}/ref/${referralCode}`

  return (
    <ReferralsClient
      referralUrl={referralUrl}
      referralCode={referralCode}
      stats={{
        total: totalReferrals,
        confirmed: confirmedReferrals,
        pending: pendingReferrals,
      }}
      referrals={referrals || []}
    />
  )
}
