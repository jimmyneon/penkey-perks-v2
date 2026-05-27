'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Gift, Sparkles, Lock, CheckCircle2, Clock, Award, HelpCircle, Trophy, Tag, BadgePercent, Star, QrCode, History } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useToast } from '@/hooks/use-toast'
import { getDaysUntil } from '@/lib/utils'
import { HowItWorks } from '@/components/how-it-works'
import { HowItWorksDynamic } from '@/components/how-it-works-dynamic'
import { BeanIcon } from '@/components/ui/bean-icon'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'

interface Reward {
  id: string
  name: string
  description: string
  reward_type: string
  discount_value: number | null
  points_required: number
  stock: number | null
  active: boolean
  expiry_days: number | null
}

interface PointsConfig {
  action_type: string
  points_amount: number
  description: string
  active: boolean
}

interface UnifiedRewardsClientProps {
  currentPoints: number
  availableRewards: Reward[]
  userRewards: any[]
  userId: string
  pointsConfigs?: PointsConfig[]
}

// Helper function for bean formatting
function formatBeans(amount: number): string {
  return `${amount.toLocaleString()} ${amount === 1 ? 'bean' : 'beans'}`
}

export function UnifiedRewardsClient({ 
  currentPoints, 
  availableRewards, 
  userRewards,
  userId,
  pointsConfigs = []
}: UnifiedRewardsClientProps) {
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [selectedEarnedReward, setSelectedEarnedReward] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [redeemedRewardData, setRedeemedRewardData] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  const activeRewards = userRewards.filter(r => r.status === 'active')
  const redeemedRewards = userRewards.filter(r => r.status === 'redeemed')
  const expiredRewards = userRewards.filter(r => r.status === 'expired')
  const historyRewards = [...redeemedRewards, ...expiredRewards].sort((a, b) => 
    new Date(b.redeemed_at || b.created_at).getTime() - new Date(a.redeemed_at || a.created_at).getTime()
  )

  // Generate QR code for earned rewards
  useEffect(() => {
    if (selectedEarnedReward && selectedEarnedReward.status === 'active') {
      QRCode.toDataURL(selectedEarnedReward.qr_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2C3E50',
          light: '#FFFEF7',
        },
      }).then(setQrCodeUrl)
    }
  }, [selectedEarnedReward])

  // Realtime subscription to detect when reward is redeemed
  useEffect(() => {
    if (!selectedEarnedReward || selectedEarnedReward.status !== 'active') return

    const supabase = createClient()
    console.log('Setting up realtime for reward:', selectedEarnedReward.id)

    const channel = supabase
      .channel(`reward-${selectedEarnedReward.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_rewards',
          filter: `id=eq.${selectedEarnedReward.id}`,
        },
        (payload) => {
          console.log('🎉 Reward updated via realtime:', payload)
          if (payload.new.status === 'redeemed') {
            // Close QR dialog and show success modal!
            setSelectedEarnedReward(null)
            setRedeemedRewardData(selectedEarnedReward.rewards)
            setShowSuccessModal(true)
            toast({
              title: '🎉 Reward Redeemed!',
              description: 'Staff has redeemed your reward!',
            })
            // Refresh to update the list
            router.refresh()
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return () => {
      console.log('Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [selectedEarnedReward, router])

  const canAfford = (cost: number) => currentPoints >= cost

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'free_item':
        return <Gift className="w-8 h-8 text-penkey-orange" />
      case 'fixed_discount':
        return <Tag className="w-8 h-8 text-green-600" />
      case 'percentage_discount':
        return <BadgePercent className="w-8 h-8 text-blue-600" />
      case 'badge':
        return <Trophy className="w-8 h-8 text-yellow-600" />
      default:
        return <Gift className="w-8 h-8 text-penkey-orange" />
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

      // Show success modal
      setRedeemedRewardData(selectedReward)
      setShowSuccessModal(true)
      setSelectedReward(null)
      
      toast({
        title: '🎉 Yaaas! Reward Redeemed!',
        description: `${selectedReward.name} is now in your rewards! 💕`,
      })

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

  return (
    <div className="min-h-screen bg-[#F5EFE9]">
      {/* Header */}
      <header className="pt-12 pb-3 px-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#B07A5E] uppercase tracking-widest mb-0.5">Penkey Perks</p>
          <h1 className="text-[26px] font-extrabold text-[#2C1810] tracking-tight">Rewards</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-[14px] px-3 py-2 shadow-[0_1px_4px_rgba(44,24,16,0.08)] mb-1">
          <BeanIcon size="md" className="text-[#C49A6C]" />
          <span className="text-[18px] font-extrabold text-[#2C1810]">{currentPoints.toLocaleString()}</span>
          <span className="text-[11px] text-[#9A7A6A] font-medium">beans</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-28">
        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="flex w-full gap-1 h-auto p-1 bg-white rounded-[14px] shadow-[0_1px_4px_rgba(44,24,16,0.07)] mb-4">
            <TabsTrigger
              value="how-it-works"
              className="flex-1 flex-col gap-0.5 py-2 text-[10px] font-bold data-[state=active]:bg-[#2C1810] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(44,24,16,0.25)] data-[state=active]:rounded-[10px] text-[#9A7A6A] rounded-[10px] transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How to earn
            </TabsTrigger>
            <TabsTrigger
              value="milestones"
              className="flex-1 flex-col gap-0.5 py-2 text-[10px] font-bold data-[state=active]:bg-[#2C1810] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(44,24,16,0.25)] data-[state=active]:rounded-[10px] text-[#9A7A6A] rounded-[10px] transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              Progress
            </TabsTrigger>
            <TabsTrigger
              value="available"
              className="flex-1 flex-col gap-0.5 py-2 text-[10px] font-bold data-[state=active]:bg-[#2C1810] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(44,24,16,0.25)] data-[state=active]:rounded-[10px] text-[#9A7A6A] rounded-[10px] transition-all relative"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Shop
              {availableRewards.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E48A3A] text-white text-[9px] font-bold flex items-center justify-center">
                  {availableRewards.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="earned"
              className="flex-1 flex-col gap-0.5 py-2 text-[10px] font-bold data-[state=active]:bg-[#2C1810] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(44,24,16,0.25)] data-[state=active]:rounded-[10px] text-[#9A7A6A] rounded-[10px] transition-all relative"
            >
              <Gift className="w-3.5 h-3.5" />
              Mine
              {activeRewards.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E48A3A] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeRewards.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 flex-col gap-0.5 py-2 text-[10px] font-bold data-[state=active]:bg-[#2C1810] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(44,24,16,0.25)] data-[state=active]:rounded-[10px] text-[#9A7A6A] rounded-[10px] transition-all"
            >
              <History className="w-3.5 h-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          {/* How It Works Tab */}
          <TabsContent value="how-it-works" className="space-y-6 mt-6">
            {pointsConfigs.length > 0 ? (
              <HowItWorksDynamic pointsConfigs={pointsConfigs} />
            ) : (
              <HowItWorks />
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-3 mt-0">
            <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-[#E48A3A]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#2C1810]">Your beans</p>
                <p className="text-[12px] text-[#9A7A6A] mt-0.5">
                  You have <strong className="text-[#C49A6C]">{formatBeans(currentPoints)}</strong>. Keep earning for free coffee!
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {availableRewards.length > 0 && (
              <div className="bg-white rounded-[16px] shadow-[0_1px_4px_rgba(44,24,16,0.07)] overflow-hidden">
                <div className="p-4">
                  <div className="space-y-5">
                    {availableRewards.map((reward, index) => {
                      const isUnlocked = currentPoints >= reward.points_required
                      const progress = Math.min((currentPoints / reward.points_required) * 100, 100)
                      const pointsNeeded = Math.max(0, reward.points_required - currentPoints)

                      return (
                        <div key={reward.id} className="relative">
                          {/* Milestone Card */}
                          <div className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
                            isUnlocked 
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-300 shadow-sm' 
                              : 'bg-white border-penkey-border hover:border-penkey-orange/30'
                          }`}>
                            {/* Icon */}
                            <div className={`flex-shrink-0 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                              {getRewardIcon(reward.reward_type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h3 className="font-bold text-penkey-dark flex items-center gap-2">
                                    {reward.name}
                                    {isUnlocked && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                    {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                                  </h3>
                                  <p className="text-sm text-gray-600">{reward.description}</p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className={`font-bold flex items-center gap-1 ${isUnlocked ? 'text-green-600' : 'text-[#8B4513]'}`}>
                                    <BeanIcon size="sm" className={isUnlocked ? 'text-green-600' : 'text-[#8B4513]'} />
                                    {formatBeans(reward.points_required)}
                                  </span>
                                  {!isUnlocked && (
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <BeanIcon size="sm" className="text-gray-500" />
                                      {pointsNeeded.toLocaleString()} to go
                                    </span>
                                  )}
                                  {isUnlocked && (
                                    <span className="text-green-600 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Unlocked!
                                    </span>
                                  )}
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      isUnlocked ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-[#8B4513] to-[#D2691E]'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action Button */}
                              {isUnlocked && (
                                <Button 
                                  size="sm" 
                                  className="mt-3 w-full bg-penkey-orange hover:bg-penkey-orange-dark"
                                  onClick={() => setSelectedReward(reward)}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Redeem Now!
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Connector Line */}
                          {index < availableRewards.length - 1 && (
                            <div className="flex justify-center py-2">
                              <div className={`w-0.5 h-6 ${isUnlocked ? 'bg-green-300' : 'bg-gray-300'}`} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Motivational Card */}
            <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#E48A3A]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#2C1810]">Earn more beans</p>
                <p className="text-[12px] text-[#9A7A6A] mt-0.5">Check in, get stamps, and refer friends</p>
              </div>
            </div>
          </TabsContent>

          {/* Available Rewards Tab */}
          <TabsContent value="available" className="space-y-3 mt-0">
            <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#E48A3A]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#2C1810]">Spend your beans</p>
                <p className="text-[12px] text-[#9A7A6A] mt-0.5">You have <strong className="text-[#C49A6C]">{formatBeans(currentPoints)}</strong> to spend</p>
              </div>
            </div>

            {availableRewards.length === 0 ? (
              <div className="bg-white rounded-[16px] py-12 text-center shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
                <Gift className="w-12 h-12 text-[#D8CEC8] mx-auto mb-3" />
                <p className="text-[13px] text-[#9A7A6A] font-medium">No rewards available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRewards.map((reward) => {
                  const affordable = canAfford(reward.points_required)
                  const outOfStock = reward.stock !== null && reward.stock <= 0

                  return (
                    <div
                      key={reward.id}
                      className={`bg-white rounded-[16px] shadow-[0_1px_4px_rgba(44,24,16,0.07)] overflow-hidden transition-all ${
                        affordable && !outOfStock ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50'
                      }`}
                      onClick={() => affordable && !outOfStock && setSelectedReward(reward)}
                    >
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-[#FAF8F5] flex items-center justify-center flex-shrink-0">{getRewardIcon(reward.reward_type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[14px] font-bold text-[#2C1810] leading-tight">{reward.name}</p>
                            {!affordable && <Lock className="w-3.5 h-3.5 text-[#C4AFA8] flex-shrink-0" />}
                          </div>
                          <p className="text-[12px] text-[#9A7A6A] mt-0.5 leading-snug">{reward.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#F0E8E2] px-4 py-3">
                        <div className="flex items-center gap-1">
                          <BeanIcon size="sm" className={affordable ? 'text-[#C49A6C]' : 'text-[#C4AFA8]'} />
                          <span className={`text-[15px] font-extrabold ${affordable ? 'text-[#2C1810]' : 'text-[#C4AFA8]'}`}>{reward.points_required.toLocaleString()}</span>
                          <span className="text-[11px] text-[#9A7A6A] ml-0.5">beans</span>
                        </div>
                        {affordable && !outOfStock ? (
                          <span className="text-[11px] font-bold text-white bg-[#E48A3A] px-3 py-1.5 rounded-full">Redeem</span>
                        ) : outOfStock ? (
                          <span className="text-[11px] font-bold text-[#9A7A6A] bg-[#F0E8E2] px-3 py-1.5 rounded-full">Out of stock</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#9A7A6A]">{(reward.points_required - currentPoints).toLocaleString()} more beans</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* My Earned Rewards Tab */}
          <TabsContent value="earned" className="space-y-3 mt-0">
            {activeRewards.length === 0 ? (
              <div className="bg-white rounded-[16px] py-12 text-center shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
                <Gift className="w-12 h-12 text-[#D8CEC8] mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-[#9A7A6A] mb-1">No rewards yet</p>
                <p className="text-[11px] text-[#C4AFA8]">Spend beans in the Shop tab to get rewards</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRewards.map((userReward) => {
                  const reward = userReward.rewards
                  
                  // Skip if reward data is missing
                  if (!reward) {
                    console.error('Missing reward data for user_reward:', userReward.id)
                    return null
                  }

                  const expiryText = getExpiryText(userReward.expires_at)
                  const isExpiringSoon = userReward.expires_at && getDaysUntil(userReward.expires_at) <= 3

                  return (
                    <Link href={`/rewards/${userReward.id}`} key={userReward.id}>
                      <div className={`bg-white rounded-[16px] overflow-hidden shadow-[0_1px_4px_rgba(44,24,16,0.07)] active:scale-[0.98] transition-all ${
                        isExpiringSoon ? 'ring-2 ring-red-300' : ''
                      }`}>
                        <div className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${isExpiringSoon ? 'bg-red-50' : 'bg-[#FAF8F5]'}`}>{getRewardIcon(reward.reward_type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#2C1810] leading-tight">{reward.name}</p>
                            <p className="text-[12px] text-[#9A7A6A] mt-0.5">{reward.description}</p>
                          </div>
                          {reward.value && (
                            <span className="text-[13px] font-bold text-[#E48A3A] bg-[#FFF5EB] px-2 py-1 rounded-[8px] flex-shrink-0">{reward.value}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-[#F0E8E2] px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#C4AFA8]" />
                            <span className={`text-[12px] font-medium ${isExpiringSoon ? 'text-red-500 font-bold' : 'text-[#9A7A6A]'}`}>{expiryText}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#7B1234]">
                            <QrCode className="w-3.5 h-3.5" />
                            Show QR
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-3 mt-0">
            {historyRewards.length === 0 ? (
              <div className="bg-white rounded-[16px] py-12 text-center shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
                <History className="w-12 h-12 text-[#D8CEC8] mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-[#9A7A6A] mb-1">No history yet</p>
                <p className="text-[11px] text-[#C4AFA8]">Redeemed and expired rewards appear here</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                    <History className="w-5 h-5 text-[#E48A3A]" />
                  </div>
                  <p className="text-[12px] text-[#9A7A6A]">
                    Used <strong className="text-[#2C1810]">{redeemedRewards.length}</strong> {redeemedRewards.length === 1 ? 'reward' : 'rewards'}{expiredRewards.length > 0 ? ` · ${expiredRewards.length} expired` : ''}
                  </p>
                </div>

                <div className="space-y-2">
                  {historyRewards.map((userReward) => {
                    const reward = userReward.rewards
                    if (!reward) return null
                    const isRedeemed = userReward.status === 'redeemed'
                    const isExpired = userReward.status === 'expired'
                    const displayDate = isRedeemed && userReward.redeemed_at 
                      ? new Date(userReward.redeemed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date(userReward.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

                    return (
                      <Link href={`/rewards/${userReward.id}`} key={userReward.id}>
                        <div className={`bg-white rounded-[14px] px-4 py-3.5 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3 active:scale-[0.98] transition-all ${
                          isExpired ? 'opacity-50' : ''
                        }`}>
                          <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${isRedeemed ? 'bg-[#F0FAF4]' : 'bg-[#F5EFE9]'}`}>
                            {isRedeemed ? <CheckCircle2 className="w-4 h-4 text-[#2A7A4A]" /> : <Clock className="w-4 h-4 text-[#C4AFA8]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold text-[#2C1810] truncate">{reward.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                isRedeemed ? 'bg-[#F0FAF4] text-[#2A7A4A]' : 'bg-[#F5EFE9] text-[#9A7A6A]'
                              }`}>{isRedeemed ? 'Used' : 'Expired'}</span>
                            </div>
                            <p className="text-[11px] text-[#C4AFA8] mt-0.5">{displayDate}</p>
                          </div>
                          {reward.value && <span className="text-[12px] font-bold text-[#9A7A6A] flex-shrink-0">{reward.value}</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Redeem Reward?</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px]">{selectedReward?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(44,24,16,0.07)] text-center">
              <p className="text-[11px] font-bold text-[#9A7A6A] uppercase tracking-widest mb-2">This will cost</p>
              <div className="flex items-center justify-center gap-1.5">
                <BeanIcon size="lg" className="text-[#C49A6C]" />
                <span className="text-[2rem] font-extrabold text-[#2C1810] leading-none">{selectedReward?.points_required.toLocaleString()}</span>
                <span className="text-[13px] text-[#9A7A6A]">beans</span>
              </div>
              <p className="text-[12px] text-[#9A7A6A] mt-2">{(currentPoints - (selectedReward?.points_required || 0)).toLocaleString()} beans remaining after</p>
            </div>
            <div className="bg-white rounded-[14px] p-3.5 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                <QrCode className="w-4 h-4 text-[#E48A3A]" />
              </div>
              <p className="text-[12px] text-[#6B4C3B]">A QR code will appear in <strong>My Rewards</strong> for staff to scan</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedReward(null)} disabled={isRedeeming} className="flex-1 py-3 bg-[#F0E8E2] text-[#6B4C3B] text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60">Cancel</button>
              <button onClick={handleRedeem} disabled={isRedeeming} className="flex-1 py-3 bg-[#E48A3A] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60">{isRedeeming ? 'Redeeming…' : 'Redeem'}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog for Earned Rewards */}
      <Dialog open={!!selectedEarnedReward} onOpenChange={() => setSelectedEarnedReward(null)}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold text-center">{selectedEarnedReward?.rewards?.name}</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px] text-center">Show to staff to redeem</DialogDescription>
          </DialogHeader>
          {selectedEarnedReward?.status === 'active' && (
            <div className="space-y-3 pb-1">
              <div className="bg-white rounded-[16px] p-4 flex items-center justify-center shadow-[0_1px_4px_rgba(44,24,16,0.07)]">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 animate-qr-pop" />
                ) : (
                  <div className="w-48 h-48 bg-[#F5EFE9] rounded-[12px] flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-[#C4AFA8]" />
                  </div>
                )}
              </div>
              <div className="bg-white rounded-[14px] px-3 py-2.5 shadow-[0_1px_4px_rgba(44,24,16,0.07)] text-center">
                <p className="text-[11px] font-mono text-[#9A7A6A] break-all">{selectedEarnedReward.qr_code}</p>
                <p className="text-[11px] text-[#C4AFA8] mt-0.5">{getExpiryText(selectedEarnedReward.expires_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-[#FAF8F5] border-0 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-[#F0FAF4] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-[#2A7A4A]" />
            </div>
            <div>
              <h2 className="text-[22px] font-extrabold text-[#2C1810]">Reward Redeemed!</h2>
              <p className="text-[13px] text-[#9A7A6A] mt-1">Your reward is now active</p>
            </div>
            {redeemedRewardData && (
              <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(44,24,16,0.07)] flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-[12px] bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-[#E48A3A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#2C1810]">{redeemedRewardData.name}</p>
                  {redeemedRewardData.description && <p className="text-[12px] text-[#9A7A6A]">{redeemedRewardData.description}</p>}
                </div>
              </div>
            )}
            <div className="bg-[#FFF5EB] rounded-[14px] px-4 py-3 text-left">
              <p className="text-[12px] font-bold text-[#2C1810] mb-0.5">While you're here…</p>
              <p className="text-[12px] text-[#6B4C3B] leading-relaxed">Try our <strong>chocolate brownies</strong> or <strong>famous crumble slices</strong> — they pair perfectly with your coffee.</p>
            </div>
            <button
              onClick={() => { setShowSuccessModal(false); setRedeemedRewardData(null) }}
              className="w-full py-3.5 bg-[#2C1810] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  )
}
