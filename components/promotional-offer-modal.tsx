'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Gift, Clock, CheckCircle, Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  has_redeemed: boolean
  redemptions_remaining?: number
}

interface PromotionalOfferModalProps {
  offer: PromotionalOffer
  isOpen: boolean
  onClose: () => void
  onRedeemed?: () => void
}

export function PromotionalOfferModal({ offer, isOpen, onClose, onRedeemed }: PromotionalOfferModalProps) {
  const [redeeming, setRedeeming] = useState(false)
  const [redeemed, setRedeemed] = useState(offer.has_redeemed)
  const [voucherCode, setVoucherCode] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleRedeem = async () => {
    setRedeeming(true)

    try {
      // Redeem the offer (mark-viewed is already called by provider)
      const response = await fetch('/api/promotional-offers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem offer')
      }

      setRedeemed(true)
      setVoucherCode(data.voucher?.code || null)

      toast({
        title: '🎉 Offer Redeemed!',
        description: 'Your voucher has been added to your rewards!',
      })

      // Refresh to update rewards
      router.refresh()
      
      // Wait 3 seconds to show success state, then close
      setTimeout(() => {
        onRedeemed?.()
      }, 3000)

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to redeem offer',
        variant: 'destructive'
      })
    } finally {
      setRedeeming(false)
    }
  }

  const handleViewRewards = () => {
    onClose()
    router.push('/rewards')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-3xl sm:text-5xl">{offer.icon}</div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold text-amber-950 mb-1">
                  {offer.title}
                </DialogTitle>
                <Badge className="bg-amber-600 text-white text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Special Offer
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Offer Image */}
          {offer.image_url && (
            <div className="rounded-lg overflow-hidden border-2 border-amber-200">
              <img 
                src={offer.image_url} 
                alt={offer.title}
                className="w-full h-32 sm:h-48 object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <p className="text-amber-900 leading-relaxed">
              {offer.description}
            </p>
          </div>

          {/* Reward Details */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-4 border-2 border-amber-300">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-amber-700" />
              <h3 className="font-semibold text-amber-950">Your Reward</h3>
            </div>
            <p className="text-lg font-bold text-amber-900">
              {offer.reward_value}
            </p>
            {offer.reward_description && (
              <p className="text-sm text-amber-800 mt-1">
                {offer.reward_description}
              </p>
            )}
          </div>

          {/* Terms */}
          {offer.terms && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Terms:</span> {offer.terms}
              </p>
            </div>
          )}

          {/* Redemption Status */}
          {redeemed ? (
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Redeemed!</h3>
              </div>
              {voucherCode && (
                <div className="bg-white rounded p-2 border border-green-200 mb-2">
                  <p className="text-xs text-green-700 mb-1">Voucher Code:</p>
                  <p className="text-lg font-mono font-bold text-green-900">
                    {voucherCode}
                  </p>
                </div>
              )}
              <p className="text-sm text-green-800">
                Your voucher has been added to your rewards. Show it at the counter to redeem!
              </p>
            </div>
          ) : (
            <>
              {/* Redemption Limit */}
              {offer.redemptions_remaining !== null && offer.redemptions_remaining !== undefined && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span>
                    {offer.redemptions_remaining === 0 
                      ? 'Already redeemed' 
                      : `${offer.redemptions_remaining} redemption${offer.redemptions_remaining > 1 ? 's' : ''} remaining`
                    }
                  </span>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {redeemed ? (
              <>
                <Button
                  onClick={handleViewRewards}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  View My Rewards
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="border-amber-300"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleRedeem}
                  disabled={redeeming || offer.redemptions_remaining === 0}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                  size="lg"
                >
                  {redeeming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      {offer.button_text}
                    </>
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  disabled={redeeming}
                  className="border-amber-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
