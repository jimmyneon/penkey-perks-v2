import { createClient } from '@/lib/supabase/server'
import { PointsConfigClient } from './points-config-client'

export default async function AdminPointsConfigPage() {
  const supabase = await createClient()

  // Get all points configurations with usage stats (via secure function)
  const { data: pointsConfigs, error } = await supabase
    .rpc('get_points_config_with_usage')

  if (error) {
    console.error('Error fetching points config:', error)
  }

  return <PointsConfigClient pointsConfigs={pointsConfigs || []} />
}
