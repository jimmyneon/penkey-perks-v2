import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClient 
      user={{
        id: user.id,
        email: user.email || '',
        name: profile?.name || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
        avatar_url: profile?.avatar_url || '',
        gps_consent: profile?.gps_consent || false,
        marketing_consent: profile?.marketing_consent || false,
      }}
    />
  )
}
