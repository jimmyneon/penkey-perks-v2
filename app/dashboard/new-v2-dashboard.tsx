'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActiveVouchers, getNextRewardThreshold } from '@/lib/supabase/queries'
import { useBeanBalanceRealtime } from '@/hooks/use-bean-balance-realtime'
import { FlipNumber } from '@/components/ui/flip-number'
import { BeanModal } from '@/components/bean-toast'
import { MaxBeansModal } from '@/components/max-beans-modal'
import { QrCode, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCodeLib from 'qrcode'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { BottomNav } from '@/components/bottom-nav'
import { BrushUnderline } from '@/components/ui/brush-underline'
import { GiftIcon } from '@/components/ui/gift-icon'
import { StampAnimation } from '@/components/stamp-animation'
import { motion } from 'framer-motion'

// Generate consistent random values for each stamp index
const getStampVariations = (index: number) => {
  const seed = index * 12345
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000
    const r = x - Math.floor(x)
    return min + r * (max - min)
  }
  return {
    rotation: random(-12, 12),
    offsetX: random(-4, 4),
    offsetY: random(-4, 4),
    scale: random(0.95, 1.05),
  }
}

// Cache variations for each stamp index
const stampVariationsCache: Record<number, ReturnType<typeof getStampVariations>> = {}

