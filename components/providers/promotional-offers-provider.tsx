'use client'

import { useEffect, useState } from 'react'
import { usePromotionalOffers } from '@/hooks/use-promotional-offers'
import { PromotionalOfferModal } from '@/components/promotional-offer-modal'

export function PromotionalOffersProvider({ children }: { children: React.ReactNode }) {
  const { offers, loading, getTopPriorityModalOffer, refetch } = usePromotionalOffers(true) // Enable realtime
  const [currentOffer, setCurrentOffer] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedOffers, setDismissedOffers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Wait for offers to load before checking
    if (loading) {
      console.log('[Promotional Offers Provider] Still loading...')
      return
    }

    console.log('[Promotional Offers Provider] Checking for offers...', { 
      offersCount: offers.length,
      offers: offers.map(o => ({ id: o.id, title: o.title, has_redeemed: o.has_redeemed })),
      loading,
      dismissedCount: dismissedOffers.size,
      dismissedIds: Array.from(dismissedOffers),
      currentOfferId: currentOffer?.id
    })

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const offer = getTopPriorityModalOffer()
        console.log('[Promotional Offers Provider] Top priority offer:', offer)
        
        // Only show if we have an offer, it's not already shown, and it hasn't been dismissed
        if (offer && !currentOffer && !dismissedOffers.has(offer.id)) {
          console.log('[Promotional Offers Provider] ✅ Showing offer:', offer.title)
          setCurrentOffer(offer)
          setIsOpen(true)
          
          // Mark as viewed immediately when shown
          fetch('/api/promotional-offers/mark-viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offerId: offer.id })
          }).catch(err => console.error('Failed to mark offer as viewed:', err))
        } else {
          console.log('[Promotional Offers Provider] ❌ Not showing offer:', {
            hasOffer: !!offer,
            hasCurrentOffer: !!currentOffer,
            isDismissed: offer ? dismissedOffers.has(offer.id) : false
          })
        }
      } catch (error) {
        console.error('[Promotional Offers Provider] Error checking offers:', error)
      }
    }, 500) // 500ms delay to prevent flash

    return () => clearTimeout(timer)
  }, [loading, offers, currentOffer, dismissedOffers, getTopPriorityModalOffer])

  const handleClose = () => {
    // Mark this offer as dismissed so it won't show again this session
    if (currentOffer) {
      setDismissedOffers(prev => new Set(prev).add(currentOffer.id))
      console.log('[Promotional Offers Provider] Offer dismissed:', currentOffer.id)
    }
    
    setIsOpen(false)
    
    // Clear current offer after animation
    setTimeout(() => {
      setCurrentOffer(null)
    }, 300)
  }

  const handleRedeemed = () => {
    console.log('[Promotional Offers Provider] Offer redeemed')
    
    // Mark as dismissed (redeemed = dismissed)
    if (currentOffer) {
      setDismissedOffers(prev => new Set(prev).add(currentOffer.id))
    }
    
    // Close the modal
    setIsOpen(false)
    
    // Clear and refetch after animation
    setTimeout(() => {
      setCurrentOffer(null)
      refetch()
    }, 300)
  }

  return (
    <>
      {children}
      {currentOffer && (
        <PromotionalOfferModal
          offer={currentOffer}
          isOpen={isOpen}
          onClose={handleClose}
          onRedeemed={handleRedeemed}
        />
      )}
    </>
  )
}
