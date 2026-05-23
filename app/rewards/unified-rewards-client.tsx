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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-[#4B3028]">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-[#8D123F]" />
                <h1 className="text-xl font-bold text-[#4B3028]">Rewards</h1>
              </div>
            </div>
            
            {/* Beans Display */}
            <div className="bg-white border-2 border-gray-200 px-3 sm:px-4 py-2 rounded-xl">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <BeanIcon size="md" className="text-[#4B3028]" />
                <span className="text-xl sm:text-2xl font-bold text-[#4B3028]">{currentPoints.toLocaleString()}</span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">beans</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1.5 bg-gray-100 border border-gray-200 rounded-lg">
            <TabsTrigger 
              value="how-it-works" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border-[#8D123F]/20 data-[state=active]:border"
            >
              <HelpCircle className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">How to earn</span>
            </TabsTrigger>
            <TabsTrigger 
              value="milestones" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border-[#8D123F]/20 data-[state=active]:border"
            >
              <Award className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Progress</span>
            </TabsTrigger>
            <TabsTrigger 
              value="available" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border-[#8D123F]/20 data-[state=active]:border"
            >
              <Sparkles className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Available</span>
                <span className="sm:hidden">Shop</span>
                {availableRewards.length > 0 && (
                  <span className="ml-1 text-[10px] sm:text-xs bg-[#8D123F] text-white px-1.5 py-0.5 rounded-full">
                    {availableRewards.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="earned" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border-[#8D123F]/20 data-[state=active]:border"
            >
              <Gift className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">My Rewards</span>
                <span className="sm:hidden">Mine</span>
                {activeRewards.length > 0 && (
                  <span className="ml-1 text-[10px] sm:text-xs bg-[#8D123F] text-white px-1.5 py-0.5 rounded-full">
                    {activeRewards.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 sm:py-2 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border-[#8D123F]/20 data-[state=active]:border"
            >
              <History className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">History</span>
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
          <TabsContent value="milestones" className="space-y-4 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-[#8D123F] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-[#4B3028] mb-2">
                    Your beans
                  </h2>
                  <p className="text-gray-600">
                    You have <strong className="inline-flex items-center gap-1"><BeanIcon size="sm" className="text-[#4B3028]" />{formatBeans(currentPoints)}</strong>. Keep earning to get free coffee!
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {availableRewards.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="space-y-6">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
              <Sparkles className="w-12 h-12 text-[#8D123F] mx-auto mb-3" />
              <h3 className="font-bold text-[#4B3028] mb-2">
                Earn more beans
              </h3>
              <p className="text-sm text-gray-600">
                Check in, get stamps, play games, and refer friends to earn beans
              </p>
            </div>
          </TabsContent>

          {/* Available Rewards Tab */}
          <TabsContent value="available" className="space-y-4 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <Sparkles className="w-8 h-8 text-[#8D123F] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-[#4B3028] mb-2">
                    Spend your beans
                  </h2>
                  <p className="text-gray-600">
                    You have <strong className="inline-flex items-center gap-1"><BeanIcon size="sm" className="text-[#4B3028]" />{formatBeans(currentPoints)}</strong>. Use them for free drinks
                  </p>
                </div>
              </div>
            </div>

            {availableRewards.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-12 text-center shadow-sm">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rewards available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRewards.map((reward) => {
                  const affordable = canAfford(reward.points_required)
                  const outOfStock = reward.stock !== null && reward.stock <= 0

                  return (
                    <div
                      key={reward.id}
                      className={`bg-white border border-gray-200 shadow-sm transition-all rounded-xl overflow-hidden ${
                        affordable && !outOfStock
                          ? 'hover:shadow-md hover:border-[#8D123F] hover:scale-[1.01] cursor-pointer'
                          : 'opacity-60'
                      }`}
                      onClick={() => affordable && !outOfStock && setSelectedReward(reward)}
                    >
                      <div className="p-4 pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 text-base sm:text-lg font-medium text-[#4B3028]">
                              <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">{getRewardIcon(reward.reward_type)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span>{reward.name}</span>
                                  {!affordable && <Lock className="w-4 h-4 text-gray-400" />}
                                </div>
                                <p className="mt-1 text-xs sm:text-sm text-gray-600">{reward.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 -mx-0 -mb-0 px-4 py-4 border-t border-gray-200">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <BeanIcon size="lg" className={affordable ? 'text-[#4B3028]' : 'text-gray-400'} />
                          <span className={`text-xl sm:text-2xl font-bold ${affordable ? 'text-[#4B3028]' : 'text-gray-400'}`}>
                            {reward.points_required.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-600">beans</span>
                        </div>
                        
                        {affordable && !outOfStock ? (
                          <Button size="sm" className="bg-[#8D123F] hover:bg-[#A8224E]">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Redeem
                          </Button>
                        ) : outOfStock ? (
                          <Button size="sm" variant="outline" disabled>
                            Out of Stock
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Need {(reward.points_required - currentPoints).toLocaleString()} more beans
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* My Earned Rewards Tab */}
          <TabsContent value="earned" className="space-y-4 mt-4 sm:mt-6">
            {activeRewards.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-12 text-center shadow-sm">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No rewards yet</p>
                <p className="text-sm text-gray-400 flex items-center justify-center gap-1">Spend beans to get rewards <BeanIcon size="sm" className="text-gray-400" /></p>
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
                      <div
                        className={`bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all hover:border-[#8D123F] rounded-xl overflow-hidden ${
                          isExpiringSoon ? 'border-red-400 border-2 ring-2 ring-red-100' : ''
                        }`}
                      >
                        <div className={`p-4 pb-3 ${isExpiringSoon ? 'bg-red-50/50' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">{getRewardIcon(reward.reward_type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base sm:text-lg font-medium text-[#4B3028]">{reward.name}</p>
                                <p className="text-xs sm:text-sm text-gray-600">{reward.description}</p>
                              </div>
                            </div>
                            {reward.value && (
                              <div className="flex-shrink-0 px-3 py-1.5 bg-[#8D123F]/10 rounded-lg border border-[#8D123F]/20">
                                <span className="text-lg sm:text-xl font-bold text-[#8D123F]">{reward.value}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 -mx-0 -mb-0 px-4 py-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className={isExpiringSoon ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {expiryText}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" className="border-[#8D123F]/30 hover:bg-[#8D123F]/10">
                            <QrCode className="w-4 h-4 mr-2" />
                            Show QR
                          </Button>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4 sm:mt-6">
            {historyRewards.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-12 text-center shadow-sm">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#4B3028] mb-2">No History Yet</h3>
                <p className="text-gray-500 mb-2">Your redeemed and expired rewards will appear here</p>
                <p className="text-sm text-gray-400">Keep earning beans to unlock rewards</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <History className="w-8 h-8 text-[#8D123F] flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-lg font-bold text-[#4B3028] mb-2">
                        Your Rewards Journey
                      </h2>
                      <p className="text-gray-600">
                        You've used <strong>{redeemedRewards.length}</strong> {redeemedRewards.length === 1 ? 'reward' : 'rewards'}! {expiredRewards.length > 0 && `${expiredRewards.length} expired.`} Keep earning beans for more rewards
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {historyRewards.map((userReward) => {
                    const reward = userReward.rewards
                    
                    // Skip if reward data is missing
                    if (!reward) return null

                    const isRedeemed = userReward.status === 'redeemed'
                    const isExpired = userReward.status === 'expired'
                    const displayDate = isRedeemed && userReward.redeemed_at 
                      ? new Date(userReward.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : new Date(userReward.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                    return (
                      <Link href={`/rewards/${userReward.id}`} key={userReward.id}>
                        <div 
                          className={`bg-white border border-gray-200 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-[#8D123F] rounded-xl p-4 ${
                            isExpired ? 'opacity-50' : 'opacity-75'
                          }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`flex-shrink-0 p-2 rounded-lg ${
                                  isRedeemed ? 'bg-green-50' : 'bg-gray-100'
                                }`}>
                                  {isRedeemed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-[#4B3028] truncate">{reward.name}</span>
                                    {isRedeemed && (
                                      <span className="flex-shrink-0 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        Used
                                      </span>
                                    )}
                                    {isExpired && (
                                      <span className="flex-shrink-0 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {isRedeemed ? `Redeemed on ${displayDate}` : `Expired on ${displayDate}`}
                                  </p>
                                </div>
                              </div>
                              {reward.value && (
                                <div className="flex-shrink-0 text-right">
                                  <span className="text-sm font-bold text-gray-600">{reward.value}</span>
                                </div>
                              )}
                            </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Motivational Footer */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm mt-6">
                  <Sparkles className="w-10 h-10 text-[#8D123F] mx-auto mb-3" />
                  <h3 className="font-bold text-[#4B3028] mb-2">
                    Keep Going
                  </h3>
                  <p className="text-sm text-gray-600">
                    Every bean gets you closer to your next reward. Check in daily, play games, and refer friends
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex justify-center">
              <div className="p-4 bg-gray-100 rounded-2xl border border-gray-200">
                {selectedReward && getRewardIcon(selectedReward.reward_type)}
              </div>
            </div>
            <DialogTitle className="text-center text-xl sm:text-2xl text-[#4B3028]">
              Redeem {selectedReward?.name}?
            </DialogTitle>
            <DialogDescription className="text-center space-y-3">
              <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">This will cost</p>
                <div className="flex items-center gap-2 justify-center">
                  <BeanIcon size="lg" className="text-[#4B3028]" />
                  <span className="text-2xl font-bold text-[#4B3028]">{selectedReward?.points_required.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">beans</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                You'll have <span className="font-semibold text-[#4B3028]">{(currentPoints - (selectedReward?.points_required || 0)).toLocaleString()} beans</span> remaining
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <QrCode className="w-5 h-5 text-[#8D123F]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#4B3028] mb-1">Next Steps</p>
                <p className="text-xs text-gray-600">
                  Your reward will appear in "My Rewards" with a QR code to show staff
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setSelectedReward(null)}
              className="flex-1 sm:flex-none sm:min-w-[120px]"
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              className="flex-1 sm:flex-none sm:min-w-[120px] bg-[#8D123F] hover:bg-[#A8224E]"
              disabled={isRedeeming}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isRedeeming ? 'Redeeming...' : 'Redeem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog for Earned Rewards */}
      <Dialog open={!!selectedEarnedReward} onOpenChange={() => setSelectedEarnedReward(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-[#4B3028]">
              {selectedEarnedReward?.rewards?.name}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Show this QR code to staff to redeem
            </DialogDescription>
          </DialogHeader>

          {selectedEarnedReward?.status === 'active' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-full max-w-[250px] animate-bubble-pop" 
                  />
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                  {selectedEarnedReward.qr_code}
                </p>
                <p className="text-xs text-gray-500">
                  {getExpiryText(selectedEarnedReward.expires_at)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md border-4 border-[#8D123F] bg-gradient-to-b from-white to-gray-50 rounded-2xl">
          <div className="text-center space-y-6 py-4">
            {/* Celebration Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8D123F] to-[#A8224E] flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-[#4B3028]">
                Reward Redeemed
              </h2>
              <p className="text-xl font-semibold text-[#8D123F]">
                Your reward is ready!
              </p>
            </div>

            {/* Reward Info */}
            {redeemedRewardData && (
              <div className="bg-white rounded-2xl p-6 border-2 border-[#8D123F]/30 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#8D123F]/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-8 h-8 text-[#8D123F]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg text-[#4B3028]">{redeemedRewardData.name}</p>
                    {redeemedRewardData.description && (
                      <p className="text-sm text-gray-600">{redeemedRewardData.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-green-900 font-medium mb-2">
                    ✅ Your reward has been redeemed!
                  </p>
                  <p className="text-xs text-green-700">
                    Enjoy your treat! 🎉
                  </p>
                </div>
              </div>
            )}

            {/* Penkey Messaging */}
            <div className="bg-gradient-to-r from-[#8D123F]/10 to-gray-50 rounded-2xl p-5 border-2 border-[#8D123F]/20">
              <p className="text-[#4B3028] font-medium mb-3">
                While you're here...
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Don't forget to try our <span className="font-bold text-[#E48A3A]">chocolate brownies</span> or our <span className="font-bold text-[#E48A3A]">famous crumble slices</span>! 
              </p>
              <p className="text-sm text-gray-600 mt-2">
                They pair perfectly with your favourite coffee
              </p>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                setRedeemedRewardData(null)
              }}
              className="w-full bg-[#8D123F] hover:bg-[#A8224E] text-white font-bold py-6 text-lg rounded-xl shadow-lg"
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
