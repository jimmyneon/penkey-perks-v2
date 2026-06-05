'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CloudRain, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => {
    checkRainyDayOffer()
  }, [userId])

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

      // Get the offer
      const { data: offer } = await supabase
        .from('promotional_offers')
        .select('*')
        .ilike('title', '%Rainy Day Rescue%')
        .eq('active', true)
        .single()

      if (!offer) return

      // Record that user viewed/claimed (for tracking)
      const { error: insertError } = await supabase
        .from('user_promotional_offers')
        .insert({
          user_id: userId,
          offer_id: offer.id,
          viewed_at: new Date().toISOString(),
          redeemed_at: new Date().toISOString()
        })

      if (insertError) {
        // Ignore duplicate errors (user already claimed today)
        console.log('[RainyDayCard] User already claimed today')
      }

      // Increment redemption count on the offer
      await supabase
        .from('promotional_offers')
        .update({ redemptions_count: (offer.redemptions_count || 0) + 1 })
        .eq('id', offer.id)

      // Generate global QR code (same for everyone)
      const qrData = `RAINY-DAY-${offer.id}`
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
        className="rounded-[18px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.985] transition-all duration-200"
        style={{ backgroundColor: '#F4EFE7', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #E8E2D8' }}
        onClick={handleCardClick}
      >
        <div className="w-28 h-28 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#FFF0E4' }}>
          <CloudRain className="w-[85%] h-[85%] scale-[150%]" style={{ color: '#E07A3A' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold leading-tight" style={{ color: '#24364B' }}>
            Rainy Day Rescue
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: '#5A6A7A' }}>20% off any hot drink today</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4AFA8" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(36,54,75,0.8)' }}
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-[18px] p-6 max-w-sm w-full"
              style={{ backgroundColor: '#F9F7F2' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[18px] font-bold" style={{ color: '#24364B' }}>
                  Rainy Day Voucher
                </h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-1 rounded-full transition-colors hover:bg-gray-200"
                >
                  <X className="w-5 h-5" style={{ color: '#5A6A7A' }} />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-[12px] mb-4">
                  {qrCode && (
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  )}
                </div>
                <p className="text-[14px] font-semibold mb-1" style={{ color: '#24364B' }}>
                  20% Off Any Hot Drink
                </p>
                <p className="text-[12px] text-center" style={{ color: '#5A6A7A' }}>
                  Show this QR code at the counter to redeem
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
