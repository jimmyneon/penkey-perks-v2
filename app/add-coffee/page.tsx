import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddCoffeeClient } from './add-coffee-client'

export default async function AddCoffeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with return URL
    redirect('/login?redirect=/add-coffee')
  }

  // Get current stamp count
  const { data: stamps } = await supabase
    .from('coffee_stamps')
    .select('id')
    .eq('user_id', user.id)

  const stampCount = stamps?.length || 0

  return <AddCoffeeClient userId={user.id} userName={user.user_metadata?.name || 'there'} initialStampCount={stampCount} />
}
