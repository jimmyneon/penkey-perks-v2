import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PromotionalOffersClient } from './promotional-offers-client'

export default async function StaffPromotionalOffersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is staff
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!staffData) {
    redirect('/dashboard')
  }

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <PromotionalOffersClient 
      staffId={staffData.id}
      staffName={userData?.name || 'Staff'}
    />
  )
}
