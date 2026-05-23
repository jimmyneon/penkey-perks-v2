import { createClient } from '@/lib/supabase/server'
import { StaffClient } from './staff-client'

export default async function AdminStaffPage() {
  const supabase = await createClient()

  // Get all staff with their user details
  const { data: staff } = await supabase
    .from('staff')
    .select(`
      *,
      users (
        id,
        name,
        email,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  return <StaffClient staff={staff || []} />
}
