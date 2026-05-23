'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift, Clock, Sparkles, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PendingReward {
  id: string
  reward_type: string
  amount: number
  reward_name: string
  reward_description: string
  expires_at: string
  source: string
}

export function PendingRewardsBanner() {
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchPendingRewards()
  }, [])

  const fetchPendingRewards = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase
      .from('pending_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('expires_at', { ascending: true })

    if (!error && data) {
      setPendingRewards(data)
      setTotalCount(data.length)
    }
    setLoading(false)
  }

  if (loading || totalCount === 0) return null

  const getDaysLeft = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 1) return 'from-red-500 to-orange-500'
    if (daysLeft <= 3) return 'from-orange-500 to-yellow-500'
    return 'from-penkey-orange to-yellow-400'
  }

  const minDaysLeft = Math.min(...pendingRewards.map(r => getDaysLeft(r.expires_at)))
  const urgencyColor = getUrgencyColor(minDaysLeft)

  const totalPoints = pendingRewards
    .filter(r => r.reward_type === 'points')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalStamps = pendingRewards
    .filter(r => r.reward_type === 'stamps')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalVouchers = pendingRewards.filter(r => r.reward_type === 'voucher').length

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-r ${urgencyColor} border-0 shadow-lg mb-6`}>
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] animate-pulse" />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">
                🎁 You Have {totalCount} Pending {totalCount === 1 ? 'Reward' : 'Rewards'}!
              </h3>
              <p className="text-white/90 text-sm">
                Check in at Penkey to claim them all
              </p>
            </div>
          </div>

          {/* Urgency badge */}
          {minDaysLeft <= 3 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                {minDaysLeft === 1 ? '1 day left!' : `${minDaysLeft} days left`}
              </span>
            </div>
          )}
        </div>

        {/* Rewards Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {totalPoints > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{totalPoints}</div>
              <div className="text-white/80 text-xs">Beans</div>
            </div>
          )}
          {totalStamps > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{totalStamps}</div>
              <div className="text-white/80 text-xs">Stamps</div>
            </div>
          )}
          {totalVouchers > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{totalVouchers}</div>
              <div className="text-white/80 text-xs">Vouchers</div>
            </div>
          )}
        </div>

        {/* Rewards List (first 3) */}
        <div className="space-y-2 mb-4">
          {pendingRewards.slice(0, 3).map((reward) => (
            <div 
              key={reward.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-white" />
                <div>
                  <div className="text-white font-semibold text-sm">
                    {reward.reward_name}
                  </div>
                  <div className="text-white/70 text-xs">
                    {reward.reward_description || `From ${reward.source.replace('_', ' ')}`}
                  </div>
                </div>
              </div>
              <div className="text-white/70 text-xs">
                {getDaysLeft(reward.expires_at)}d
              </div>
            </div>
          ))}
          {pendingRewards.length > 3 && (
            <div className="text-white/80 text-sm text-center">
              + {pendingRewards.length - 3} more rewards
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link href="/check-in">
          <Button 
            className="w-full bg-white text-penkey-orange hover:bg-white/90 font-bold shadow-lg"
            size="lg"
          >
            <Gift className="w-5 h-5 mr-2" />
            Check In to Claim All Rewards
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>

        {/* Warning for expiring soon */}
        {minDaysLeft <= 1 && (
          <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-white text-xs font-semibold">
              ⚠️ Some rewards expire {minDaysLeft === 0 ? 'TODAY' : 'TOMORROW'}! Don't miss out!
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
