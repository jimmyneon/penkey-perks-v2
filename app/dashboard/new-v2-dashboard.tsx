'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBeanBalance, getActiveVouchers, getUserBadges, getActiveCampaigns, getNextRewardThreshold } from '@/lib/supabase/queries'
import { Bell, Coffee, Gift, TrendingUp, QrCode, BarChart3, ChevronRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCodeLib from 'qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomNav } from '@/components/bottom-nav'
import { BrushUnderline } from '@/components/ui/brush-underline'
import { SparkLines } from '@/components/ui/spark-lines'
import { GiftIcon } from '@/components/ui/gift-icon'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function NewV2Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [beanBalance, setBeanBalance] = useState<any>(null)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [showQR, setShowQR] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  const [selectedFeatured, setSelectedFeatured] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showBeansPanel, setShowBeansPanel] = useState(false)
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)
  const [voucherQrCode, setVoucherQrCode] = useState('')

  useEffect(() => {
    loadData()
  }, [])

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

      // Load bean balance - use fallback if table doesn't exist
      try {
        let balance = await getBeanBalance(authUser.id)
        if (!balance) {
          balance = await createBeanBalance(authUser.id)
        }
        setBeanBalance(balance)
      } catch (error) {
        console.error('Error loading bean balance, using fallback:', error)
        setBeanBalance({ current_beans: 3, lifetime_beans: 15, visit_count: 5, last_visit_at: new Date().toISOString() })
      }

      // Load vouchers - use sample data if table doesn't exist
      try {
        const userVouchers = await getActiveVouchers(authUser.id)
        setVouchers(userVouchers)
      } catch (error) {
        console.error('Error loading vouchers, using sample data:', error)
        setVouchers([])
      }

      // Load badges - use sample data if table doesn't exist
      try {
        const userBadges = await getUserBadges(authUser.id)
        setBadges(userBadges)
      } catch (error) {
        console.error('Error loading badges, using sample data:', error)
        setBadges([])
      }

      // Load campaigns - use sample data if table doesn't exist
      try {
        const activeCampaigns = await getActiveCampaigns()
        setCampaigns(activeCampaigns)
      } catch (error) {
        console.error('Error loading campaigns, using sample data:', error)
        setCampaigns([])
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

  const generateQRCode = async () => {
    if (!user) return
    
    try {
      const qrData = JSON.stringify({
        type: 'customer',
        id: user.id,
        email: user.email,
        timestamp: Date.now(),
      })
      const url = await QRCodeLib.toDataURL(qrData)
      setQrCodeUrl(url)
      setShowQR(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
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
          dark: '#7B1234',
          light: '#FFFDFC',
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
        <img src="/logo.png" alt="Penkey Perks" className="w-32 h-32 object-contain opacity-80" />
      </div>
    )
  }

  const [nextReward, setNextReward] = useState<any>(null)
  const currentBeans = beanBalance?.current_beans || 0

  // Load next reward from database
  useEffect(() => {
    if (beanBalance) {
      getNextRewardThreshold(beanBalance.current_beans).then(setNextReward)
    }
  }, [beanBalance])

  const targetBeans = nextReward?.threshold || 8
  const progress = (currentBeans / targetBeans) * 100
  const beansNeeded = targetBeans - currentBeans
  const circumference = 2 * Math.PI * 58
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Sample vouchers for demo mode
  const sampleVouchers = [
    {
      id: 1,
      template: { name: 'Free Any Coffee', description: 'Redeem for any coffee' },
      expires_at: new Date(Date.now() + 28 * 86400000).toISOString(),
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      template: { name: 'Lucky Duck Spin', description: 'Spin to win a prize' },
      expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      template: { name: '£5 Lunch Reward', description: 'Off any lunch item' },
      expires_at: new Date(Date.now() + 23 * 86400000).toISOString(),
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
    },
  ]

  // Sample campaign for demo mode
  const sampleCampaign = {
    id: 1,
    name: 'Rainy Day Double Beans',
    description: 'Any hot drink until 2pm — double the beans.',
    bean_multiplier: 2,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&h=400&fit=crop'
  }

  // Sample "Try Something New" items
  const sampleFeatured = [
    {
      id: 1,
      title: 'Affogato Special',
      description: '+2 bonus beans today',
      image: 'https://images.unsplash.com/photo-1578315573912-9053c9d3165f?w=400&h=300&fit=crop',
      accent: '#E48A3A'
    },
    {
      id: 2,
      title: 'Honey Mustard Melt',
      description: 'Featured this week',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
      accent: '#7B1234'
    },
  ]

  const displayVouchers = vouchers.length > 0 ? vouchers : sampleVouchers
  const displayCampaign = campaigns.length > 0 ? campaigns[0] : sampleCampaign

  // Stamp card config — next milestone from current beans
  const STAMP_MILESTONES = [2, 8, 15, 25]
  const nextMilestone = STAMP_MILESTONES.find(m => m > currentBeans) ?? 8
  const stampBeansNeeded = nextMilestone - currentBeans
  // Show stamps for the current milestone cycle
  const stampTotal = nextMilestone
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
                {getGreeting()},{' '}
                <img 
                  src="/heart.png" 
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
                <img src="/beanpile.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" style={{ transform: 'scale(0.8)' }} />
                
                <div className="relative z-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#F0EDE5' }}>
                    YOUR BEAN BALANCE
                  </p>
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[56px] font-extrabold leading-none" style={{ color: '#F0EDE5' }}>{currentBeans}</span>
                    </div>
                    <p className="text-[14px] font-semibold" style={{ color: '#F0EDE5' }}>beans</p>
                    <img src="/stroke.png" alt="" className="w-24 h-2 object-contain mt-1 opacity-60" style={{ marginLeft: '-12px' }} />
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
                  <div className="flex items-center justify-center">
                    <img src="/coffeecup.png" alt="" className="w-36 h-36 object-contain" />
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
                        width: `${Math.min((currentBeans / nextMilestone) * 100, 100)}%`,
                        backgroundColor: '#F28A2E'
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-medium" style={{ color: '#F0EDE5' }}>
                  0 - 25 beans
                </p>
              </div>
            </div>
          </div>

          {/* ── PERK UNLOCKED — only shows when vouchers exist ── */}
          {displayVouchers.length > 0 && (
            <div
              className="rounded-[18px] overflow-hidden relative cursor-pointer active:scale-[0.985] transition-all duration-200"
              style={{ backgroundColor: '#F4EFE7', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #E8E2D8' }}
              onClick={() => {
                setSelectedVoucher(displayVouchers[0])
                generateVoucherQRCode(displayVouchers[0])
              }}
            >
              <div className="p-5 pr-[120px]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ border: '1.5px solid #F28A2E' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="#F28A2E">
                    <circle cx="5" cy="5" r="4"/>
                  </svg>
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#F28A2E' }}>Perk unlocked</span>
                </div>
                <h3 className="text-[26px] font-bold leading-tight" style={{ color: '#24364B' }}>
                  Nice one!
                </h3>
                <p className="text-[13px] font-medium mt-1 leading-snug" style={{ color: '#5A6A7A' }}>
                  You've collected {currentBeans} beans.<br />
                  Keep going!{' '}
                  <img 
                    src="/heart.png" 
                    alt="" 
                    className="inline-block w-5 h-5 object-contain align-middle" 
                    style={{ marginBottom: '2px', transform: 'rotate(-15deg)' }} 
                  />
                </p>
              </div>
              {/* Coffee cup illustration */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ width: 130, height: 130 }}>
                <img src="/coffeecup.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* ── HOW IT WORKS ── */}
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

            <Link 
              href="/rewards"
              className="inline-flex items-center gap-2 text-[12px] font-semibold"
              style={{ color: '#E07A3A' }}
            >
              <img src="/heart.png" alt="" className="w-4 h-4 object-contain" />
              View all rewards
            </Link>
          </div>

          {/* ── THANKS FOR SUPPORTING LOCAL ── */}
          <div className="rounded-[18px] overflow-hidden" style={{ backgroundColor: '#F0F9FF', boxShadow: '0 2px 12px rgba(36,54,75,0.08)', border: '1px solid #E0F2FE' }}>
            <div className="flex items-center p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <img src="/heart.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold" style={{ color: '#24364B' }}>Thanks for supporting local</p>
                  <p className="text-xs" style={{ color: '#5A6A7A' }}>Every visit to Penkey helps our community thrive</p>
                </div>
              </div>
              <div className="w-32 h-32 flex-shrink-0">
                <img src="/local.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

        </div>

        <BottomNav />
      </div>

      {/* Voucher / Perk Unlocked Dialog */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="sm:max-w-sm rounded-[28px] shadow-[0_24px_64px_rgba(36,54,75,0.18)] p-0 overflow-hidden border-0">
          <div style={{ backgroundColor: '#F4EFE7' }}>

            {/* Top hero area — cream with close button */}
            <div className="relative px-5 pt-5 pb-4">
              {/* Single close button */}
              <button
                onClick={() => setSelectedVoucher(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(36,54,75,0.1)', color: '#24364B' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Perk unlocked badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3" style={{ border: '1.5px solid #F28A2E' }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="#F28A2E"><circle cx="5" cy="5" r="4"/></svg>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#F28A2E' }}>Perk unlocked</span>
              </div>

              {/* Hero row: text left, coffee cup right */}
              <div className="flex items-center justify-between pr-4">
                <div className="flex-1 pr-2">
                  <h2 className="text-[28px] font-extrabold leading-tight" style={{ color: '#24364B' }}>
                    Nice one!
                  </h2>
                  <p className="text-[22px] font-bold mt-0.5 leading-tight" style={{ color: '#F28A2E' }}>
                    {selectedVoucher?.template?.name || 'Your reward'}
                  </p>
                  <p className="text-[13px] mt-2 leading-snug" style={{ color: '#5A6A7A' }}>
                    {selectedVoucher?.template?.description || "You've earned this — show it to our staff and enjoy it on us."}{' '}
                    <img src="/heart.png" alt="" className="inline-block w-4 h-4 object-contain align-middle" style={{ transform: 'rotate(-10deg)' }} />
                  </p>
                </div>
                <img src="/coffeecup.png" alt="" className="w-24 h-24 object-contain flex-shrink-0" />
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5" style={{ height: '1px', backgroundColor: 'rgba(36,54,75,0.1)' }} />

            {/* QR code section */}
            <div className="px-5 py-4">
              <p className="text-[12px] font-semibold mb-3 text-center" style={{ color: '#7A6A5A' }}>
                Show this QR code to a member of staff to redeem
              </p>

              {voucherQrCode ? (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-[20px] p-4"
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 3px 16px rgba(36,54,75,0.1)', border: '1px solid rgba(36,54,75,0.07)' }}
                  >
                    <img src={voucherQrCode} alt="Voucher QR Code" className="w-52 h-52" />
                  </div>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center rounded-[20px]" style={{ backgroundColor: 'rgba(36,54,75,0.05)' }}>
                  <p className="text-[13px]" style={{ color: '#A89080' }}>Generating…</p>
                </div>
              )}

              {/* Expiry note */}
              {selectedVoucher?.expires_at && (
                <p className="text-[11px] text-center mt-2" style={{ color: '#A89080' }}>
                  Expires {new Date(selectedVoucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Done button */}
            <div className="px-5 pb-6">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="w-full h-[52px] text-white font-bold rounded-[16px] text-[15px] active:scale-[0.98] transition-all"
                style={{ backgroundColor: '#F28A2E', boxShadow: '0 4px 16px rgba(242,138,46,0.35)' }}
              >
                Done, thanks!
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Item Detail Dialog */}
      <Dialog open={!!selectedFeatured} onOpenChange={() => setSelectedFeatured(null)}>
        <DialogContent className="sm:max-w-sm rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] p-0 overflow-hidden border-0">
          {selectedFeatured?.image && (
            <div className="relative h-52 overflow-hidden">
              <img src={selectedFeatured.image} alt={selectedFeatured.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
          )}
          <div className="p-5 bg-white">
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold mb-1">{selectedFeatured?.title}</DialogTitle>
            <p className="text-[13px] text-[#6B4C3B] mb-4">{selectedFeatured?.description}</p>
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0E4] border border-[#F0D0B8]">
              <Sparkles className="w-3 h-3 text-[#E48A3A]" />
              <span className="text-[11px] font-bold text-[#E48A3A]">+2 bonus beans today</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="sm:max-w-sm rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.15)] bg-[#FAF8F5] border-0">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pb-2">
            {[
              { icon: GiftIcon, color: '#C49A6C', bg: '#FFF5EB', title: 'Reward Available', body: 'You have enough beans for a free coffee', time: '2h ago' },
              { icon: Coffee, color: '#2A7A4A', bg: '#F0FAF4', title: 'Check-in Bonus', body: 'You earned 2 beans for checking in', time: 'Yesterday' },
              { icon: Sparkles, color: '#E48A3A', bg: '#FFF5EB', title: 'Double Beans Today!', body: 'Rainy Day Double Beans is active until 2pm', time: '2d ago' },
            ].map((n, i) => (
              <div key={i} className="bg-white rounded-[14px] p-3.5 flex items-start gap-3 shadow-[0_1px_4px_rgba(75,48,40,0.07)]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: n.bg }}>
                  <n.icon className="w-4 h-4" style={{ color: n.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#2C1810]">{n.title}</p>
                  <p className="text-[11px] text-[#9A7A6A] mt-0.5 leading-snug">{n.body}</p>
                </div>
                <span className="text-[10px] text-[#C4AFA8] flex-shrink-0 mt-0.5">{n.time}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Beans Panel Dialog - Stamps Only */}
      <Dialog open={showBeansPanel} onOpenChange={setShowBeansPanel}>
        <DialogContent className="sm:max-w-md rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] p-0 overflow-hidden border-0">
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
              <div className="grid grid-cols-5 gap-3 mb-6">
                {Array.from({ length: 25 }).map((_, i) => {
                  const filled = i < currentBeans
                  return (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: filled ? '#F0EDE5' : 'transparent',
                        border: filled ? '2px solid #E0D8CC' : '2px dashed #F0EDE5',
                      }}
                    >
                      <img
                        src="/bean.png"
                        alt=""
                        className="w-10 h-10 object-contain"
                        style={{
                          filter: filled ? 'brightness(0) invert(1)' : 'brightness(0.4) grayscale(0.5)',
                          opacity: filled ? 1 : 0.6
                        }}
                      />
                    </div>
                  )
                })}
              </div>

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
                    className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#F8F5EF', border: '1.5px solid #E8E2D8' }}
                  >
                    <GiftIcon className="w-20 h-20 object-contain" style={{ transform: 'scale(1.5)' }} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-center" style={{ color: '#F8F5EF' }}>
                    NEXT REWARD
                  </p>
                  <p className="text-[12px] font-medium text-center leading-snug" style={{ color: '#F8F5EF' }}>
                    {nextMilestone} beans<br />= reward
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

      {/* Rewards Panel Dialog */}
      <Dialog open={showRewardsPanel} onOpenChange={setShowRewardsPanel}>
        <DialogContent className="sm:max-w-[380px] rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] p-0 border-0 overflow-hidden">
          <div style={{ background: 'linear-gradient(160deg, #2B3E52 0%, #1e2d3d 100%)' }} className="overflow-y-auto max-h-[90vh]">
            <div className="p-5">

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(240,237,229,0.7)' }}>YOUR JOURNEY</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[32px] font-extrabold leading-none" style={{ color: '#F28A2E' }}>{currentBeans}</span>
                    <span className="text-[18px] font-bold" style={{ color: '#F0EDE5' }}>beans</span>
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: 'rgba(240,237,229,0.55)' }}>
                    {stampBeansNeeded} beans away from your next reward
                  </p>
                </div>
                <button
                  onClick={() => setShowRewardsPanel(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(240,237,229,0.1)', color: '#F0EDE5' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Journey list */}
              {(() => {
                const milestones = [
                  { beans: 2, name: 'Free Syrup Shot', icon: 'syrup' },
                  { beans: 8, name: 'Any Coffee', icon: 'coffee' },
                  { beans: 15, name: 'Free Snack', icon: 'cookie' },
                  { beans: 25, name: 'Lunch Deal', icon: 'sandwich' },
                ]
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

                    return (
                      <div
                        key={reward.beans}
                        className="flex items-center gap-3 relative"
                        style={{ height: rowH, marginTop: index > 0 ? GAP : 0 }}>

                        {/* Circle icon */}
                        <div className="relative flex-shrink-0 z-10">
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
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
                            {reward.icon === 'syrup' && (
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={unlocked ? '#F28A2E' : 'rgba(240,237,229,0.6)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 3h8v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V3z" />
                                <path d="M12 9v3" />
                                <path d="M9 12h6" />
                                <rect x="7" y="12" width="10" height="9" rx="2" />
                              </svg>
                            )}
                            {reward.icon === 'coffee' && (
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={isNext ? '#F28A2E' : unlocked ? '#F28A2E' : 'rgba(240,237,229,0.6)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="2" x2="6" y2="5" />
                                <line x1="10" y1="2" x2="10" y2="5" />
                                <line x1="14" y1="2" x2="14" y2="5" />
                              </svg>
                            )}
                            {reward.icon === 'cookie' && (
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,229,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="8" cy="9" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                <circle cx="15" cy="9" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                <circle cx="9" cy="14.5" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                                <circle cx="14.5" cy="14" r="1.5" fill="rgba(240,237,229,0.6)" stroke="none" />
                              </svg>
                            )}
                            {reward.icon === 'sandwich' && (
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,229,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 11h18" />
                                <path d="M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v4H3V7z" />
                                <path d="M3 15h18" />
                                <path d="M5 19h14a2 2 0 0 0 2-2v-2H3v2a2 2 0 0 0 2 2z" />
                              </svg>
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
                  onClick={() => setShowRewardsPanel(false)}
                  className="flex-1 h-12 text-sm font-bold rounded-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid rgba(240,237,229,0.25)',
                    color: '#F28A2E',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Convert to voucher
                </button>
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
          </div>
        </DialogContent>
      </Dialog>
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
