'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CloudRain, Umbrella, Gift, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface RainyDayVoucherCardProps {
  userId: string
  onVoucherClaimed?: () => void
}

export function RainyDayVoucherCard({ userId, onVoucherClaimed }: RainyDayVoucherCardProps) {
  const [offerActive, setOfferActive] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [weather, setWeather] = useState<any>(null)

  useEffect(() => {
    checkRainyDayOffer()
  }, [userId])

  const checkRainyDayOffer = async () => {
    try {
      const supabase = createClient()

      console.log('[RainyDayCard] Checking for rainy day offer, userId:', userId)

      // First, log all active promotional offers for debugging
      const { data: allOffers, error: allOffersError } = await supabase
        .from('promotional_offers')
        .select('id, title, active')
        .eq('active', true)
      
      console.log('[RainyDayCard] All active offers:', { allOffers, allOffersError })

      // Check if rainy day offer is active (using ilike for more flexible matching)
      const { data: offer, error: offerError } = await supabase
        .from('promotional_offers')
        .select('*')
        .ilike('title', '%Rainy Day Rescue%')
        .eq('active', true)
        .maybeSingle()

      console.log('[RainyDayCard] Rainy day offer query result:', { offer, offerError })

      if (offer) {
        setOfferActive(true)

        // Check if user already claimed today (using created_at instead of redeemed_at)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: userOffer, error: userOfferError } = await supabase
          .from('user_promotional_offers')
          .select('*')
          .eq('user_id', userId)
          .eq('offer_id', offer.id)
          .gte('created_at', last24Hours)
          .maybeSingle()

        console.log('[RainyDayCard] User offer result:', { userOffer, userOfferError })
        setHasClaimed(!!userOffer)
      } else {
        console.log('[RainyDayCard] No rainy day offer found or not active')
      }

      // Get current weather
      const weatherRes = await fetch('/api/weather')
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json()
        setWeather(weatherData)
      }
    } catch (error) {
      console.error('[RainyDayCard] Error checking rainy day offer:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimVoucher = async () => {
    if (claiming) return

    setClaiming(true)
    try {
      const supabase = createClient()

      console.log('[RainyDayCard] Claiming voucher for userId:', userId)

      const { data, error } = await supabase
        .rpc('create_rainy_day_voucher', { p_user_id: userId })

      console.log('[RainyDayCard] RPC response:', { data, error })

      if (error) {
        console.error('[RainyDayCard] Error claiming voucher:', error)
        return
      }

      if (data && data[0]?.success) {
        console.log('[RainyDayCard] Voucher claimed successfully')
        setHasClaimed(true)
        onVoucherClaimed?.()
      } else {
        console.log('[RainyDayCard] Voucher claim failed:', data)
      }
    } catch (error) {
      console.error('[RainyDayCard] Error claiming voucher:', error)
    } finally {
      setClaiming(false)
    }
  }

  if (loading || !offerActive) {
    return null
  }

  if (hasClaimed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900">Voucher Claimed!</p>
                <p className="text-sm text-green-700">Your 20% off voucher is in My Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50 overflow-hidden relative">
        {/* Rain animation background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-1 h-8 bg-blue-400 animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-0 left-2/4 w-1 h-8 bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-0 left-3/4 w-1 h-8 bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
            <CloudRain className="w-5 h-5" />
            Rainy Day Rescue
          </CardTitle>
          <CardDescription className="text-blue-700">
            {weather?.description || 'It\'s raining!'} • {weather?.temperature}°C
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-200 rounded-full p-2 mt-1">
              <Umbrella className="w-4 h-4 text-blue-700" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900">20% Off Any Hot Drink</p>
              <p className="text-sm text-blue-700">
                Warm up with coffee, tea, or hot chocolate at 20% off today!
              </p>
            </div>
          </div>

          <Button
            onClick={claimVoucher}
            disabled={claiming}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {claiming ? (
              'Claiming...'
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Claim Your Voucher
              </>
            )}
          </Button>

          <p className="text-xs text-blue-600 text-center">
            Valid for 24 hours • One per rainy day
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
