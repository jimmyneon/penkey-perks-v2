'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBeanBalance, getActiveVouchers, getUserBadges, getActiveCampaigns, getNextRewardThreshold } from '@/lib/supabase/queries'
import { Bell, Coffee, Gift, TrendingUp, QrCode, BarChart3, ChevronRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null)
  const [selectedFeatured, setSelectedFeatured] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showBeansPanel, setShowBeansPanel] = useState(false)
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const nextReward = beanBalance ? getNextRewardThreshold(beanBalance.current_beans) : null
  const currentBeans = beanBalance?.current_beans || 0
  const targetBeans = 8 // Free coffee is 8 beans
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
  const firstNameRaw = user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || 'there'
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        <div className="px-5 pt-14 pb-28 space-y-5">

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between pt-1">
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
              <p className="text-[13px] font-medium mt-1.5 flex items-center gap-1.5" style={{ color: '#24364B' }}>
                Welcome to Penkey Perks
                <SparkLines className="text-[#F28A2E] w-4 h-4" />
              </p>
            </div>
            {/* Right: wordmark */}
            <div className="flex flex-col items-end ml-6">
              <img src="/logo.png" alt="PENKEY Perks" className="h-24 w-auto object-contain" />
            </div>
          </div>

          {/* ── YOUR PROGRESS ── */}
          <div
            className="rounded-[18px] overflow-hidden cursor-pointer active:scale-[0.985] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #2B3E52 0%, #24364A 100%)', boxShadow: '0 4px 20px rgba(36,54,75,0.15)' }}
            onClick={() => setShowBeansPanel(true)}
          >
            <div className="flex">
              {/* Left: stamps */}
              <div className="flex-1 p-5 pr-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  YOUR PROGRESS
                </p>
                {/* Stamp dots */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.from({ length: Math.min(stampTotal, 8) }).map((_, i) => {
                    const filled = i < currentBeans
                    return (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: filled ? 'rgba(255,255,255,0.2)' : 'transparent',
                          border: filled ? '2px solid rgba(255,255,255,0.4)' : '2px dashed rgba(255,255,255,0.25)',
                        }}
                      >
                        <img
                          src="/bean.png"
                          alt=""
                          className="w-4 h-4 object-contain"
                          style={{
                            filter: filled ? 'brightness(0) invert(1)' : 'brightness(0.4) grayscale(0.5)',
                            opacity: filled ? 1 : 0.6
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                <p className="text-[18px] font-bold text-white leading-tight">
                  {stampBeansNeeded} beans to your next treat
                </p>
                <div className="mt-1.5">
                  <BrushUnderline className="text-[#F28A2E] w-16" />
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {nextMilestone} beans = a reward
                </p>
              </div>

              {/* Right: next reward */}
              <div
                className="w-[110px] flex-shrink-0 flex flex-col items-center justify-center p-4 gap-2"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.12)' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F8F5EF', border: '1.5px solid #E8E2D8' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#24364B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M12 7v-3a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3"/>
                    <path d="M16 21v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    <circle cx="12" cy="14" r="2"/>
                  </svg>
                </div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-center" style={{ color: '#F8F5EF' }}>
                  NEXT REWARD
                </p>
                <p className="text-[11px] font-medium text-center leading-snug" style={{ color: '#F8F5EF' }}>
                  {nextMilestone} beans<br />= reward
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: '#F28A2E', boxShadow: '0 2px 8px rgba(242,138,46,0.25)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                    <circle cx="5" cy="5" r="4"/>
                  </svg>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white">Perk unlocked</span>
                </div>
                <h3 className="text-[26px] font-bold leading-tight" style={{ color: '#24364B' }}>
                  Nice one!
                </h3>
                <p className="text-[13px] font-medium mt-1 leading-snug" style={{ color: '#5A6A7A' }}>
                  You've collected {currentBeans} beans.<br />
                  Keep going!{' '}
                  <span style={{ color: '#F28A2E' }}>♡</span>
                </p>
              </div>
              {/* Coffee cup illustration */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ width: 176, height: 176 }}>
                <img src="/coffeecup.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* ── YOUR BEAN BALANCE ── creamy card, big number ── */}
          <div className="rounded-[18px] p-5" style={{ backgroundColor: '#F8F5EF', boxShadow: '0 2px 14px rgba(36,54,75,0.08)', border: '1px solid #E8E2D8' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#8A96A0' }}>
              YOUR BEAN BALANCE
            </p>
            <div className="flex items-end gap-4 mb-5">
              <span className="text-[64px] font-bold leading-none tracking-tight" style={{ color: '#24364B' }}>
                {currentBeans}
              </span>
              <span className="text-[20px] font-medium mb-1" style={{ color: '#8A96A0' }}>beans</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid #E8E2D8' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EDE5', border: '1.5px solid #E0D8CC' }}>
                  <img src="/bean.png" alt="" className="w-5 h-5 object-contain opacity-60" />
                </div>
                <div>
                  <p className="text-[13px] font-medium leading-tight" style={{ color: '#24364B' }}>Collect beans</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#8A96A0' }}>Scan every time<br/>you visit</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EDE5', border: '1.5px solid #E0D8CC' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A96A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9"/>
                    <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9"/>
                    <path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium leading-tight" style={{ color: '#24364B' }}>Get rewards</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#8A96A0' }}>Exchange {nextMilestone} beans<br/>for a voucher</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── THANKS FOR SUPPORTING LOCAL ── */}
        <div className="rounded-[18px] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(36,54,75,0.08)' }}>
          <div className="relative w-full h-36">
            <img src="/local-banner.png" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-[20px] font-bold text-white leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                Thanks for supporting local
              </p>
              <p className="text-[14px] font-medium text-white mt-2 leading-snug" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                Every visit to Penkey helps our community thrive
              </p>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Voucher Detail Dialog */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="sm:max-w-sm rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] p-0 overflow-hidden border-0">
          {selectedVoucher?.image && (
            <div className="relative h-44 overflow-hidden">
              <img src={selectedVoucher.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="font-bold text-white text-lg leading-tight">{selectedVoucher?.template?.name}</h3>
              </div>
            </div>
          )}
          <div className="p-5 space-y-4 bg-white">
            <p className="text-[13px] text-[#6B4C3B] leading-relaxed">{selectedVoucher?.template?.description}</p>
            <div className="flex items-center gap-2 py-2 border-t border-[#F0E6DE]">
              <span className="text-[11px] font-semibold text-[#9A7A6A] uppercase tracking-wide">Expires</span>
              <span className="text-[12px] font-bold text-[#7B1234]">
                {selectedVoucher?.expires_at ? new Date(selectedVoucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
            {voucherQrCode && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <div className="bg-[#FAF8F5] rounded-[16px] p-4 border border-[#EEE0D8]">
                  <img src={voucherQrCode} alt="Voucher QR Code" className="w-44 h-44" />
                </div>
                <p className="text-[11px] text-[#9A7A6A] text-center">Show to staff to redeem this voucher</p>
              </div>
            )}
            <button
              onClick={() => setSelectedVoucher(null)}
              className="w-full py-3 bg-[#2C1810] text-white text-sm font-bold rounded-[14px] active:scale-[0.98] transition-all"
            >
              Close
            </button>
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

      {/* Beans Panel Dialog */}
      <Dialog open={showBeansPanel} onOpenChange={setShowBeansPanel}>
        <DialogContent className="sm:max-w-sm rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.15)] bg-[#FAF8F5] border-0">
          <DialogHeader>
            <DialogTitle className="text-[#2C1810] text-lg font-extrabold">Your Beans</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pb-2">
            {/* Balance row */}
            <div className="bg-white rounded-[16px] p-4 flex items-center justify-between shadow-[0_1px_4px_rgba(75,48,40,0.07)]">
              <div>
                <p className="text-[11px] font-bold text-[#B07A5E] uppercase tracking-widest mb-1">Current Balance</p>
                <p className="text-[2.5rem] font-extrabold text-[#2C1810] leading-none">{currentBeans}</p>
                <p className="text-[12px] text-[#9A7A6A] mt-1">beans</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#9A7A6A]">Lifetime</p>
                <p className="text-lg font-bold text-[#C49A6C]">{beanBalance?.lifetime_beans || 0}</p>
              </div>
            </div>

            {/* Stamps */}
            <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(75,48,40,0.07)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#2C1810]">Coffee Stamps</p>
                <span className="text-[11px] font-bold text-[#7B1234]">3 / 8</span>
              </div>
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <div key={n} className={`flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${n <= 3 ? 'bg-[#E48A3A] text-white' : 'bg-[#F3E4DB] text-[#C4AFA8]'}`}>
                    {n <= 3 ? '✓' : n}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#9A7A6A] mt-2.5">5 more for a free coffee</p>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(75,48,40,0.07)]">
              <p className="text-[13px] font-bold text-[#2C1810] mb-3">Recent Activity</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Check-in bonus', val: '+2', pos: true },
                  { label: 'Coffee purchase', val: '+1', pos: true },
                  { label: 'Reward redeemed', val: '−8', pos: false },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${a.pos ? 'bg-[#2A7A4A]' : 'bg-[#C49A6C]'}`} />
                      <span className="text-[12px] text-[#6B4C3B]">{a.label}</span>
                    </div>
                    <span className={`text-[12px] font-bold ${a.pos ? 'text-[#2A7A4A]' : 'text-[#9A7A6A]'}`}>{a.val} beans</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowBeansPanel(false); router.push('/rewards') }}
              className="w-full py-3.5 bg-[#2C1810] text-white text-sm font-bold rounded-[14px] active:scale-[0.98] transition-all"
            >
              View All Rewards
            </button>
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
