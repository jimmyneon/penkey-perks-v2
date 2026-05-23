import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RewardQRClient } from './reward-qr-client'

export default async function RewardQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the specific user reward
  const { data: userReward } = await supabase
    .from('user_rewards')
    .select('*, rewards(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!userReward) {
    redirect('/rewards')
  }

  return (
    <RewardQRClient 
      userReward={userReward}
      userId={user.id}
    />
  )
}
