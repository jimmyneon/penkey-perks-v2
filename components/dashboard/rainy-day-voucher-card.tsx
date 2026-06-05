'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import QRCodeLib from 'qrcode'

interface RainyDayVoucherCardProps {
  userId: string
  onVoucherClaimed?: () => void
}

export function RainyDayVoucherCard({ userId, onVoucherClaimed }: RainyDayVoucherCardProps) {
  const [offerActive, setOfferActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [timeRemaining, setTimeRemaining] = useState('')
  const [offer, setOffer] = useState<any>(null)

  useEffect(() => {
    checkRainyDayOffer()
    // Update timer every minute
    const timer = setInterval(updateTimer, 60000)
    return () => clearInterval(timer)
  }, [userId])

  const updateTimer = () => {
    if (!offer) return
    
    const now = new Date()
    const endTime = offer.expires_at ? new Date(offer.expires_at) : (() => {
      const eod = new Date()
      eod.setHours(23, 59, 59, 999)
      return eod
    })()
    
    const diff = endTime.getTime() - now.getTime()
    if (diff <= 0) {
      setTimeRemaining('Expired')
      return
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    setTimeRemaining(`${hours}h ${minutes}m`)
  }

  useEffect(() => {
    updateTimer()
  }, [offer])

  const checkRainyDayOffer = async () => {
    try {
      const supabase = createClient()

      // Check if rainy day offer is active
      const { data: offer } = await supabase
        .from('promotional_offers')
        .select('*')
        .ilike('title', '%Rainy Day Rescue%')
        .eq('active', true)
        .maybeSingle()

      if (offer) {
        setOffer(offer)
        setOfferActive(true)
      }
    } catch (error) {
      console.error('[RainyDayCard] Error checking rainy day offer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = async () => {
    try {
      const supabase = createClient()

      if (!offer) return

      // Check if user already has a claim for this offer
      const { data: existingClaim } = await supabase
        .from('user_promotional_offers')
        .select('*')
        .eq('user_id', userId)
        .eq('offer_id', offer.id)
        .maybeSingle()

      let claimId: string

      if (existingClaim) {
        claimId = existingClaim.id
      } else {
        // Create new claim record (viewed but not redeemed yet)
        const { data: newClaim, error: insertError } = await supabase
          .from('user_promotional_offers')
          .insert({
            user_id: userId,
            offer_id: offer.id,
            viewed_at: new Date().toISOString(),
            redeemed_at: null
          })
          .select()
          .single()

        if (insertError) {
          console.error('[RainyDayCard] Error creating claim:', insertError)
          return
        }

        claimId = newClaim.id
      }

      // Generate unique QR code for this specific claim
      const qrData = `RAINY-DAY-${claimId}`
      const url = await QRCodeLib.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#24364B',
          light: '#FFFFFF'
        }
      })
      setQrCode(url)
      setShowQR(true)

      onVoucherClaimed?.()
    } catch (error) {
      console.error('[RainyDayCard] Error:', error)
    }
  }

  if (loading || !offerActive) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[190px] p-5 flex items-center gap-4 cursor-pointer active:scale-[0.985] transition-all duration-200"
        style={{ backgroundColor: '#FFF3E8', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #EAD8C8', borderRadius: '22px' }}
        onClick={handleCardClick}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold leading-tight" style={{ color: '#24364B' }}>
            Rainy Day Rescue
          </p>
          <p className="text-[24px] font-extrabold leading-tight mt-1" style={{ color: '#E07A3A' }}>
            20% OFF
          </p>
          <p className="text-[14px] font-medium mt-0.5" style={{ color: '#5A6A7A' }}>
            ANY HOT DRINK
          </p>
          <p className="text-[12px] mt-1" style={{ color: '#8A96A0' }}>
            Ends in {timeRemaining}
          </p>
          <button
            className="flex items-center gap-2 mt-3 px-5 py-3 rounded-full font-semibold text-white transition-all"
            style={{ backgroundColor: '#E8751A' }}
          >
            Claim Reward
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <div className="w-[170px] h-[170px] flex items-center justify-center flex-shrink-0">
          <img
            src="/raining.png"
            alt="Rainy Day"
            className="w-full h-full object-contain"
          />
        </div>
      </motion.div>

      {/* QR Code Bottom Sheet */}
      <BottomSheet open={showQR} onOpenChange={setShowQR} showCloseButton={false}>
        <div className="flex flex-col items-center p-5">
          <div className="text-center mb-6">
            <p className="text-[24px] font-bold leading-tight" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
              Rainy Day Voucher
            </p>
            <p className="text-[14px] mt-1" style={{ color: '#5A6A7A' }}>
              20% Off Any Hot Drink
            </p>
          </div>

          <div className="bg-white p-4 rounded-[12px] mb-4">
            {qrCode && (
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            )}
          </div>

          <p className="text-[12px] text-center" style={{ color: '#5A6A7A' }}>
            Show this QR code at the counter to redeem
          </p>
        </div>
      </BottomSheet>
    </>
  )
}
