import { createClient } from '@/lib/supabase/server'
import { LogsClient } from './logs-client'

export default async function AdminLogsPage() {
  const supabase = await createClient()

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      users!transactions_user_id_fkey (name, email),
      staff:users!transactions_staff_id_fkey (name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return <LogsClient transactions={transactions || []} />
}
