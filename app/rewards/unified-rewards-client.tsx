'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Gift, CheckCircle2, Clock, Star, QrCode, ShoppingBag, ScanLine, Circle, Unlock, ChevronRight as ChevronRight2, Sparkles, Coffee } from 'lucide-react'
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
  const [voucherTemplates, setVoucherTemplates] = useState<any[]>([])

  // Lock body scroll when QR dialog is open
  useEffect(() => {
    if (selectedEarnedReward) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedEarnedReward])

  // Fetch voucher templates from database
  useEffect(() => {
    const fetchVoucherTemplates = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('voucher_templates')
          .select('*')
          .order('bean_threshold', { ascending: true })
        
        if (error) {
          console.error('Error fetching voucher templates:', error)
        } else {
          setVoucherTemplates(data || [])
        }
      } catch (error) {
        console.error('Error fetching voucher templates:', error)
      }
    }
    
    fetchVoucherTemplates()
  }, [])

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

  // Map voucher templates to display format
  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'enhancer': return <Sparkles className="w-4 h-4" />
      case 'coffee': return <Coffee className="w-4 h-4" />
      case 'major': return <ShoppingBag className="w-4 h-4" />
      default: return <Gift className="w-4 h-4" />
    }
  }

  const getColorForCategory = (category: string) => {
    switch (category) {
      case 'enhancer': return '#E07A3A'
      case 'coffee': return '#2C3E50'
      case 'major': return '#1C2B3A'
      default: return '#3D5A73'
    }
  }

  const rewardTiers = voucherTemplates.map(template => ({
    beans: template.bean_threshold,
    icon: getIconForCategory(template.category),
    label: template.name,
    sub: template.description,
    color: getColorForCategory(template.category),
  }))

  return (
    <div className="min-h-screen bg-[#F9F7F2]">

      {/* ── HEADER ── */}
      <div className="px-5 pt-14 pb-5">
        <p className="text-[24px] font-bold leading-tight text-[#E07A3A] font-cursive">
          Your Rewards{' '}
          <img src="/heart.png" alt="" className="inline-block w-5 h-5 object-contain align-middle mb-0.5" />
        </p>
        <h1 className="text-[72px] font-bold leading-none tracking-tight mt-0.5 text-[#1C2B3A]">Rewards</h1>
        <p className="text-[13px] font-medium mt-1.5 leading-snug text-[#8A96A0]">
          Collect beans, unlock treats
        </p>
      </div>

      <main className="px-5 pb-28 pt-4 space-y-5">

        {/* ── BEAN STAMP CARD ── */}
        <section>
          <div className="rounded-[22px] p-5 bg-[#2C3E50] shadow-[0_4px_20px_rgba(28,43,58,0.22)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1 text-white/50">YOUR BEANS</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[48px] font-extrabold leading-none text-white">{currentPoints}</span>
                  <span className="text-[14px] font-semibold text-white/50">collected</span>
                </div>
              </div>
              <div className="relative">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" />
                  <circle cx="36" cy="36" r="30" stroke="#E07A3A" strokeWidth="6" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - nextProgress / 100)}
                    style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[13px] font-extrabold leading-none text-white">{Math.round(nextProgress)}%</span>
                </div>
              </div>
            </div>

            {/* Stamp dots — 8 per row, up to 25 */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 25 }).map((_, i) => {
                  const filled = i < currentPoints
                  const isMilestone = [1, 7, 14, 24].includes(i) // 0-indexed milestones at 2,8,15,25
                  return (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: filled ? '#F0EDE5' : 'rgba(255,255,255,0.12)',
                        border: filled ? '2px solid #E0D8CC' : '2px dashed #F0EDE5',
                        boxShadow: filled ? '0 2px 6px rgba(224,122,58,0.40)' : 'none',
                        transform: filled ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {filled ? (
                        <img src="/bean.png" alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <img src="/bean.png" alt="" className="w-5 h-5 object-contain brightness-[0.4] grayscale-[0.5] opacity-60" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-[13px] font-medium leading-snug text-white/60">
              {nextReward
                ? <><span className="font-bold text-[#E07A3A]">{Math.max(0, nextReward.points_required - currentPoints)} more</span> until your next reward</>
                : <span className="font-semibold text-white">All rewards unlocked — go redeem!</span>
              }
            </p>
          </div>
        </section>

        {/* ── READY TO USE ── */}
        {unlockedRewards.length > 0 && (
          <section>
            <p className="text-[13px] font-bold mb-2.5 px-1 text-[#1C2B3A]">Ready to use</p>
            <div className="space-y-2">
              {unlockedRewards.map(reward => (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className="w-full rounded-[18px] px-4 py-4 flex items-center gap-3.5 active:scale-[0.98] transition-all text-left bg-[#2C3E50] shadow-[0_4px_20px_rgba(28,43,58,0.25)]"
                >
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 bg-white/12">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-extrabold text-white leading-tight">{reward.name}</p>
                    <p className="text-[12px] mt-0.5 text-white/55">{reward.points_required} beans</p>
                  </div>
                  <span className="text-[11px] font-bold text-white px-3 py-1.5 rounded-full bg-[#E07A3A]">Use now</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── ACTIVE VOUCHERS ── */}
        {activeRewards.length > 0 && (
          <section>
            <p className="text-[13px] font-bold mb-2.5 px-1 text-[#1C2B3A]">In your wallet</p>
            <div className="space-y-2">
              {activeRewards.map(userReward => {
                const reward = userReward.rewards
                if (!reward) return null
                const expiringSoon = userReward.expires_at && getDaysUntil(userReward.expires_at) <= 3
                return (
                  <Link href={`/rewards/${userReward.id}`} key={userReward.id}>
                    <div className="bg-white rounded-[16px] px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(61,26,14,0.07)]"
                      style={{ border: expiringSoon ? '1.5px solid #FCA5A5' : '1.5px solid transparent' }}>
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: expiringSoon ? '#FEF2F2' : '#FDF0E6' }}>
                        <Gift className="w-5 h-5" style={{ color: expiringSoon ? '#EF4444' : '#E07A3A' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold leading-tight truncate text-[#1C2B3A]">{reward.name}</p>
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color: expiringSoon ? '#EF4444' : '#B08070' }}>{getExpiryText(userReward.expires_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#E07A3A]">
                        <QrCode className="w-3.5 h-3.5" />
                        Show
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── REWARD TIERS ── the full journey ── */}
        <section>
          <p className="text-[13px] font-bold mb-2.5 px-1 text-[#1C2B3A]">What you can earn</p>
          <div className="space-y-2.5">
            {rewardTiers.map((tier) => {
              const unlocked = currentPoints >= tier.beans
              const isNext = nextReward?.points_required === tier.beans
              return (
                <div
                  key={tier.beans}
                  className="rounded-[18px] px-4 py-4 flex items-center gap-4 transition-all"
                  style={{
                    backgroundColor: unlocked ? tier.color : 'white',
                    boxShadow: unlocked
                      ? `0 4px 16px rgba(28,43,58,0.22)`
                      : isNext
                        ? '0 2px 12px rgba(28,43,58,0.10), 0 0 0 2px rgba(224,122,58,0.30)'
                        : '0 2px 8px rgba(28,43,58,0.07)',
                  }}
                >
                  {/* Bean count bubble */}
                  <div
                    className="w-12 h-12 rounded-[14px] flex flex-col items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: unlocked ? 'rgba(255,255,255,0.15)' : '#F0F4F7',
                    }}
                  >
                    <span className="text-[18px] leading-none">{tier.icon}</span>
                    <span className="text-[9px] font-extrabold mt-0.5" style={{ color: unlocked ? 'rgba(255,255,255,0.7)' : '#8A9AAA' }}>
                      {tier.beans}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-extrabold leading-tight" style={{ color: unlocked ? 'white' : '#1C2B3A' }}>{tier.label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: unlocked ? 'rgba(255,255,255,0.65)' : '#7A8A9A' }}>{tier.sub}</p>
                  </div>
                  {unlocked ? (
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                  ) : isNext ? (
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(224,122,58,0.12)', color: '#E07A3A' }}>
                        {Math.max(0, tier.beans - currentPoints)} to go
                      </span>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-dashed border-[#E0D0C4]" />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section>
          <div className="rounded-[18px] p-5" style={{ backgroundColor: '#F8F5EF', boxShadow: '0 2px 14px rgba(36,54,75,0.08)', border: '1px solid #E8E2D8' }}>
            <h3 className="text-[16px] font-extrabold mb-4" style={{ color: '#24364B' }}>How it works</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { img: '/howworks/1.png', label: 'Visit Penkey', num: 1 },
                { img: '/howworks/2.png', label: 'Show QR code', num: 2 },
                { img: '/howworks/3.png', label: 'Earn beans', num: 3 },
                { img: '/howworks/4.png', label: 'Enjoy rewards', num: 4 },
              ].map((step) => (
                <div key={step.img} className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center relative" style={{ backgroundColor: '#FFF0E4' }}>
                    <img src={step.img} alt={step.label} className="w-32 h-32 object-contain" />
                    <div className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: '#F28A2E' }}>
                      {step.num}
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold leading-tight" style={{ color: '#24364B' }}>{step.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#5A6A7A' }}>
              The more you visit, the more rewards you unlock
            </p>
          </div>
        </section>

        {/* ── PAST REWARDS ── */}
        {historyRewards.length > 0 && (
          <section>
            <p className="text-[13px] font-bold mb-2.5 px-1 text-[#1C2B3A]">Previously used</p>
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
                    <div className={`bg-white rounded-[12px] px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all shadow-[0_1px_4px_rgba(61,26,14,0.06)] ${!isRedeemed ? 'opacity-40' : ''}`}>
                      {isRedeemed ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F0FAF4]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7A4A]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[#F2EDE8]">
                          <Clock className="w-3.5 h-3.5 text-[#B08070]" />
                        </div>
                      )}
                      <span className="flex-1 text-[12px] font-semibold truncate text-[#2C3E50]">{reward.name}</span>
                      <span className="text-[11px] text-[#B08070]">{displayDate}</span>
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
        <DialogContent className="max-w-md sm:max-w-md w-full h-full sm:h-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg rounded-none sm:max-h-[90vh] max-h-[100dvh] bg-[#FAF8F5] data-[state=open]:!animate-in data-[state=open]:!fade-in-0 data-[state=closed]:!animate-out data-[state=closed]:!fade-out-0 data-[state=closed]:!zoom-out-95 data-[state=open]:!zoom-in-95" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Redeem Reward?</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px]">{selectedReward?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1 flex-1 overflow-y-auto">
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
        <DialogContent className="max-w-md sm:max-w-md w-full h-full sm:h-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg rounded-none sm:max-h-[90vh] max-h-[100dvh] bg-[#FAF8F5] data-[state=open]:!animate-in data-[state=open]:!fade-in-0 data-[state=closed]:!animate-out data-[state=closed]:!fade-out-0 data-[state=closed]:!zoom-out-95 data-[state=open]:!zoom-in-95" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold text-center">{selectedEarnedReward?.rewards?.name}</DialogTitle>
            <DialogDescription className="text-[#9A7A6A] text-[13px] text-center">Show to staff to redeem</DialogDescription>
          </DialogHeader>
          {selectedEarnedReward?.status === 'active' && (
            <div className="space-y-3 pb-1 flex-1 overflow-y-auto">
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
        <DialogContent className="max-w-md sm:max-w-md w-full h-full sm:h-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg rounded-none sm:max-h-[90vh] max-h-[100dvh] bg-[#FAF8F5] data-[state=open]:!animate-in data-[state=open]:!fade-in-0 data-[state=closed]:!animate-out data-[state=closed]:!fade-out-0 data-[state=closed]:!zoom-out-95 data-[state=open]:!zoom-in-95" showCloseButton={true}>
          <div className="text-center space-y-4 py-2 flex-1 overflow-y-auto">
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
