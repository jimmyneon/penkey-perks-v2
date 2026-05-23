import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffDashboardClient } from './staff-dashboard-client'

export default async function StaffDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is staff or admin
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  console.log('Staff Dashboard - User ID:', user.id)
  console.log('Staff Dashboard - Profile:', profile)
  console.log('Staff Dashboard - Profile Error:', profileError)
  console.log('Staff Dashboard - Role:', profile?.role)

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    console.log('Staff Dashboard - REDIRECTING - Role not staff/admin:', profile?.role)
    redirect('/dashboard')
  }

  // Get today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Total customers
  const { count: totalCustomers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  // Active customers (checked in last 30 days) - get unique users
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: activeCheckIns, error: activeError } = await supabase
    .from('points_transactions')
    .select('user_id')
    .eq('source', 'visit')
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  if (activeError) {
    console.error('Active Customers Error:', activeError)
  }
  
  // Count unique user IDs
  const uniqueUserIds = new Set(activeCheckIns?.map(c => c.user_id) || [])
  const uniqueActive = uniqueUserIds.size

  // Today's check-ins
  const { count: checkInsToday, error: checkInsError } = await supabase
    .from('points_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'visit')
    .gte('created_at', today.toISOString())
  
  if (checkInsError) {
    console.error('Check-ins Today Error:', checkInsError)
  }

  // Today's stamps
  const { count: stampsToday } = await supabase
    .from('coffee_stamps')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Total beans awarded (all time)
  let totalPoints = 0
  const { data: totalPointsData, error: pointsError } = await supabase
    .rpc('get_total_points_awarded')

  if (pointsError) {
    console.error('Total Beans Error (function may not exist):', pointsError)
    // Fallback: calculate manually
    const { data: transactions } = await supabase
      .from('points_transactions')
      .select('amount')
      .gt('amount', 0)

    totalPoints = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
    console.log('Using fallback calculation for total beans:', totalPoints)
  } else {
    totalPoints = totalPointsData || 0
  }

  // Pending beans across entire app (sum of all pending points rewards)
  const { data: pendingBeansData, error: claimsError } = await supabase
    .from('pending_rewards')
    .select('amount')
    .eq('status', 'pending')
    .eq('reward_type', 'points')
  
  if (claimsError) {
    console.error('Pending Claims Error:', claimsError)
  }
  
  const pendingClaims = pendingBeansData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0

  // Active rewards ready to redeem
  const { count: activeRewards, error: rewardsError } = await supabase
    .from('user_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  
  if (rewardsError) {
    console.error('Active Rewards Error:', rewardsError)
  }

  // Top customers by points (this week)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: topCustomers } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'customer')
    .order('current_points', { ascending: false })
    .limit(5)

  const stats = {
    totalCustomers: totalCustomers || 0,
    activeCustomers: uniqueActive,
    checkInsToday: checkInsToday || 0,
    stampsToday: stampsToday || 0,
    totalPoints: totalPoints,
    pendingClaims: pendingClaims || 0,
    activeRewards: activeRewards || 0
  }

  console.log('📊 Staff Dashboard Stats:', {
    totalCustomers: `${totalCustomers} users with role=customer`,
    activeCustomers: `${uniqueActive} unique users who checked in last 30 days`,
    checkInsToday: `${checkInsToday} check-ins since midnight`,
    stampsToday: `${stampsToday} coffee stamps given today`,
    totalPoints: `${totalPoints} total beans awarded all-time`,
    pendingClaims: `${pendingClaims} total pending beans across entire app`,
    activeRewards: `${activeRewards} rewards given out that are still valid`
  })

  return (
    <StaffDashboardClient 
      staffName={profile?.name || 'Staff Member'}
      stats={stats}
      topCustomers={topCustomers || []}
    />
  )
}
