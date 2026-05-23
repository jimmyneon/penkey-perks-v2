'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Gift, Sparkles, Lock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Reward {
  id: string
  name: string
  description: string
  type: string
  value: string
  points_cost: number
  stock: number | null
  active: boolean
  icon?: string
}

interface RewardsCatalogClientProps {
  rewards: Reward[]
  currentPoints: number
  userId: string
}

export function RewardsCatalogClient({ rewards, currentPoints, userId }: RewardsCatalogClientProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const canAfford = (cost: number) => currentPoints >= cost

  const handleRedeem = async () => {
    if (!selectedReward) return

    setIsRedeeming(true)
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward')
      }

      toast({
        title: 'Reward redeemed',
        description: `${selectedReward.name} is now in your rewards`,
      })

      setSelectedReward(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Oops!',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'free_item':
      case 'food':
        return '🍰'
      case 'drink':
        return '☕'
      case 'discount':
        return '💰'
      default:
        return '🎁'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-penkey-cream to-white">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-penkey-orange" />
                <h1 className="text-xl font-bold text-penkey-dark">Rewards Catalog</h1>
              </div>
            </div>
            
            {/* Points Display */}
            <div className="bg-gradient-to-r from-penkey-orange to-penkey-orange-light text-white px-4 py-2 rounded-full shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold">{currentPoints}</span>
                <span className="text-sm">points</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header Message */}
        <Card className="mb-6 border-2 border-penkey-orange/30 bg-gradient-to-r from-penkey-orange/10 to-penkey-cream">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Gift className="w-8 h-8 text-penkey-orange flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-penkey-dark mb-2">
                  Choose your reward
                </h2>
                <p className="text-penkey-gray">
                  Use your points to get free drinks and treats
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-12 h-12 text-penkey-orange" />
              </div>
              <p className="text-penkey-gray mb-4">
                No rewards available
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rewards.map((reward) => {
              const affordable = canAfford(reward.points_cost)
              const outOfStock = reward.stock !== null && reward.stock <= 0

              return (
                <Card
                  key={reward.id}
                  className={`transition-all ${
                    affordable && !outOfStock
                      ? 'hover:shadow-lg hover:border-penkey-orange cursor-pointer hover:scale-[1.02]'
                      : 'opacity-60'
                  } ${!affordable ? 'border-gray-300' : ''}`}
                  onClick={() => affordable && !outOfStock && setSelectedReward(reward)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="text-3xl">{getRewardIcon(reward.type)}</span>
                          <span>{reward.name}</span>
                          {!affordable && <Lock className="w-4 h-4 text-gray-400" />}
                          {outOfStock && <span className="text-sm text-red-500">(Out of Stock)</span>}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                          {reward.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-5 h-5 ${affordable ? 'text-penkey-orange' : 'text-gray-400'}`} />
                        <span className={`text-2xl font-bold ${affordable ? 'text-penkey-orange' : 'text-gray-400'}`}>
                          {reward.points_cost}
                        </span>
                        <span className="text-sm text-penkey-gray">points</span>
                      </div>
                      
                      {affordable && !outOfStock ? (
                        <Button size="sm" className="bg-penkey-orange hover:bg-penkey-orange-dark">
                          Redeem
                        </Button>
                      ) : outOfStock ? (
                        <Button size="sm" variant="outline" disabled>
                          Out of Stock
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Need {reward.points_cost - currentPoints} more points
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* My Rewards Link */}
        <Card className="mt-6 border-penkey-orange/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-penkey-dark">View your rewards</p>
                <p className="text-sm text-penkey-gray">Check your active rewards</p>
              </div>
              <Link href="/rewards">
                <Button variant="outline">
                  <Gift className="w-4 h-4 mr-2" />
                  My Rewards
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              <span className="text-4xl block mb-2">{selectedReward && getRewardIcon(selectedReward.type)}</span>
              Redeem {selectedReward?.name}?
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Cost: <span className="font-bold text-penkey-orange">{selectedReward?.points_cost} points</span>
              <br />
              You'll have <span className="font-bold">{currentPoints - (selectedReward?.points_cost || 0)} points</span> left
            </DialogDescription>
          </DialogHeader>

          <div className="bg-penkey-cream p-4 rounded-lg">
            <p className="text-sm text-center text-penkey-gray">
              Your reward will appear in "My Rewards" with a QR code to show staff
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedReward(null)}
              className="flex-1"
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              className="flex-1 bg-penkey-orange hover:bg-penkey-orange-dark"
              disabled={isRedeeming}
            >
              {isRedeeming ? (
                'Redeeming...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Redeem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
