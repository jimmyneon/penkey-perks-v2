'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Gift, Clock, CheckCircle2, DollarSign, Bird } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useEffect } from 'react'
import { getDaysUntil } from '@/lib/utils'
import { BottomNavigation } from '@/components/bottom-navigation'

interface RewardsClientProps {
  userRewards: any[]
}

export function RewardsClient({ userRewards }: RewardsClientProps) {
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const router = useRouter()

  const activeRewards = userRewards.filter(r => r.status === 'active')
  const redeemedRewards = userRewards.filter(r => r.status === 'redeemed')

  useEffect(() => {
    if (selectedReward && selectedReward.status === 'active') {
      QRCode.toDataURL(selectedReward.qr_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2C3E50',
          light: '#FFFEF7',
        },
      }).then(setQrCodeUrl)
    }
  }, [selectedReward])

  const getExpiryText = (expiresAt: string | null) => {
    if (!expiresAt) return 'No expiry'
    const days = getDaysUntil(expiresAt)
    if (days < 0) return 'Expired'
    if (days === 0) return 'Expires today!'
    if (days === 1) return 'Expires tomorrow'
    return `Expires in ${days} days`
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#F3DCD4] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-5 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4D8CC] flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#7B1234]" />
            </div>
            <h1 className="text-xl font-semibold text-[#4B3028]">My Rewards</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Premium Mobile-First Layout */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-lg pb-20">
        {/* Active Rewards */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-[#4B3028]">Active Rewards ({activeRewards.length})</h2>

          {activeRewards.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm rounded-[28px]">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#F4D8CC] flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-[#7B1234]" />
                </div>
                <p className="text-[#4B3028]/70 mb-4">
                  No active rewards yet. Keep visiting to earn rewards!
                </p>
                <Link href="/dashboard">
                  <Button className="rounded-[28px] bg-[#7B1234] hover:bg-[#660E2B] text-white">Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRewards.map((userReward) => {
                const reward = userReward.rewards
                const expiryText = getExpiryText(userReward.expires_at)
                const isExpiringSoon = userReward.expires_at && getDaysUntil(userReward.expires_at) <= 3

                return (
                  <Card
                    key={userReward.id}
                    onClick={() => setSelectedReward(userReward)}
                    className={`bg-white border-0 shadow-sm rounded-[28px] overflow-hidden cursor-pointer hover:shadow-md transition-all ${
                      isExpiringSoon ? 'ring-2 ring-red-400' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-[#4B3028] text-lg font-semibold">
                            {reward.name}
                          </CardTitle>
                          <CardDescription className="text-[#4B3028]/70">{reward.description}</CardDescription>
                        </div>
                        <div className="text-2xl font-bold text-[#7B1234]">
                          {reward.value}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#4B3028]/70">
                          <Clock className="w-4 h-4" />
                          <span className={isExpiringSoon ? 'text-red-500 font-medium' : ''}>
                            {expiryText}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-xl border-[#F3DCD4] text-[#4B3028] hover:bg-[#F4D8CC]">
                          Show QR Code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Redeemed Rewards */}
        {redeemedRewards.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-[#4B3028]">Redeemed ({redeemedRewards.length})</h2>

            <div className="space-y-4">
              {redeemedRewards.map((userReward) => {
                const reward = userReward.rewards
                return (
                  <Card
                    key={userReward.id}
                    className="bg-white border-0 shadow-sm rounded-[28px] overflow-hidden opacity-60"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-[#4B3028] text-lg font-semibold">
                            {reward.name}
                          </CardTitle>
                          <CardDescription className="text-[#4B3028]/70">{reward.description}</CardDescription>
                        </div>
                        <div className="text-2xl font-bold text-[#4B3028]/60">
                          {reward.value}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-[#4B3028]/70">
                        <CheckCircle2 className="w-4 h-4 text-[#7B1234]" />
                        Redeemed on {new Date(userReward.redeemed_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* QR Code Modal */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-sm rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="text-center text-[#4B3028]">
              {selectedReward?.rewards?.name}
            </DialogTitle>
            <DialogDescription className="text-center text-[#4B3028]/70">
              Show this QR code to staff to redeem
            </DialogDescription>
          </DialogHeader>

          {selectedReward?.status === 'active' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-[28px] flex items-center justify-center border border-[#F3DCD4]">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[250px]" />
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-mono bg-[#F4D8CC] px-3 py-2 rounded-xl text-[#4B3028]">
                  {selectedReward.qr_code}
                </p>
                <p className="text-xs text-[#4B3028]/70">
                  {getExpiryText(selectedReward.expires_at)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  )
}
