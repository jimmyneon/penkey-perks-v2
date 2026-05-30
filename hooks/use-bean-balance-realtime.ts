import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface BeanBalance {
  current_beans: number
  lifetime_beans: number
  visit_count: number
  last_visit_at: string | null
}

export function useBeanBalanceRealtime(userId: string | null) {
  const [beanBalance, setBeanBalance] = useState<BeanBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [justUpdated, setJustUpdated] = useState(false)
  const [beansAwarded, setBeansAwarded] = useState(0)
  const [previousBalance, setPreviousBalance] = useState<number>(0)
  const supabase = createClient()

  console.log('[Realtime] Hook called with userId:', userId)

  useEffect(() => {
    if (!userId) {
      console.log('[Realtime] No userId provided, skipping subscription')
      setIsLoading(false)
      return
    }

    let channel: RealtimeChannel | null = null

    // Initial fetch
    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from('bean_balances')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setBeanBalance(data)
        setPreviousBalance(data.current_beans)
      }
      setIsLoading(false)
    }

    fetchBalance()

    // Set up real-time subscription
    console.log('[Realtime] Setting up subscription for user:', userId)
    channel = supabase
      .channel(`bean_balances:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bean_balances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Bean balance change received:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const oldBalance = payload.old as BeanBalance | null
            const newBalance = payload.new as BeanBalance
            
            console.log('[Realtime] Old balance:', oldBalance)
            console.log('[Realtime] New balance:', newBalance)
            console.log('[Realtime] Previous balance state:', previousBalance)
            
            // Calculate beans awarded
            let beansDiff = 0
            if (oldBalance && newBalance) {
              beansDiff = newBalance.current_beans - oldBalance.current_beans
            } else if (newBalance) {
              // If oldBalance is null, use our tracked previousBalance
              beansDiff = newBalance.current_beans - previousBalance
            }
            
            console.log('[Realtime] Beans diff calculated:', beansDiff)
            if (beansDiff > 0) {
              console.log('[Realtime] Setting beansAwarded to:', beansDiff)
              setBeansAwarded(beansDiff)
            }
            
            // Update previous balance for next time
            if (newBalance) {
              setPreviousBalance(newBalance.current_beans)
            }
            
            console.log('[Realtime] Updating bean balance from', payload.old, 'to', payload.new)
            setBeanBalance(newBalance)
            setJustUpdated(true)
            setTimeout(() => setJustUpdated(false), 1000)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status)
        if (err) {
          console.error('[Realtime] Subscription error:', err)
        }
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, supabase])

  return { beanBalance, isLoading, justUpdated, beansAwarded }
}
