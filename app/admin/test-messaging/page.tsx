import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TestMessagingClient } from './test-messaging-client'

export default async function TestMessagingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    redirect('/dashboard')
  }

  return <TestMessagingClient userEmail={profile.email} userId={user.id} />
}
