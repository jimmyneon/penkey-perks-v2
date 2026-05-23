'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ArrowLeft, Clock, Gift, Trophy, Tag, BadgePercent, CheckCircle2, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getDaysUntil } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface RewardQRClientProps {
  userReward: any
  userId: string
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'free_item':
      return <Gift className="w-12 h-12 text-penkey-orange" />
    case 'fixed_discount':
      return <Tag className="w-12 h-12 text-green-600" />
    case 'percentage_discount':
      return <BadgePercent className="w-12 h-12 text-blue-600" />
    case 'badge':
      return <Trophy className="w-12 h-12 text-yellow-600" />
    default:
      return <Gift className="w-12 h-12 text-penkey-orange" />
  }
}

const getExpiryText = (expiresAt: string | null) => {
  if (!expiresAt) return 'No expiry'
  const days = getDaysUntil(expiresAt)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today!'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

export function RewardQRClient({ userReward, userId }: RewardQRClientProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [rewardStatus, setRewardStatus] = useState(userReward.status)
  const router = useRouter()
  const reward = userReward.rewards

  useEffect(() => {
    if (userReward.status === 'active' && userReward.qr_code) {
      QRCode.toDataURL(userReward.qr_code, {
        width: 400,
        margin: 2,
        color: {
          dark: '#2C3E50',
          light: '#FFFEF7',
        },
      }).then(setQrCodeUrl)
    }
  }, [userReward])

  // Realtime subscription to detect when reward is redeemed
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`reward-${userReward.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_rewards',
          filter: `id=eq.${userReward.id}`,
        },
        (payload) => {
          console.log('Reward updated:', payload)
          if (payload.new.status === 'redeemed' && rewardStatus === 'active') {
            // Show success modal!
            setRewardStatus('redeemed')
            setShowSuccessModal(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userReward.id, rewardStatus])

  const expiryText = getExpiryText(userReward.expires_at)
  const isExpiringSoon = userReward.expires_at && getDaysUntil(userReward.expires_at) <= 3
  const isExpired = userReward.expires_at && getDaysUntil(userReward.expires_at) < 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-penkey-cream to-white">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-penkey-orange" />
              <h1 className="text-xl font-bold text-penkey-dark">Your Reward</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Reward Info Card */}
          <Card className={`border-2 shadow-lg ${
            isExpiringSoon ? 'border-red-400 ring-2 ring-red-100' : 'border-penkey-orange/30'
          }`}>
            <CardHeader className={`text-center ${isExpiringSoon ? 'bg-red-50/50' : ''}`}>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-penkey-cream/50 rounded-2xl border border-penkey-border">
                  {getRewardIcon(reward?.reward_type || 'free_item')}
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl">{reward?.name || 'Reward'}</CardTitle>
              <CardDescription className="text-base">{reward?.description}</CardDescription>
              {reward?.value && (
                <div className="mt-4 inline-flex items-center justify-center px-6 py-3 bg-penkey-orange/10 rounded-xl border border-penkey-orange/20">
                  <span className="text-3xl font-bold text-penkey-orange">{reward.value}</span>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Status Alert */}
          {isExpired && (
            <Card className="border-2 border-red-400 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600 font-semibold">This reward has expired</p>
              </CardContent>
            </Card>
          )}

          {isExpiringSoon && !isExpired && (
            <Card className="border-2 border-orange-400 bg-orange-50">
              <CardContent className="p-6 text-center">
                <p className="text-orange-600 font-semibold">⚠️ This reward is expiring soon!</p>
              </CardContent>
            </Card>
          )}

          {/* QR Code Card */}
          {userReward.status === 'active' && !isExpired && (
            <Card className="border-penkey-border shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Show this QR code to staff</CardTitle>
                <CardDescription>Staff will scan this to redeem your reward</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="bg-white p-6 rounded-2xl border-2 border-penkey-border flex items-center justify-center">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-full max-w-[350px] animate-bubble-pop" 
                    />
                  ) : (
                    <div className="w-[350px] h-[350px] bg-gray-100 animate-pulse rounded-lg" />
                  )}
                </div>

                {/* QR Code Text */}
                <div className="text-center space-y-2">
                  <p className="text-sm font-mono bg-gray-100 px-4 py-3 rounded-lg border border-gray-200 break-all">
                    {userReward.qr_code}
                  </p>
                </div>

                {/* Expiry Info */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className={isExpiringSoon ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {expiryText}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Redeemed Status */}
          {(userReward.status === 'redeemed' || rewardStatus === 'redeemed') && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                <h3 className="text-xl font-bold text-green-900">Reward Redeemed!</h3>
                <p className="text-sm text-green-700">
                  This reward was redeemed on {new Date(userReward.redeemed_at || new Date()).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/rewards" className="flex-1">
              <Button variant="outline" className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                All Rewards
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Success Modal - Shows when staff redeems */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md border-4 border-penkey-orange bg-gradient-to-b from-white to-penkey-cream/30">
          <div className="text-center space-y-6 py-4">
            {/* Celebration Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-penkey-orange to-amber-500 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 text-4xl animate-pulse">🎉</div>
              <div className="absolute -bottom-2 -left-2 text-4xl animate-pulse delay-75">✨</div>
            </div>

            {/* Success Message */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-penkey-dark">
                Woohoo! 🎊
              </h2>
              <p className="text-xl font-semibold text-penkey-orange">
                Your Reward Has Been Redeemed!
              </p>
            </div>

            {/* Reward Info */}
            <div className="bg-white rounded-2xl p-6 border-2 border-penkey-orange/30 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-penkey-orange/10 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-8 h-8 text-penkey-orange" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-penkey-dark">{reward?.name}</p>
                  {reward?.description && (
                    <p className="text-sm text-penkey-gray">{reward.description}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-900 font-medium mb-2">
                  ✅ Staff has redeemed your reward!
                </p>
                <p className="text-xs text-green-700">
                  Enjoy your treat! 🎉
                </p>
              </div>
            </div>

            {/* Penkey Messaging */}
            <div className="bg-gradient-to-r from-penkey-orange/10 to-amber-50 rounded-2xl p-5 border-2 border-penkey-orange/20">
              <p className="text-penkey-dark font-medium mb-3">
                💕 While you're here...
              </p>
              <p className="text-sm text-penkey-gray leading-relaxed">
                Don't forget to try our <span className="font-bold text-amber-800">chocolate brownies</span> or our <span className="font-bold text-amber-800">famous crumble slices</span>! 
              </p>
              <p className="text-sm text-penkey-gray mt-2">
                They pair perfectly with your favourite coffee! ☕✨
              </p>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/rewards')
              }}
              className="w-full bg-penkey-orange hover:bg-penkey-dark text-white font-bold py-6 text-lg rounded-xl shadow-lg"
            >
              Awesome! 🎉
            </Button>

            {/* Footer Message */}
            <p className="text-xs text-penkey-gray">
              Keep earning beans for more amazing rewards! 🌟
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
