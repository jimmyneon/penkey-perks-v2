import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UnifiedRewardsClient } from './unified-rewards-client'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's current points (lifetime points)
  const { data: pointsData } = await supabase
    .rpc('get_user_points', { p_user_id: user.id })

  const currentPoints = pointsData || 0

  // Get points configurations for "How It Works" section
  const { data: pointsConfigs, error: configError } = await supabase
    .from('points_config')
    .select('action_type, points_amount, description, active')
    .eq('active', true)
    .order('points_amount', { ascending: false })

  // Debug logging
  console.log('Points Config Debug:', {
    configsCount: pointsConfigs?.length || 0,
    error: configError,
    configs: pointsConfigs?.slice(0, 3)
  })

  // Get all available rewards from catalog (points-based milestones)
  const { data: availableRewards } = await supabase
    .from('points_rewards')
    .select('*')
    .eq('active', true)
    .order('points_required', { ascending: true })

  // Get user's earned rewards (active, redeemed, and expired)
  const { data: userRewardsRaw } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'redeemed', 'expired'])
    .order('created_at', { ascending: false })

  // Get all rewards to join manually (more reliable than nested query)
  const { data: allRewards } = await supabase
    .from('rewards')
    .select('*')

  // Manually join the data
  const userRewards = userRewardsRaw?.map(ur => ({
    ...ur,
    rewards: allRewards?.find(r => r.id === ur.reward_id) || null
  })) || []

  // Debug logging
  console.log('Rewards Page Debug:', {
    userRewardsRawCount: userRewardsRaw?.length || 0,
    allRewardsCount: allRewards?.length || 0,
    userRewardsCount: userRewards.length,
    userRewards: userRewards.map(ur => ({
      id: ur.id,
      reward_id: ur.reward_id,
      has_reward_data: !!ur.rewards,
      reward_name: ur.rewards?.name
    }))
  })

  return (
    <UnifiedRewardsClient 
      currentPoints={currentPoints}
      availableRewards={availableRewards || []}
      userRewards={userRewards || []}
      userId={user.id}
      pointsConfigs={pointsConfigs || []}
    />
  )
}
