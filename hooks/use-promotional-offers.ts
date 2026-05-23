'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PromotionalOffer {
  id: string
  title: string
  description: string
  terms?: string
  reward_type: string
  reward_value: string
  reward_description?: string
  icon: string
  image_url?: string
  button_text: string
  priority: number
  show_as_modal: boolean
  show_as_notification: boolean
  has_redeemed: boolean
  redemptions_remaining?: number
}

export function usePromotionalOffers(enableRealtime = false) {
  const [offers, setOffers] = useState<PromotionalOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchOffers = useCallback(async () => {
    try {
      console.log('[Promotional Offers] Fetching offers...')
      setLoading(true)
      const response = await fetch('/api/promotional-offers/get')
      
      if (!response.ok) {
        console.error('[Promotional Offers] Fetch failed:', response.status, response.statusText)
        throw new Error('Failed to fetch promotional offers')
      }

      const data = await response.json()
      console.log('[Promotional Offers] Fetched offers:', data.offers?.length || 0, data.offers)
      setOffers(data.offers || [])
      setError(null)
    } catch (err: any) {
      console.error('[Promotional Offers] Fetch error:', err)
      setError(err.message)
      setOffers([])
    } finally {
      setLoading(false)
      console.log('[Promotional Offers] Loading complete')
    }
  }, [])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  // Realtime subscription for promotional offers
  useEffect(() => {
    if (!enableRealtime) return

    console.log('[Promotional Offers] Setting up realtime subscription')

    const channel = supabase
      .channel('promotional-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotional_offers',
        },
        (payload) => {
          console.log('[Promotional Offers] Realtime update:', payload)
          // Refetch offers when any offer changes
          fetchOffers()
        }
      )
      .subscribe()

    return () => {
      console.log('[Promotional Offers] Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [enableRealtime, fetchOffers, supabase])

  const getModalOffers = () => {
    return offers.filter(offer => offer.show_as_modal && !offer.has_redeemed)
  }

  const getNotificationOffers = () => {
    return offers.filter(offer => offer.show_as_notification)
  }

  const getTopPriorityModalOffer = () => {
    const modalOffers = getModalOffers()
    if (modalOffers.length === 0) return null
    
    return modalOffers.reduce((prev, current) => 
      (prev.priority < current.priority) ? prev : current
    )
  }

  return {
    offers,
    loading,
    error,
    refetch: fetchOffers,
    getModalOffers,
    getNotificationOffers,
    getTopPriorityModalOffer
  }
}
