'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface RealtimeProviderProps {
  userId: string
  children: React.ReactNode
}

export function RealtimeProvider({ userId, children }: RealtimeProviderProps) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    console.log('[Realtime] Setting up subscriptions for user:', userId)

    // Subscribe to user's points changes
    const pointsChannel = supabase
      .channel(`user-points-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Points transaction:', payload)
          
          // Invalidate points cache
          queryClient.invalidateQueries({ queryKey: ['user-points', userId] })
          queryClient.invalidateQueries({ queryKey: ['lifetime-points', userId] })
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to user rewards changes
    const rewardsChannel = supabase
      .channel(`user-rewards-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rewards',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] User reward:', payload)
          
          // Invalidate rewards cache
          queryClient.invalidateQueries({ queryKey: ['user-rewards', userId] })
          
          // Show notification for new rewards
          if (payload.eventType === 'INSERT') {
            toast({
              title: '🎉 New Reward!',
              description: 'You have a new reward available!',
              duration: 5000,
            })
          }
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to pending rewards changes
    const pendingRewardsChannel = supabase
      .channel(`pending-rewards-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_rewards',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Pending reward:', payload)
          
          // Invalidate pending rewards cache
          queryClient.invalidateQueries({ queryKey: ['pending-rewards', userId] })
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to coffee stamps changes
    const stampsChannel = supabase
      .channel(`coffee-stamps-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coffee_stamps',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Coffee stamp:', payload)
          
          // Invalidate stamps cache
          queryClient.invalidateQueries({ queryKey: ['coffee-stamps', userId] })
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to game plays
    const gamePlaysChannel = supabase
      .channel(`game-plays-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_plays',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Game play:', payload)
          
          // Invalidate game-related caches
          queryClient.invalidateQueries({ queryKey: ['game-plays', userId] })
          queryClient.invalidateQueries({ queryKey: ['todays-beans', userId] })
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to promotional offers (user-specific interactions)
    const promoOffersChannel = supabase
      .channel(`promo-offers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_promotional_offers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Promotional offer interaction:', payload)
          
          // Invalidate promotional offers cache
          queryClient.invalidateQueries({ queryKey: ['promotional-offers', userId] })
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to voucher redemptions (user_vouchers table)
    const vouchersChannel = supabase
      .channel(`user-vouchers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_vouchers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Voucher updated:', payload)
          
          // Check if voucher was redeemed
          if (payload.new.status === 'redeemed' && payload.old.status === 'active') {
            console.log('[Realtime] Voucher redeemed! Triggering animation...')
            
            // Dispatch custom event for voucher redemption
            const event = new CustomEvent('voucher-redeemed', {
              detail: {
                voucherId: payload.new.id,
                voucherName: payload.new.name || 'Voucher',
              }
            })
            window.dispatchEvent(event)
          }
          
          // Invalidate vouchers cache
          queryClient.invalidateQueries({ queryKey: ['user-vouchers', userId] })
          
          // Refresh the page data
          router.refresh()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[Realtime] Cleaning up subscriptions')
      supabase.removeChannel(pointsChannel)
      supabase.removeChannel(rewardsChannel)
      supabase.removeChannel(pendingRewardsChannel)
      supabase.removeChannel(stampsChannel)
      supabase.removeChannel(gamePlaysChannel)
      supabase.removeChannel(promoOffersChannel)
      supabase.removeChannel(vouchersChannel)
    }
  }, [userId, router, toast, queryClient, supabase])

  return <>{children}</>
}
