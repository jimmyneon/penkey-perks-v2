import { useEffect, useState, useRef } from 'react'
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
  const previousBalanceRef = useRef<number>(0)
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
        previousBalanceRef.current = data.current_beans
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
            const newBalance = payload.new as BeanBalance
            setBeanBalance(newBalance)
            setJustUpdated(true)
            setTimeout(() => setJustUpdated(false), 1000)
            if (newBalance) {
              previousBalanceRef.current = newBalance.current_beans
            }
          }
        }
      )
      .on(
        'broadcast',
        { event: 'beans_awarded' },
        (payload) => {
          console.log('[Realtime] Beans awarded broadcast received:', payload)
          const { beansAwarded } = payload.payload
          if (beansAwarded > 0) {
            console.log('[Realtime] Setting beansAwarded to:', beansAwarded)
            setBeansAwarded(beansAwarded)
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

  return { beanBalance, isLoading, justUpdated, beansAwarded, previousBalance: previousBalanceRef.current }
}