interface BeanBalance {
  current_beans: number
  lifetime_beans: number
  visit_count: number
  last_visit_at: string | null
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function NewV2Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  const [showVoucherSheet, setShowVoucherSheet] = useState(false)
  const [showVoucherQR, setShowVoucherQR] = useState(false)
  const [showBeansPanel, setShowBeansPanel] = useState(false)
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)
  const [voucherQrCode, setVoucherQrCode] = useState('')
  const [mounted, setMounted] = useState(false)
  const [nextReward, setNextReward] = useState<any>(null)
  const [modalClosed, setModalClosed] = useState(false)
  const [triggerAnimation, setTriggerAnimation] = useState(false)
  const [displayedBeanBalance, setDisplayedBeanBalance] = useState<BeanBalance | null>(null)
  const [showBeanModal, setShowBeanModal] = useState(false)
  const [showMaxBeansModal, setShowMaxBeansModal] = useState(false)
  const [voucherTemplates, setVoucherTemplates] = useState<any[]>([])
  const [showStampAnimation, setShowStampAnimation] = useState(false)
  const [newlyStampedIndex, setNewlyStampedIndex] = useState<number | null>(null)
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null)
  const [cardShake, setCardShake] = useState(false)
  const [displayedBeanCount, setDisplayedBeanCount] = useState(0)
  const animationTriggeredRef = useRef(false)
  const lastClosedBeansRef = useRef(-1) // -1 = not yet initialized
  const stampGridRef = useRef<HTMLDivElement>(null)


  // Real-time bean balance (disabled when showing QR code to avoid animation conflicts)
  const { beanBalance, beansAwarded, beanDescription, maxBeansReached, maxBeansMessage } = useBeanBalanceRealtime(user?.id || null, showVoucherQR)

  // Initialize + keep displayed balance in sync when modal/animation not active
  useEffect(() => {
    if (!beanBalance) return
    // Initialize the ref on first load
    if (lastClosedBeansRef.current === -1) {
      lastClosedBeansRef.current = beanBalance.current_beans
    }
    if (!showBeanModal && !animationTriggeredRef.current) {
      setDisplayedBeanBalance(beanBalance)
      setDisplayedBeanCount(beanBalance.current_beans)
      setLoading(false)
    } else if (!showBeanModal && animationTriggeredRef.current) {
      setDisplayedBeanBalance(beanBalance)
      setLoading(false)
    }
  }, [beanBalance, showBeanModal])

  // Show modal when beans are awarded
  useEffect(() => {
    if (beansAwarded > 0) {
      setModalClosed(false)
      setShowBeanModal(true)
    }
  }, [beansAwarded])

  // Trigger stamp animation when panel opens
  useEffect(() => {
    console.log('[Animation Trigger] START - showBeansPanel:', showBeansPanel, 'animationTriggeredRef.current:', animationTriggeredRef.current, 'beanBalance:', beanBalance)

    if (!showBeansPanel) {
      console.log('[Animation Trigger] Panel closed, resetting')
      animationTriggeredRef.current = false
      setShowStampAnimation(false)
      return
    }

    if (animationTriggeredRef.current) {
      console.log('[Animation Trigger] Already triggered, skipping')
      return
    }

    const currentBeans = beanBalance?.current_beans ?? displayedBeanBalance?.current_beans ?? 0
    console.log('[Animation Trigger] currentBeans:', currentBeans)

    console.log('[Animation Trigger] === TRIGGERING ANIMATION ===')
    animationTriggeredRef.current = true
    setDisplayedBeanCount(currentBeans - 1)

    console.log('[Animation Trigger] creating timer')
    const timer = setTimeout(() => {
      console.log('[Animation Trigger] timer fired')
      setNewlyStampedIndex(currentBeans - 1)

      const rect = stampGridRef.current?.getBoundingClientRect()
      console.log('[Animation Trigger] stampGridRef.current:', stampGridRef.current, 'rect:', rect)
      if (rect) {
        setTargetPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        console.log('[Animation Trigger] Target position set:', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      } else {
        console.log('[Animation Trigger] NO RECT - using fallback')
      }

      console.log('[Animation Trigger] === SETTING showStampAnimation TO TRUE ===')
      setShowStampAnimation(true)

      setTimeout(() => {
        console.log('[Animation Trigger] Card shake')
        setCardShake(true)
        setTimeout(() => setCardShake(false), 100)
      }, 400)
    }, 500)
    return () => {
      console.log('[Animation Trigger] Cleanup timer')
      clearTimeout(timer)
    }
  }, [showBeansPanel, beanBalance])

  // Update displayed bean count after animation completes
  useEffect(() => {
    if (!showStampAnimation && newlyStampedIndex !== null) {
      const currentBeans = displayedBeanBalance?.current_beans || beanBalance?.current_beans || 0
      setDisplayedBeanCount(currentBeans)
      setNewlyStampedIndex(null)
    }
  }, [showStampAnimation, newlyStampedIndex, displayedBeanBalance, beanBalance])

  // Show modal when max beans reached
  useEffect(() => {
    if (maxBeansReached) {
      setShowMaxBeansModal(true)
    }
  }, [maxBeansReached])

  // Trigger bean animation after modal is closed
  const handleBeanModalClose = () => {
    setShowBeanModal(false)
    setModalClosed(true)
    setTriggerAnimation(true)
    // Update displayed balance to show the new value
    if (beanBalance) {
      setDisplayedBeanBalance(beanBalance)
    }
    // Reset animation flag after animation completes
    setTimeout(() => {
      setTriggerAnimation(false)
    }, 1000)
  }

  // Handle max beans modal close
  const handleMaxBeansModalClose = () => {
    setShowMaxBeansModal(false)
  }

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  // Load next reward from database
  useEffect(() => {
    if (beanBalance) {
      getNextRewardThreshold(beanBalance.current_beans).then(setNextReward)
    }
  }, [beanBalance])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      setUser(authUser)

      // Load user profile
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()
        setProfile(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
      }

      // Load vouchers - use sample data if table doesn't exist
      try {
        const userVouchers = await getActiveVouchers(authUser.id)
        setVouchers(userVouchers)
      } catch (error) {
        setVouchers([])
      }

      // Load voucher templates for journey display
      try {
        const { data: templates } = await supabase
          .from('voucher_templates')
          .select('*')
          .order('bean_threshold', { ascending: true })
        setVoucherTemplates(templates || [])
      } catch (error) {
        console.error('Error loading voucher templates:', error)
        setVoucherTemplates([])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const generateVoucherQRCode = async (voucher: any) => {
    try {
      const qrData = JSON.stringify({
        type: 'voucher',
        id: voucher.id,
        user_id: user?.id,
        template_id: voucher.voucher_template_id,
        timestamp: Date.now(),
      })
      const url = await QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2C3E50',
          light: '#FFFEF7',
        },
      })
      setVoucherQrCode(url)
    } catch (error) {
      console.error('Error generating voucher QR code:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F1EA' }}>
        <img src="/logo.webp" alt="Penkey Perks" className="w-32 h-32 object-contain opacity-80" />
      </div>
    )
  }

  const currentBeans = displayedBeanBalance?.current_beans || beanBalance?.current_beans || 0

  // Stamp card config — next milestone from current beans
  const STAMP_MILESTONES = [2, 8, 15, 25]
  const nextMilestone = STAMP_MILESTONES.find(m => m > currentBeans) ?? 8
  const prevMilestoneIndex = STAMP_MILESTONES.findIndex(m => m > currentBeans) - 1
  const prevMilestone = prevMilestoneIndex >= 0 ? STAMP_MILESTONES[prevMilestoneIndex] : 0
  const stampBeansNeeded = Math.max(0, nextMilestone - currentBeans)
  
  // Calculate progress percentage between milestones
  const progressRange = nextMilestone - prevMilestone
  const progressInRange = currentBeans - prevMilestone
  const progress = progressRange > 0 ? (progressInRange / progressRange) * 100 : 0
  // Show stamps for the current milestone cycle
  const fullName = profile?.name || user?.user_metadata?.first_name || user?.user_metadata?.name || 'there'
  const firstName = fullName.split(' ')[0].charAt(0).toUpperCase() + fullName.split(' ')[0].slice(1).toLowerCase()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        <div className="px-5 pt-10 pb-28 space-y-5">

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between">
            {/* Left: greeting */}
            <div className="flex-1">
              <p className="text-[24px] font-bold leading-tight" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
                {mounted ? getGreeting() : 'Hello'},{' '}
                <img
                  src="/image-assets/stamps/heart.svg"
                  alt=""
                  className="inline-block w-5 h-5 object-contain align-middle"
                  style={{ marginBottom: '2px', animation: 'heartPulse 1.2s ease-in-out 3' }}
                />
              </p>
              <h1 className="text-[72px] font-bold leading-none tracking-tight mt-0.5" style={{ color: '#24364B' }}>
                {firstName}
              </h1>
              <p className="text-[13px] font-medium mt-2 leading-snug" style={{ color: '#8A96A0' }}>
                Welcome to Penkey Perks
              </p>
            </div>
            {/* Right: Cup Illy image */}
            <div className="flex-shrink-0">
              <img
                src="/cupilli.webp"
                alt="Cup Illy"
                className="w-40 h-40 object-contain"
              />
            </div>
          </div>

          {/* ── YOUR PROGRESS ── */}
          <div
            className="rounded-[18px] overflow-hidden active:scale-[0.985] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #2B3E52 0%, #24364A 100%)', boxShadow: '0 4px 20px rgba(36,54,75,0.15)' }}
          >
            <div className="flex">
              {/* Left: bean balance */}
              <div
                className="flex-1 p-4 pr-3 flex flex-col justify-between relative cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setShowBeansPanel(true)}
              >
                {/* Bean pile background */}
                <img src="/beanpile.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" style={{ transform: 'scale(0.8)' }} />
                
                <div className="relative z-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#F0EDE5' }}>
                    YOUR BEAN BALANCE
                  </p>
                  <div className="mb-2">
                    <div className={`flex items-baseline gap-2 mb-1 ${triggerAnimation ? 'animate-bean-pop' : ''}`}>
                      <FlipNumber value={currentBeans} className={`text-[56px] font-extrabold leading-none ${triggerAnimation ? 'animate-bean-glow' : ''}`} style={{ color: '#F0EDE5' }} />
                    </div>
                    <p className="text-[14px] font-semibold" style={{ color: '#F0EDE5' }}>{currentBeans === 1 ? 'bean' : 'beans'}</p>
                    <img src="/stroke.webp" alt="" className="w-24 h-2 object-contain mt-1 opacity-60" style={{ marginLeft: '-12px' }} />
                  </div>
                </div>
                <Link href="/rewards" className="inline-flex items-center gap-1 text-[11px] font-semibold relative z-10" style={{ color: '#F28A2E' }} onClick={(e) => e.stopPropagation()}>
                  How it works
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Right: next reward */}
              <div
                className="flex-1 p-4 pl-3 flex flex-col cursor-pointer active:scale-[0.98] transition-all"
                style={{ borderLeft: '1px solid rgba(240,237,229,0.12)' }}
                onClick={() => setShowRewardsPanel(true)}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#F0EDE5' }}>
                  NEXT REWARD
                </p>
                <div className="flex flex-col gap-2 mb-2">
                  <p className="text-[18px] font-bold leading-tight" style={{ color: '#F28A2E' }}>
                    {nextReward?.reward || 'Loading...'}
                  </p>
                  <div className="flex items-center justify-center overflow-hidden">
                    {nextReward?.icon_url || nextReward?.image_url ? (
                      <img
                        src={nextReward?.icon_url || nextReward?.image_url}
                        alt={nextReward.reward}
                        className="w-56 h-56 object-contain scale-150"
                      />
                    ) : null}
                  </div>
                </div>
                <p className="text-[10px] font-medium mb-1.5" style={{ color: '#F0EDE5' }}>
                  {nextReward?.beansNeeded || 0} beans away
                </p>
                <div className="mb-1.5">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(240,237,229,0.2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: '#F28A2E'
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-medium" style={{ color: '#F0EDE5' }}>
                  {currentBeans} - 25 beans
                </p>
              </div>
            </div>
          </div>

          {/* ── VOUCHERS — only shows when real vouchers exist ── */}
          {vouchers.length > 0 && (
            <div
              className="rounded-[18px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.985] transition-all duration-200"
              style={{ backgroundColor: '#F4EFE7', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #E8E2D8' }}
              onClick={() => setShowVoucherSheet(true)}
            >
              <div className="w-28 h-28 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#FFF0E4' }}>
                <img
                  src="/vouchers/voucher.png"
                  alt="Vouchers"
                  className="w-[85%] h-[85%] object-contain scale-[150%]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold leading-tight" style={{ color: '#24364B' }}>
                  You have {vouchers.length} {vouchers.length === 1 ? 'voucher' : 'vouchers'} ready
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: '#5A6A7A' }}>Tap to view and redeem</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4AFA8" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          )}

          {/* ── HOW IT WORKS — only shown for new users ── */}
          {(beanBalance?.visit_count ?? 0) < 2 && (
            <div className="rounded-[18px] p-5" style={{ backgroundColor: '#F8F5EF', boxShadow: '0 2px 14px rgba(36,54,75,0.08)', border: '1px solid #E8E2D8' }}>
              <h3 className="text-[16px] font-extrabold mb-4" style={{ color: '#24364B' }}>How it works</h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { img: '/howworks/1.webp', label: 'Visit Penkey', num: 1 },
                  { img: '/howworks/2.webp', label: 'Show QR code', num: 2 },
                  { img: '/howworks/3.webp', label: 'Earn beans', num: 3 },
                  { img: '/howworks/4.webp', label: 'Enjoy rewards', num: 4 },
                ].map((step) => (
                  <div key={step.img} className="text-center">
                    <div className="w-28 h-28 rounded-full mx-auto mb-2 flex items-center justify-center relative" style={{ backgroundColor: '#FFF0E4' }}>
                      <img src={step.img} alt={step.label} className="w-24 h-24 object-contain" />
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
              <Link
                href="/rewards"
                className="inline-flex items-center gap-2 text-[12px] font-semibold"
                style={{ color: '#E07A3A' }}
              >
                <img src="/heart.webp" alt="" className="w-4 h-4 object-contain" />
                View all rewards
              </Link>
            </div>
          )}

          {/* ── THANKS FOR SUPPORTING LOCAL ── */}
          <div className="rounded-[18px] overflow-hidden" style={{ backgroundColor: '#F0F9FF', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #E0F2FE' }}>
            <div className="flex items-center p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <img src="/heart.webp" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold" style={{ color: '#24364B' }}>Thanks for supporting local</p>
                  <p className="text-xs" style={{ color: '#5A6A7A' }}>Every visit to Penkey helps our community thrive</p>
                </div>
              </div>
              <div className="w-32 h-32 flex-shrink-0">
                <img src="/local.webp" alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

        </div>

        <BottomNav />
      </div>

      {/* ── VOUCHER PICKER BOTTOM SHEET ── */}
      <BottomSheet
        open={showVoucherSheet}
        onOpenChange={(open) => {
          setShowVoucherSheet(open)
          if (!open) setSelectedVoucher(null)
        }}
        showCloseButton={false}
      >
        <div className="px-5 pb-8">
          <p className="text-[24px] font-bold leading-tight mb-1" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
            Your Vouchers
          </p>
          <p className="text-[13px] mb-5" style={{ color: '#8A96A0' }}>
            Tap a voucher to show your QR code
          </p>
          <div className="flex flex-col gap-3">
            {vouchers.map((voucher) => (
              <button
                key={voucher.id}
                className="w-full text-left rounded-[16px] p-4 active:scale-[0.98] transition-all flex items-center gap-4"
                style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8', boxShadow: '0 2px 8px rgba(36,54,75,0.06)' }}
                onClick={() => {
                  setSelectedVoucher(voucher)
                  setVoucherQrCode('')
                  setShowVoucherSheet(false)
                  setShowVoucherQR(true)
                  generateVoucherQRCode(voucher)
                }}
              >
                <div className="w-28 h-28 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#FFF0E4' }}>
                  {voucher.template?.icon_url || voucher.template?.image_url ? (
                    <img
                      src={voucher.template?.icon_url || voucher.template?.image_url}
                      alt={voucher.template.name}
                      className="w-full h-full object-contain p-2 scale-[150%]"
                    />
                  ) : (
                    <img src="/coffeecup.webp" alt="" className="w-14 h-14 object-contain scale-[150%]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold leading-tight truncate" style={{ color: '#24364B' }}>
                    {voucher.template?.name || 'Reward'}
                  </p>
                  <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#5A6A7A' }}>
                    {voucher.template?.description || ''}
                  </p>
                  {voucher.expires_at && (
                    <p className="text-[11px] mt-1" style={{ color: '#A89080' }}>
                      Expires {new Date(voucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4AFA8" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── VOUCHER QR CODE BOTTOM SHEET ── */}
      <BottomSheet
        open={showVoucherQR}
        onOpenChange={(open) => {
          setShowVoucherQR(open)
          if (!open) {
            setSelectedVoucher(null)
            setVoucherQrCode('')
          }
        }}
        showCloseButton={false}
      >
        <div className="flex flex-col items-center px-5 pb-8">
          <div className="text-center mb-5">
            <p className="text-[24px] font-bold leading-tight" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
              {selectedVoucher?.template?.name || 'Your Voucher'}
            </p>
            <p className="text-[13px] mt-1" style={{ color: '#8A96A0' }}>
              Show this to staff to redeem
            </p>
          </div>

          <div
            className="rounded-[24px] p-6 flex items-center justify-center mb-4"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 20px rgba(36,54,75,0.12)', border: '1px solid #E8E2D8' }}
          >
            {voucherQrCode ? (
              <img src={voucherQrCode} alt="Voucher QR Code" className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 rounded-[20px] flex items-center justify-center" style={{ backgroundColor: '#F4EFE7' }}>
                <QrCode className="w-16 h-16" style={{ color: '#C4AFA8' }} />
              </div>
            )}
          </div>

          {selectedVoucher?.expires_at && (
            <p className="text-[12px] mb-4" style={{ color: '#A89080' }}>
              Expires {new Date(selectedVoucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {vouchers.length > 1 && (
            <button
              onClick={() => {
                setShowVoucherQR(false)
                setSelectedVoucher(null)
                setVoucherQrCode('')
                setTimeout(() => setShowVoucherSheet(true), 200)
              }}
              className="text-[13px] font-semibold mb-3"
              style={{ color: '#F28A2E' }}
            >
              ← View other vouchers
            </button>
          )}

          <div className="flex items-center gap-2">
            <img src="/heart.webp" alt="" className="w-4 h-4 object-contain" />
            <p className="text-[12px]" style={{ color: '#8A96A0' }}>Swipe down to close</p>
          </div>
        </div>
      </BottomSheet>

      {/* Beans Panel Dialog - Stamps Only */}
      <Dialog open={showBeansPanel} onOpenChange={setShowBeansPanel}>
        <DialogContent className="sm:max-w-md rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] p-0 overflow-hidden border-0">
          <DialogTitle className="sr-only">Your Stamp Card</DialogTitle>
          <DialogDescription className="sr-only">View your bean collection and stamp card progress</DialogDescription>
          <div
            className="rounded-[24px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2B3E52 0%, #24364A 100%)' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#F0EDE5' }}>
                  YOUR STAMP CARD
                </p>
                <button onClick={() => setShowBeansPanel(false)} className="text-[#F0EDE5]/50 hover:text-[#F0EDE5] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Large stamps grid - 25 stamps */}
              <motion.div
                ref={stampGridRef}
                className="grid grid-cols-5 gap-3 mb-6"
                animate={cardShake ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] } : {}}
                transition={{ duration: 0.1 }}
              >
                {Array.from({ length: 25 }).map((_, i) => {
                  const filled = i < displayedBeanCount
                  // Get consistent variations for this stamp index
                  if (!stampVariationsCache[i]) {
                    stampVariationsCache[i] = getStampVariations(i)
                  }
                  const variations = stampVariationsCache[i]
                  return (
                    <div
                      key={i}
                      data-stamp-slot
                      className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden relative"
                      style={{
                        backgroundColor: 'transparent',
                        border: filled ? 'none' : '2px dashed #F0EDE5',
                      }}
                    >
                      {filled ? (
                        <img
                          src="/image-assets/stamps/stamp.png"
                          alt="Stamp"
                          className="w-[140%] h-[140%] object-cover -m-3"
                          style={{
                            transform: `rotate(${variations.rotation}deg) translate(${variations.offsetX}px, ${variations.offsetY}px) scale(${variations.scale})`,
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-semibold" style={{ color: '#F0EDE5', opacity: 0.5 }}>
                          stamp
                        </span>
                      )}
                    </div>
                  )
                })}
              </motion.div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[32px] font-bold leading-tight" style={{ color: '#F0EDE5' }}>
                    {stampBeansNeeded} beans to your next treat
                  </p>
                  <div className="mt-2">
                    <BrushUnderline className="text-[#F28A2E] w-24" />
                  </div>
                  <p className="text-[13px] mt-2" style={{ color: '#F0EDE5' }}>
                    {nextMilestone} beans = a reward
                  </p>
                </div>

                {/* Right: next reward */}
                <div
                  className="w-[130px] flex-shrink-0 flex flex-col items-center justify-center p-4 gap-2"
                  style={{ borderLeft: '1px solid rgba(240,237,229,0.12)' }}
                >
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#F8F5EF', border: '1.5px solid #E8E2D8' }}
                  >
                    {nextReward?.icon_url || nextReward?.image_url ? (
                      <img
                        src={nextReward?.icon_url || nextReward?.image_url}
                        alt={nextReward.reward}
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      <GiftIcon className="w-20 h-20 object-contain" style={{ transform: 'scale(1.5)' }} />
                    )}
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-center" style={{ color: '#F8F5EF' }}>
                    NEXT REWARD
                  </p>
                  <p className="text-[12px] font-medium text-center leading-snug" style={{ color: '#F8F5EF' }}>
                    {nextReward?.reward || 'Loading...'}
                  </p>
                  <p className="text-[10px] text-center leading-snug" style={{ color: '#F8F5EF' }}>
                    {nextMilestone} beans
                  </p>
                </div>
              </div>

              {/* Balance info */}
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(240,237,229,0.12)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1" style={{ color: '#F0EDE5' }}>
                      LIFETIME BEANS
                    </p>
                    <p className="text-[28px] font-bold leading-none" style={{ color: '#F0EDE5' }}>
                      {beanBalance?.lifetime_beans || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1" style={{ color: '#F0EDE5' }}>
                      VISITS
                    </p>
                    <p className="text-[28px] font-bold leading-none" style={{ color: '#F0EDE5' }}>
                      {beanBalance?.visit_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stamp animation - outside Dialog to avoid clipping */}
      <StampAnimation
        key={newlyStampedIndex ?? 'stamp'}
        show={showStampAnimation}
        targetPosition={targetPosition || undefined}
        onComplete={() => setShowStampAnimation(false)}
      />

      {/* Rewards Panel Dialog - Full Screen */}
      <Dialog open={showRewardsPanel} onOpenChange={setShowRewardsPanel}>
        <DialogContent className="max-w-md sm:max-w-md w-full h-full sm:h-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg rounded-none sm:max-h-[90vh] max-h-[100dvh] data-[state=open]:!animate-in data-[state=open]:!fade-in-0 data-[state=closed]:!animate-out data-[state=closed]:!fade-out-0 data-[state=closed]:!zoom-out-95 data-[state=open]:!zoom-in-95 p-0 overflow-hidden border-0">
          <div className="p-5 overflow-y-auto h-full" style={{ background: 'linear-gradient(160deg, #2B3E52 0%, #1e2d3d 100%)' }}>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(240,237,229,0.7)' }}>YOUR JOURNEY</p>
                <button onClick={() => setShowRewardsPanel(false)} className="text-[#F0EDE5]/50 hover:text-[#F0EDE5] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-5">
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[32px] font-extrabold leading-none" style={{ color: '#F28A2E' }}>{currentBeans}</span>
                  <span className="text-[18px] font-bold" style={{ color: '#F0EDE5' }}>{currentBeans === 1 ? 'bean' : 'beans'}</span>
                </div>
                <p className="text-[12px] mt-1" style={{ color: 'rgba(240,237,229,0.55)' }}>
                  {stampBeansNeeded} beans away from your next reward
                </p>
              </div>

              {/* Journey list */}
              {(() => {
                const milestones = voucherTemplates.map(t => ({
                  beans: t.bean_threshold,
                  name: t.name,
                  category: t.category,
                  description: t.description,
                  image_url: t.image_url,
                }))

                // Map category to icon (fallback)
                const getIconForCategory = (category: string) => {
                  switch(category) {
                    case 'enhancer': return 'syrup'
                    case 'coffee': return 'coffee'
                    case 'major': return 'cookie'
                    case 'wheel_spin': return 'gift'
                    default: return 'coffee'
                  }
                }
                
                const CX = 28
                const STD_H = 80
                const NEXT_H = 114
                const GAP = 10
                const nextIdx = milestones.findIndex((r, i, arr) =>
                  currentBeans < r.beans && (i === 0 || currentBeans >= arr[i - 1].beans)
                )
                const rowHeights = milestones.map((_, i) => i === nextIdx ? NEXT_H : STD_H)
                let totalH = 0
                const circleCYs: number[] = []
                rowHeights.forEach((h, i) => {
                  circleCYs.push(totalH + h / 2)
                  totalH += h + (i < rowHeights.length - 1 ? GAP : 0)
                })
                let pathD = `M ${CX} ${circleCYs[0]}`
                for (let i = 1; i < circleCYs.length; i++) {
                  const midY = (circleCYs[i - 1] + circleCYs[i]) / 2
                  const bx = i % 2 === 1 ? CX + 16 : CX - 16
                  pathD += ` Q ${bx} ${midY} ${CX} ${circleCYs[i]}`
                }
                return (
              <div className="relative">
                <svg className="absolute left-0 top-0 pointer-events-none" width="56" height={totalH} style={{ zIndex: 0 }}>
                  <path d={pathD} fill="none" stroke="#F28A2E" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" opacity="0.55" />
                </svg>

                <div>
                  {milestones.map((reward, index, arr) => {
                    const unlocked = currentBeans >= reward.beans
                    const isNext = !unlocked && (index === 0 || currentBeans >= arr[index - 1].beans)
                    const beansToGo = reward.beans - currentBeans
                    const rowH = rowHeights[index]
                    const icon = getIconForCategory(reward.category)

                    return (
                      <div
                        key={reward.beans}
                        className="flex items-center gap-3 relative"
                        style={{ height: rowH, marginTop: index > 0 ? GAP : 0 }}>

                        {/* Circle icon */}
                        <div className="relative flex-shrink-0 z-10">
                          <div
                            className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                            style={{
                              backgroundColor: '#1a2b3c',
                              border: isNext
                                ? '2px solid #F28A2E'
                                : unlocked
                                ? '2px solid rgba(242,138,46,0.4)'
                                : '2px solid rgba(240,237,229,0.15)',
                              boxShadow: isNext ? '0 0 0 4px rgba(242,138,46,0.18)' : 'none',
                              opacity: (!unlocked && !isNext) ? 0.5 : 1,
                            }}
                          >
                            {reward.image_url ? (
                              <img
                                src={reward.image_url}
                                alt={reward.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <>
                                {icon === 'syrup' && (
                                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={unlocked ? '#F28A2E' : 'rgba(240,237,229,0.6)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 3h8v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V3z" />
                                    <path d="M12 9v3" />
                                    <path d="M9 12h6" />
                                    <rect x="7" y="12" width="10" height="9" rx="2" />
                                  </svg>
                                )}
                                {icon === 'coffee' && (
                                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={isNext ? '#F28A2E' : unlocked ? '#F28A2E' : 'rgba(240,237,229,0.6)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
                                    <line x1="6" y1="2" x2="6" y2="5" />
                                    <line x1="10" y1="2" x2="10" y2="5" />
                                    <line x1="14" y1="2" x2="14" y2="5" />
                                  </svg>
                                )}
                                {icon === 'cookie' && (
                                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,229,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                    <circle cx="8" cy="9" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                    <circle cx="15" cy="9" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                    <circle cx="9" cy="14.5" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                    <circle cx="14.5" cy="14" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                  </svg>
                                )}
                                {icon === 'gift' && (
                                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,229,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="8" width="18" height="12" rx="2" />
                                    <path d="M12 8V3" />
                                    <path d="M12 3H8" />
                                    <path d="M12 3H16" />
                                    <path d="M12 8v12" />
                                  </svg>
                                )}
                              </>
                            )}
                          </div>

                          {/* Tick badge for unlocked */}
                          {unlocked && (
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: '#F28A2E', border: '2px solid #1e2d3d' }}
                            >
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Card */}
                        <div
                          className="flex-1 rounded-[14px] px-3 py-3"
                          style={{
                            backgroundColor: isNext ? 'rgba(242,138,46,0.08)' : 'rgba(240,237,229,0.05)',
                            border: isNext
                              ? '1.5px solid #F28A2E'
                              : '1px solid rgba(240,237,229,0.1)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold leading-tight" style={{ color: unlocked || isNext ? '#F0EDE5' : 'rgba(240,237,229,0.45)' }}>
                                {reward.name}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(240,237,229,0.45)' }}>
                                {reward.beans} beans
                              </p>

                              {/* Progress bar for current target */}
                              {isNext && (
                                <div className="mt-2">
                                  <p className="text-[11px] mb-1.5" style={{ color: 'rgba(240,237,229,0.6)' }}>
                                    {currentBeans} / {reward.beans} beans
                                  </p>
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(240,237,229,0.15)' }}>
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min((currentBeans / reward.beans) * 100, 100)}%`,
                                        backgroundColor: '#F28A2E',
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right badges */}
                            <div className="flex-shrink-0">
                              {unlocked && (
                                <span
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                  style={{ backgroundColor: 'rgba(240,237,229,0.12)', color: '#F0EDE5' }}
                                >
                                  Unlocked
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#F28A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 6l3 3 5-5" />
                                  </svg>
                                </span>
                              )}
                              {isNext && (
                                <span
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                  style={{ backgroundColor: '#F28A2E', color: 'white' }}
                                >
                                  Next reward
                                </span>
                              )}
                              {!unlocked && !isNext && (
                                <span
                                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                                  style={{ backgroundColor: 'rgba(240,237,229,0.08)', color: 'rgba(240,237,229,0.5)' }}
                                >
                                  {beansToGo} beans to go
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
                )
              })()}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowRewardsPanel(false); router.push('/rewards') }}
                  className="flex-1 h-12 text-white text-sm font-bold rounded-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#F28A2E', boxShadow: '0 4px 16px rgba(242,138,46,0.35)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  View all rewards
                </button>
              </div>

              {/* Footer */}
              <div className="mt-5 text-center">
                <p className="text-[11px] italic" style={{ color: 'rgba(240,237,229,0.35)' }}>
                  ♡ Thanks for supporting local ♡
                </p>
              </div>

        </div>
      </DialogContent>
    </Dialog>

      {/* Bean award modal */}
      <BeanModal
        show={showBeanModal}
        beansAwarded={beansAwarded}
        description={beanDescription}
        onClose={handleBeanModalClose}
      />

      {/* Max beans modal */}
      <MaxBeansModal
        show={showMaxBeansModal}
        message={maxBeansMessage}
        onClose={handleMaxBeansModalClose}
        onConvertToVouchers={() => setShowMaxBeansModal(false)}
      />
    </div>
  )
}

async function createBeanBalance(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bean_balances')
    .insert({
      user_id: userId,
      current_beans: 0,
      lifetime_beans: 0,
      visit_count: 0,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating bean balance:', error)
    return null
  }

  return data
}
