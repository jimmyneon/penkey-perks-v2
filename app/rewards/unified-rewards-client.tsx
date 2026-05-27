'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Gift, Sparkles, CheckCircle2, Clock, Star, QrCode } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useToast } from '@/hooks/use-toast'
import { getDaysUntil } from '@/lib/utils'
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

  // Derived helpers
  const nextReward = availableRewards
    .filter(r => r.points_required > currentPoints)
    .sort((a, b) => a.points_required - b.points_required)[0]
  const unlockedRewards = availableRewards.filter(r => currentPoints >= r.points_required)
  const nextProgress = nextReward
    ? Math.min((currentPoints / nextReward.points_required) * 100, 100)
    : 100

  return (
    <div className="min-h-screen bg-[#FAF6F1]">

      {/* ── HERO HEADER ── */}
      <div className="pt-14 pb-6 px-5">
        <p className="text-[11px] font-bold text-[#AE9888] uppercase tracking-widest mb-1">Your Beans</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[64px] font-extrabold text-[#261408] leading-none tracking-tight">{currentPoints}</p>
            <p className="text-[14px] text-[#7A6454] mt-1 font-medium">
              {nextReward
                ? <><span className="font-bold text-[#D05A18]">{nextReward.points_required - currentPoints} more</span> until {nextReward.name}</>
                : <span className="text-[#2A7A4A] font-bold">All rewards unlocked 🎉</span>
              }
            </p>
          </div>
          {/* Progress ring */}
          <div className="relative flex-shrink-0 mb-1">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r="30" stroke="#EAD8C8" strokeWidth="5" fill="none" />
              <circle
                cx="36" cy="36" r="30"
                stroke="#D05A18"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 * (1 - nextProgress / 100)}
                style={{ filter: 'drop-shadow(0 0 4px rgba(208,90,24,0.45))', transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-extrabold text-[#261408]">{Math.round(nextProgress)}%</span>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 pb-28 space-y-5">

        {/* ── UNLOCKED — ready to redeem ── */}
        {unlockedRewards.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-[#B0A090] uppercase tracking-widest mb-2.5 px-1">Ready to Redeem</p>
            <div className="space-y-2">
              {unlockedRewards.map(reward => (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className="w-full bg-[#261408] rounded-[18px] px-4 py-4 flex items-center gap-3.5 active:scale-[0.98] transition-all shadow-[0_4px_24px_rgba(38,20,8,0.22)]"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[15px] font-extrabold text-white leading-tight">{reward.name}</p>
                    <p className="text-[12px] text-white/60 mt-0.5">{reward.points_required} beans</p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#D05A18] rounded-full px-3 py-1.5">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-[11px] font-bold text-white">Redeem</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── NEXT REWARD UNLOCK ── */}
        {nextReward && (
          <section>
            <p className="text-[11px] font-bold text-[#B0A090] uppercase tracking-widest mb-2.5 px-1">Next Up ☕</p>
            <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(38,20,8,0.08)] border border-[#E4D8CC]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[20px] font-extrabold text-[#261408] leading-tight">{nextReward.name}</p>
                  <p className="text-[13px] text-[#7A6454] mt-0.5">{nextReward.points_required - currentPoints} beans to go</p>
                </div>
                <div className="w-12 h-12 rounded-[14px] bg-[#FDF0E6] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-[#D05A18]" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-[#EDE8E2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D05A18] rounded-full transition-all duration-700"
                  style={{ width: `${nextProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-[#AE9888] font-semibold">{currentPoints} beans</span>
                <span className="text-[10px] text-[#AE9888] font-semibold">{nextReward.points_required} beans</span>
              </div>
            </div>
          </section>
        )}

        {/* ── ACTIVE VOUCHERS ── */}
        {activeRewards.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-[#B0A090] uppercase tracking-widest mb-2.5 px-1">Your Vouchers</p>
            <div className="space-y-2">
              {activeRewards.map(userReward => {
                const reward = userReward.rewards
                if (!reward) return null
                const expiringSoon = userReward.expires_at && getDaysUntil(userReward.expires_at) <= 3
                return (
                  <Link href={`/rewards/${userReward.id}`} key={userReward.id}>
                    <div className={`bg-white rounded-[16px] px-4 py-3.5 flex items-center gap-3 shadow-[0_1px_6px_rgba(26,18,8,0.07)] active:scale-[0.98] transition-all border ${expiringSoon ? 'border-red-200' : 'border-transparent'}`}>
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${expiringSoon ? 'bg-red-50' : 'bg-[#F5EAE0]'}`}>
                        <Gift className={`w-5 h-5 ${expiringSoon ? 'text-red-400' : 'text-[#D05A18]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#261408] leading-tight truncate">{reward.name}</p>
                        <p className={`text-[11px] mt-0.5 font-medium ${expiringSoon ? 'text-red-500' : 'text-[#AE9888]'}`}>{getExpiryText(userReward.expires_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#D05A18]">
                        <QrCode className="w-3.5 h-3.5" />
                        Show QR
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── HOW BEANS WORK ── visual flow ── */}
        <section>
          <p className="text-[11px] font-bold text-[#B0A090] uppercase tracking-widest mb-2.5 px-1">How It Works</p>
          <div className="bg-white rounded-[20px] p-5 shadow-[0_1px_6px_rgba(26,18,8,0.06)] border border-[#E8E0D8]">
            <div className="flex items-center justify-between">
              {[
                { icon: '☕', label: 'Buy' },
                { icon: '📱', label: 'Scan' },
                { icon: '🫘', label: 'Beans' },
                { icon: '🎁', label: 'Reward' },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-full bg-[#F5EAE0] flex items-center justify-center text-[20px]">{step.icon}</div>
                    <span className="text-[10px] font-bold text-[#7A6A5A]">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="w-5 h-px bg-[#D4CAC0] mb-4 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REWARD LADDER ── */}
        {availableRewards.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-[#B0A090] uppercase tracking-widest mb-2.5 px-1">Reward Ladder</p>
            <div className="bg-white rounded-[20px] shadow-[0_1px_6px_rgba(26,18,8,0.06)] border border-[#E8E0D8] overflow-hidden">
              {availableRewards
                .sort((a, b) => a.points_required - b.points_required)
                .map((reward, i, arr) => {
                  const unlocked = currentPoints >= reward.points_required
                  return (
                    <div
                      key={reward.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[#F2EDE8]' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${unlocked ? 'bg-[#D05A18]' : 'bg-[#EAD8C8]'}`}>
                        {unlocked
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <span className="text-[10px] font-extrabold text-[#AE9888]">{reward.points_required}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-bold leading-tight ${unlocked ? 'text-[#261408]' : 'text-[#7A6454]'}`}>{reward.name}</p>
                      </div>
                      <span className={`text-[11px] font-bold ${unlocked ? 'text-[#D05A18]' : 'text-[#AE9888]'}`}>
                        {unlocked ? 'Unlocked' : `${reward.points_required} beans`}
                      </span>
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* ── LIFETIME PROGRESS ── subtle strip ── */}
        <section>
          <div className="bg-white rounded-[16px] px-4 py-3.5 flex items-center justify-between shadow-[0_1px_4px_rgba(38,20,8,0.05)] border border-[#E4D8CC]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#D05A18]" />
              <span className="text-[12px] font-bold text-[#4E3420]">Lifetime beans</span>
            </div>
            <span className="text-[13px] font-extrabold text-[#261408]">{currentPoints.toLocaleString()}</span>
          </div>
        </section>

        {/* ── HISTORY (compact) ── */}
        {historyRewards.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-[#AE9888] uppercase tracking-widest mb-2.5 px-1">Past Rewards</p>
            <div className="space-y-1.5">
              {historyRewards.slice(0, 5).map(userReward => {
                const reward = userReward.rewards
                if (!reward) return null
                const isRedeemed = userReward.status === 'redeemed'
                const displayDate = isRedeemed && userReward.redeemed_at
                  ? new Date(userReward.redeemed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : new Date(userReward.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                return (
                  <Link href={`/rewards/${userReward.id}`} key={userReward.id}>
                    <div className={`bg-white rounded-[12px] px-4 py-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(26,18,8,0.05)] active:scale-[0.98] transition-all ${!isRedeemed ? 'opacity-40' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isRedeemed ? 'bg-[#F0FAF4]' : 'bg-[#F2EDE8]'}`}>
                        {isRedeemed ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7A4A]" /> : <Clock className="w-3.5 h-3.5 text-[#B0A090]" />}
                      </div>
                      <span className="flex-1 text-[12px] font-semibold text-[#4E3420] truncate">{reward.name}</span>
                      <span className="text-[11px] text-[#B0A090]">{displayDate}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

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
              <button onClick={() => setSelectedReward(null)} disabled={isRedeeming} className="flex-1 py-3 bg-[#F2EDE8] text-[#4A3728] text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60">Cancel</button>
              <button onClick={handleRedeem} disabled={isRedeeming} className="flex-1 py-3 bg-[#C8602A] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all disabled:opacity-60">{isRedeeming ? 'Redeeming…' : 'Redeem'}</button>
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
              className="w-full py-3.5 bg-[#1A1208] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all"
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
