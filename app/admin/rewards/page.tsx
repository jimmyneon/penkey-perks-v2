import { createClient } from '@/lib/supabase/server'
import { RewardsClient } from './rewards-client'

export default async function AdminRewardsPage() {
  const supabase = await createClient()

  // Get all rewards
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: false })

  return <RewardsClient rewards={rewards || []} />
}
