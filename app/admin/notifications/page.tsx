import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsAdmin } from './notifications-admin'

export default async function NotificationsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    redirect('/dashboard')
  }

  // Get all notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('priority', { ascending: true })

  return <NotificationsAdmin notifications={notifications || []} />
}
