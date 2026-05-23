import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RewardsCatalogClient } from './catalog-client'

export default async function RewardsCatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's current points
  const { data: pointsBalance } = await supabase
    .rpc('get_user_points', { p_user_id: user.id })

  // Get all available rewards
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('points_cost', { ascending: true })

  return (
    <RewardsCatalogClient 
      rewards={rewards || []} 
      currentPoints={pointsBalance || 0}
      userId={user.id}
    />
  )
}
