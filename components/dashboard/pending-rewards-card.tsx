'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift, Clock, MapPin, Sparkles, TrendingUp, Award, Gamepad2, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface PendingReward {
  id: string
  reward_type: string
  amount: number
  reward_name: string
  reward_description: string
  expires_at: string
  earned_at: string
  source: string
  metadata: any
}

export function PendingRewardsCard() {
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([])
  const [loading, setLoading] = useState(true)

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
    }
    setLoading(false)
  }

  const getDaysLeft = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'game_win': return <Gamepad2 className="w-4 h-4" />
      case 'referral': return <Award className="w-4 h-4" />
      case 'email_offer': return <Mail className="w-4 h-4" />
      case 'milestone_bonus': return <TrendingUp className="w-4 h-4" />
      case 'streak_bonus': return <Sparkles className="w-4 h-4" />
      default: return <Gift className="w-4 h-4" />
    }
  }

  const getSourceLabel = (source: string) => {
    return source.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'points': return '💰'
      case 'stamps': return '☕'
      case 'voucher': return '🎟️'
      case 'game_play': return '🎮'
      default: return '🎁'
    }
  }

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 1) return 'text-red-600 bg-red-50 border-red-200'
    if (daysLeft <= 3) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (daysLeft <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getProgressPercentage = (expiresAt: string, earnedAt: string) => {
    const total = new Date(expiresAt).getTime() - new Date(earnedAt).getTime()
    const elapsed = Date.now() - new Date(earnedAt).getTime()
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Pending Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (pendingRewards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Pending Rewards
          </CardTitle>
          <CardDescription>
            Rewards waiting to be claimed at Penkey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No pending rewards</p>
            <p className="text-sm text-gray-400">
              Play games, refer friends, or complete challenges to earn rewards!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Pending Rewards ({pendingRewards.length})
        </CardTitle>
        <CardDescription>
          Check in at Penkey to claim these rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingRewards.map((reward) => {
            const daysLeft = getDaysLeft(reward.expires_at)
            const progress = getProgressPercentage(reward.expires_at, reward.earned_at)
            
            return (
              <div 
                key={reward.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">
                      {getRewardTypeIcon(reward.reward_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-penkey-dark">
                        {reward.reward_name}
                      </h4>
                      {reward.reward_description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {reward.reward_description}
                        </p>
                      )}
                      
                      {/* Source badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getSourceIcon(reward.source)}
                          <span className="ml-1">{getSourceLabel(reward.source)}</span>
                        </Badge>
                        
                        {/* Amount badge */}
                        {reward.amount && (
                          <Badge className="bg-penkey-orange text-white text-xs">
                            {reward.amount} {reward.reward_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Days left badge */}
                  <div className={`px-3 py-1 rounded-full border ${getUrgencyColor(daysLeft)} text-xs font-semibold whitespace-nowrap`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {daysLeft === 0 ? 'Expires today!' : 
                     daysLeft === 1 ? '1 day left' : 
                     `${daysLeft} days left`}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Earned {new Date(reward.earned_at).toLocaleDateString()}</span>
                    <span>Expires {new Date(reward.expires_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Urgency message */}
                {daysLeft <= 3 && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                    <p className="text-orange-800 text-xs font-semibold">
                      {daysLeft === 0 ? '🚨 Expires today! Check in now!' :
                       daysLeft === 1 ? '⚠️ Expires tomorrow! Don\'t miss out!' :
                       `⏰ Only ${daysLeft} days left to claim!`}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer message */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                How to Claim Your Rewards
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Visit Penkey Deli</li>
                <li>Open the Penkey Perks app</li>
                <li>Tap "Check In"</li>
                <li>All your pending rewards will be claimed automatically! 🎉</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
