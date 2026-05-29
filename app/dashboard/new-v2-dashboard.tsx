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
                    Free coffee
                  </p>
                  <div className="flex items-center justify-center">
                    <img src="/coffeecup.png" alt="" className="w-36 h-36 object-contain" />
                  </div>
                </div>
                <p className="text-[10px] font-medium mb-1.5" style={{ color: '#F0EDE5' }}>
                  {stampBeansNeeded} beans away
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
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#E07A3A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: '#24364B' }}>Visit Penkey</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#E07A3A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M8 12h8" />
                    <path d="M12 8v8" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: '#24364B' }}>Show QR code</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#E07A3A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: '#24364B' }}>Earn beans</p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#E07A3A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: '#24364B' }}>Enjoy rewards</p>
              </div>
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

      {/* Rewards Panel Dialog - Horizontal Bean Journey */}
      <Dialog open={showRewardsPanel} onOpenChange={setShowRewardsPanel}>
        <DialogContent className="sm:max-w-lg rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] p-0 overflow-hidden border-0">
          <div
            className="rounded-[24px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2B3E52 0%, #24364A 100%)' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#F0EDE5' }}>
                    YOUR JOURNEY
                  </p>
                  <p className="text-[20px] font-extrabold mt-1" style={{ color: '#F28A2E' }}>
                    {currentBeans} beans
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(240,237,229,0.6)' }}>
                    {stampBeansNeeded} beans until next reward
                  </p>
                </div>
                <button onClick={() => setShowRewardsPanel(false)} className="text-[#F0EDE5]/50 hover:text-[#F0EDE5] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Horizontal bean journey */}
              <div className="relative py-10 px-2">
                {/* Wavy path SVG - more pronounced curve */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <path 
                    d="M 20 60 Q 80 30, 140 60 T 260 60 T 380 60" 
                    fill="none" 
                    stroke="rgba(240,237,229,0.2)" 
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Bean markers along the path at varying heights */}
                <div className="relative h-full">
                  {[
                    { beans: 2, name: 'Free Syrup Shot', percent: 12, topPercent: 50 },
                    { beans: 8, name: 'Free Coffee', percent: 37, topPercent: 40 },
                    { beans: 15, name: 'Free Snack', percent: 62, topPercent: 50 },
                    { beans: 25, name: 'Free Meal', percent: 87, topPercent: 60 },
                  ].map((reward) => {
                    const unlocked = currentBeans >= reward.beans
                    const isNext = !unlocked && currentBeans < reward.beans
                    
                    return (
                      <div 
                        key={reward.beans}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${reward.percent}%`, top: `${reward.topPercent}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        {/* Bean icon */}
                        <div className="relative mb-3">
                          <img 
                            src="/bean.png" 
                            alt="" 
                            className="w-12 h-12 object-contain"
                            style={{ 
                              opacity: unlocked ? 1 : isNext ? 0.8 : 0.3,
                              filter: unlocked ? 'none' : 'grayscale(100%)'
                            }} 
                          />
                          {unlocked && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2" style={{ backgroundColor: '#F28A2E', borderColor: '#2B3E52' }} />
                          )}
                        </div>
                        
                        {/* Bean count */}
                        <p 
                          className="text-[12px] font-bold mb-1"
                          style={{ color: unlocked ? '#F28A2E' : isNext ? '#F28A2E' : 'rgba(240,237,229,0.4)' }}
                        >
                          {reward.beans}
                        </p>
                        
                        {/* Reward name */}
                        <p 
                          className="text-[10px] font-semibold text-center whitespace-nowrap"
                          style={{ color: unlocked ? '#F0EDE5' : isNext ? '#F0EDE5' : 'rgba(240,237,229,0.4)' }}
                        >
                          {reward.name}
                        </p>

                        {/* Status badge */}
                        {unlocked && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: 'rgba(242,138,46,0.2)', color: '#F28A2E' }}>
                            Unlocked
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: '#F28A2E', color: 'white' }}>
                            Next
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Current progress info */}
              <div className="mt-4 p-4 rounded-[16px]" style={{ backgroundColor: 'rgba(240,237,229,0.05)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#F0EDE5' }}>
                      NEXT REWARD
                    </p>
                    <p className="text-[14px] font-bold mt-1" style={{ color: '#F28A2E' }}>
                      {stampBeansNeeded} beans to go
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#F0EDE5' }}>
                      PROGRESS
                    </p>
                    <p className="text-[14px] font-bold mt-1" style={{ color: '#F28A2E' }}>
                      {currentBeans} / {nextMilestone}
                    </p>
                  </div>
                </div>
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

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRewardsPanel(false)}
                  className="flex-1 py-3 text-sm font-bold rounded-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: 'transparent',
                    border: '2px solid rgba(240,237,229,0.3)',
                    color: '#F0EDE5'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6" />
                    <path d="M13 5V2" />
                    <path d="M13 21v-3" />
                    <path d="M2 12h20" />
                  </svg>
                  Convert To Voucher
                </button>
                <button
                  onClick={() => { setShowRewardsPanel(false); router.push('/rewards') }}
                  className="flex-1 py-3 text-white text-sm font-bold rounded-[14px] active:scale-[0.98] transition-all"
                  style={{ backgroundColor: '#F28A2E', boxShadow: '0 4px 12px rgba(242,138,46,0.3)' }}
                >
                  View All Rewards
                </button>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-[11px]" style={{ color: 'rgba(240,237,229,0.4)' }}>
                  Thanks for supporting local
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
