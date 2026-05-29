import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './profile-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Get bean balance
  const { data: beanBalance } = await supabase
    .from('bean_balances')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Get user badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)

  // Get active vouchers
  const { data: userVouchers } = await supabase
    .from('user_vouchers')
    .select('*, voucher_templates(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Get recent purchases for favorite orders
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <ProfileClient 
      user={{
        id: user.id,
        email: user.email || '',
        name: profile?.name || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
        avatar_url: profile?.avatar_url || '',
        gps_consent: profile?.preferences?.gps_consent || false,
        marketing_consent: profile?.preferences?.marketing_consent || false,
      }}
      beanBalance={beanBalance}
      userBadges={userBadges || []}
      userVouchers={userVouchers || []}
      purchases={purchases || []}
    />
  )
}
