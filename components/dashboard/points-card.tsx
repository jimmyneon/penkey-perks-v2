'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Gift, TrendingUp, MapPin, Clock, CheckCircle, HourglassIcon, Info } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BeanIcon } from '@/components/ui/bean-icon'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface PointsCardProps {
  currentPoints: number
  nextReward?: {
    name: string
    pointsRequired: number
  }
}

// Helper function for bean formatting
function formatBeans(amount: number): string {
  return `${amount.toLocaleString()} ${amount === 1 ? 'bean' : 'beans'}`
}

export function PointsCard({ currentPoints, nextReward }: PointsCardProps) {
  const [pendingPoints, setPendingPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAvailableModal, setShowAvailableModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingPoints()
  }, [])

  const fetchPendingPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get pending beans from pending_rewards
      const { data: pendingRewards } = await supabase
        .from('pending_rewards')
        .select('amount')
        .eq('user_id', user.id)
        .eq('reward_type', 'points')
        .eq('status', 'pending')

      const total = pendingRewards?.reduce((sum, reward) => sum + (reward.amount || 0), 0) || 0
      setPendingPoints(total)
    } catch (error) {
      console.error('Error fetching pending beans:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalBeans = currentPoints + pendingPoints
  const beansNeeded = nextReward ? nextReward.pointsRequired - totalBeans : 0
  const progress = nextReward ? (totalBeans / nextReward.pointsRequired) * 100 : 0

  return (
    <>
      <Card className="border-penkey-brown/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-penkey-dark">
            <BeanIcon size="lg" className="text-penkey-brown" />
            Your Beans
          </CardTitle>
          <CardDescription className="text-sm text-penkey-gray">
            {pendingPoints > 0 ? (
              `${formatBeans(pendingPoints)} pending - check in to claim`
            ) : (
              'Earn beans by playing games and checking in'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Two Counters: Available & Pending */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Available Beans - Clickable */}
            <button
              onClick={() => setShowAvailableModal(true)}
              className="text-center p-3 sm:p-4 bg-white rounded-lg border border-penkey-brown/20 hover:border-penkey-brown hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1">
                <BeanIcon size="sm" className="text-penkey-brown sm:hidden group-hover:scale-110 transition-transform" />
                <BeanIcon size="lg" className="text-penkey-brown hidden sm:block group-hover:scale-110 transition-transform" />
                <p className="text-xl sm:text-3xl font-bold text-penkey-dark">{currentPoints.toLocaleString()}</p>
              </div>
              <p className="text-[10px] sm:text-xs text-penkey-gray font-medium">
                Available
              </p>
              <Info className="w-3 h-3 text-penkey-gray/50 mx-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Pending Beans - Clickable */}
            <button
              onClick={() => setShowPendingModal(true)}
              className="text-center p-3 sm:p-4 bg-penkey-orange/5 rounded-lg border border-penkey-orange/20 hover:border-penkey-orange hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1">
                <BeanIcon size="sm" className="text-penkey-orange sm:hidden group-hover:scale-110 transition-transform" />
                <BeanIcon size="lg" className="text-penkey-orange hidden sm:block group-hover:scale-110 transition-transform" />
                <p className="text-xl sm:text-3xl font-bold text-penkey-orange">{pendingPoints.toLocaleString()}</p>
              </div>
              <p className="text-[10px] sm:text-xs text-penkey-gray font-medium">
                Pending
              </p>
              <Info className="w-3 h-3 text-penkey-gray/50 mx-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

        {/* Simple pending message - no button */}
        {pendingPoints > 0 && (
          <div className="text-center p-3 bg-penkey-orange/5 rounded-lg border border-penkey-orange/20">
            <p className="text-sm text-penkey-gray">
              Check in at Penkey to claim your {formatBeans(pendingPoints)}
            </p>
          </div>
        )}

        {/* Next Reward Progress */}
        {nextReward && beansNeeded > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-penkey-gray">Next reward:</span>
              <span className="font-medium text-penkey-dark">{nextReward.name}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B4513] to-[#D2691E] transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-600 flex items-center justify-center gap-1">
              <BeanIcon size="sm" className="text-[#8B4513]" />
              {formatBeans(beansNeeded)} more needed
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/rewards">
            <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Redeem
            </Button>
          </Link>
          <Link href="/points/history">
            <Button variant="outline" className="w-full border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/10 text-xs sm:text-sm" size="sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>

    {/* Available Beans Modal */}
    <Dialog open={showAvailableModal} onOpenChange={setShowAvailableModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BeanIcon size="lg" className="text-penkey-brown" />
            Available Beans
          </DialogTitle>
          <DialogDescription className="text-sm">
            Beans you can use right now to redeem rewards
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-penkey-brown/20">
            <p className="text-3xl sm:text-5xl font-bold text-penkey-dark mb-2">{currentPoints.toLocaleString()}</p>
            <p className="text-sm text-penkey-gray">Ready to Use</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-penkey-dark">What can you do?</h4>
            <ul className="text-sm text-penkey-gray space-y-1.5">
              <li className="flex items-start gap-2">
                <Gift className="w-4 h-4 text-penkey-orange flex-shrink-0 mt-0.5" />
                <span>Redeem rewards from the rewards catalog</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-penkey-orange flex-shrink-0 mt-0.5" />
                <span>Keep earning to unlock higher-tier rewards</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/points/history">
              <Button variant="outline" className="w-full">
                View History
              </Button>
            </Link>
            <Link href="/rewards">
              <Button className="w-full bg-penkey-orange hover:bg-orange-600">
                Browse Rewards
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Pending Beans Modal */}
    <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <HourglassIcon className="w-5 h-5 sm:w-6 sm:h-6 text-penkey-orange" />
            Pending Beans
          </DialogTitle>
          <DialogDescription className="text-sm">
            Beans waiting to be claimed at Penkey
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-penkey-orange/20">
            <p className="text-3xl sm:text-5xl font-bold text-penkey-orange mb-2">{pendingPoints.toLocaleString()}</p>
            <p className="text-sm text-penkey-gray">Waiting for You</p>
          </div>

          <div className="space-y-3 p-4 bg-white rounded-lg border border-penkey-orange/20">
            <h4 className="font-semibold text-penkey-dark flex items-center gap-2">
              <MapPin className="w-4 h-4 text-penkey-orange" />
              How to Claim
            </h4>
            <ol className="text-sm text-penkey-gray space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-penkey-orange">1.</span>
                <span>Visit Penkey Délicaf & Gifts in person</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-penkey-orange">2.</span>
                <span>Show your QR code to staff or use the check-in scanner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-penkey-orange">3.</span>
                <span>Your pending beans will be added to your available balance!</span>
              </li>
            </ol>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Pending beans are earned from games and activities. Check in to claim them!
            </p>
          </div>

          <Button 
            onClick={() => setShowPendingModal(false)}
            className="w-full bg-penkey-orange hover:bg-orange-600"
          >
            Got It!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
