import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AwardPointsClient } from './award-points-client'

export default async function AwardPointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is staff or admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    redirect('/dashboard')
  }

  // Get award types
  const { data: awardTypes } = await supabase
    .from('award_type_limits')
    .select('*')
    .eq('active', true)
    .order('points', { ascending: false })

  return (
    <AwardPointsClient 
      staffId={user.id}
      awardTypes={awardTypes || []}
    />
  )
}
