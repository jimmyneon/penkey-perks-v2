import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ReferralRedirectPage({ 
  params 
}: { 
  params: Promise<{ code: string }> 
}) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not logged in, redirect to login with ref code
  if (!user) {
    redirect(`/login?ref=${code}`)
  }

  // If logged in, try to claim the referral
  const referralCode = code

  // Look up referrer by referral code
  const { data: referrer } = await supabase
    .from('users')
    .select('id, name')
    .eq('referral_code', referralCode)
    .single()

  if (!referrer) {
    redirect('/dashboard?error=invalid_referral')
  }

  // Check if trying to refer themselves
  if (referrer.id === user.id) {
    redirect('/dashboard?error=self_referral')
  }

  // Check if already referred
  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', user.id)
    .single()

  if (existingReferral) {
    redirect('/dashboard?error=already_referred')
  }

  // Create referral record
  const { error: insertError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      confirmed: true,
    })

  if (insertError) {
    console.error('Error creating referral:', insertError)
    redirect('/dashboard?error=referral_failed')
  }

  // Award points to referrer
  const REFERRAL_BONUS = 50
  await supabase.rpc('add_points', {
    p_user_id: referrer.id,
    p_amount: REFERRAL_BONUS,
    p_source: 'referral',
    p_description: `Referral bonus for inviting ${user.email}`,
  })

  // Redirect to dashboard with success message
  redirect(`/dashboard?referral_success=true&referrer=${encodeURIComponent(referrer.name)}`)
}
