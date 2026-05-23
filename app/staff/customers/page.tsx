import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomersLeaderboard } from '@/components/admin/customers-leaderboard'

export default async function StaffCustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is staff
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!staffRecord) {
    redirect('/dashboard')
  }

  // Get all customers with comprehensive stats
  const { data: customers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (!customers) {
    return <CustomersLeaderboard customers={[]} />
  }

  // Fetch detailed stats for each customer
  const customersWithStats = await Promise.all(
    customers.map(async (customer) => {
      // Get lifetime beans (total earned from all positive transactions)
      const { data: beansData } = await supabase
        .from('points_transactions')
        .select('amount')
        .eq('user_id', customer.id)
        .gt('amount', 0)
      
      const lifetimeBeans = beansData?.reduce((sum, t) => sum + t.amount, 0) || 0

      // Get current balance (most recent balance_after)
      const { data: latestTransaction } = await supabase
        .from('points_transactions')
        .select('balance_after')
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      const currentBalance = latestTransaction?.balance_after || 0

      // Get rewards stats
      const { data: rewards } = await supabase
        .from('user_rewards')
        .select('status')
        .eq('user_id', customer.id)

      const rewardsEarned = rewards?.length || 0
      const rewardsRedeemed = rewards?.filter(r => r.status === 'redeemed').length || 0
      const rewardsActive = rewards?.filter(r => r.status === 'active').length || 0

      // Get game plays count
      const { count: gamePlaysCount } = await supabase
        .from('game_plays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', customer.id)

      // Get referrals stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select('confirmed')
        .eq('referrer_id', customer.id)

      const totalReferrals = referrals?.length || 0
      const confirmedReferrals = referrals?.filter(r => r.confirmed).length || 0

      // Get last check-in date (most recent positive transaction)
      const { data: lastTransaction } = await supabase
        .from('points_transactions')
        .select('created_at')
        .eq('user_id', customer.id)
        .eq('source', 'daily_checkin')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...customer,
        stats: {
          beans: lifetimeBeans,
          currentBalance,
          rewardsEarned,
          rewardsRedeemed,
          rewardsActive,
          gamePlays: gamePlaysCount || 0,
          totalReferrals,
          confirmedReferrals,
          lastCheckIn: lastTransaction?.created_at || null,
        }
      }
    })
  )

  return <CustomersLeaderboard customers={customersWithStats} />
}
