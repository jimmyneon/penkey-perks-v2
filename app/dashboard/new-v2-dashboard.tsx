'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBeanBalance, getActiveVouchers, getUserBadges, getActiveCampaigns, getNextRewardThreshold } from '@/lib/supabase/queries'
import { Bell, Coffee, Gift, TrendingUp, QrCode, BarChart3, ChevronRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import QRCodeLib from 'qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BottomNav } from '@/components/bottom-nav'

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
      expires_at: '2026-12-15', 
      gradient: 'from-[#8D123F] to-[#A8224E]',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop'
    },
    { 
      id: 2, 
      template: { name: 'Lucky Duck Spin', description: 'Spin to win prizes' }, 
      expires_at: '2026-12-20', 
      gradient: 'from-[#F4D8CC] to-[#F8E9E0]',
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop'
    },
    { 
      id: 3, 
      template: { name: '£5 Lunch Reward', description: 'Off any lunch item' }, 
      expires_at: '2026-12-25', 
      gradient: 'from-[#214B39] to-[#2A5A40]',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
    },
    { 
      id: 4, 
      template: { name: 'Morning Boost', description: 'Free coffee upgrade' }, 
      expires_at: '2026-12-30', 
      gradient: 'from-[#F3DCD4] to-[#F8E9E0]',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop'
    },
  ]

  // Sample campaign for demo mode
  const sampleCampaign = {
    id: 1,
    name: 'Rainy Day Double Beans',
    description: 'On hot drinks until 2pm',
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

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        {/* Top gradient - soft cream to blush, fades by mid-screen */}
        <div 
          className="absolute top-0 left-0 right-0 h-80 pointer-events-none" 
          style={{ 
            background: 'linear-gradient(180deg, #FDF5F0 0%, #FAF0EC 30%, #F9EDE8 55%, rgba(250,248,245,0) 100%)',
            zIndex: 0
          }} 
        />
        
        <div className="relative z-10 px-5 pt-12 pb-28 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#B07A5E] uppercase tracking-widest mb-0.5">Good morning</p>
              <h1 className="text-[2rem] font-extrabold text-[#2C1810] leading-none tracking-tight">
                {user?.user_metadata?.first_name || 'Welcome'}
              </h1>
            </div>
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_12px_rgba(75,48,40,0.12)] border border-[#F0E6E0] mt-1"
            >
              <Bell className="w-5 h-5 text-[#7B1234]" />
            </button>
          </div>

          {/* Bean Progress Card - Hero */}
          <div 
            className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(75,48,40,0.10),0_1px_4px_rgba(75,48,40,0.06)] border border-[#EEE0D8] relative overflow-hidden cursor-pointer active:scale-[0.985] transition-all duration-200"
            onClick={() => setShowBeansPanel(true)}
          >
            {/* Subtle inner highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-[11px] font-bold text-[#B07A5E] uppercase tracking-widest mb-2">Your Beans</p>
                <p className="text-[3.5rem] font-extrabold text-[#2C1810] leading-none mb-2">{currentBeans}</p>
                <p className="text-[13px] font-medium text-[#6B4C3B] leading-snug">
                  {beansNeeded > 0 
                    ? <><span className="font-bold text-[#C49A6C]">{beansNeeded} more</span> for a free coffee</>
                    : <span className="text-[#2A7A4A] font-bold">Reward unlocked!</span>
                  }
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <svg width="116" height="116" className="transform -rotate-90">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E8A87C" />
                      <stop offset="100%" stopColor="#C49A6C" />
                    </linearGradient>
                  </defs>
                  <circle cx="58" cy="58" r="50" stroke="#F3E4DB" strokeWidth="7" fill="none" />
                  <circle
                    cx="58" cy="58" r="50"
                    stroke="url(#progressGradient)"
                    strokeWidth="7"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 - (progress / 100) * 2 * Math.PI * 50}
                    className="transition-all duration-700"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(196,154,108,0.35))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Coffee className="w-6 h-6 text-[#C49A6C] mb-0.5" />
                  <span className="text-[10px] font-bold text-[#B07A5E]">{currentBeans}/{targetBeans}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#F0E6DE] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#9A7A6A]">Lifetime</span>
                <span className="text-[11px] font-bold text-[#6B4C3B]">{beanBalance?.lifetime_beans || 0} beans</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-[#E48A3A] bg-[#FFF0E4] px-2 py-0.5 rounded-full">Gold Member</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C49A6C]" />
              </div>
            </div>
          </div>

          {/* What's Brewing */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-[#2C1810] tracking-tight">What's Brewing</h2>
            </div>
            <div 
              className="rounded-[20px] relative overflow-hidden h-[148px] cursor-pointer active:scale-[0.985] transition-all duration-200 shadow-[0_4px_20px_rgba(33,75,57,0.22)]"
              onClick={() => router.push('/campaigns')}
            >
              {displayCampaign.image && (
                <img 
                  src={displayCampaign.image} 
                  alt={displayCampaign.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E2A1E]/90 via-[#0E2A1E]/40 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-4">
                {displayCampaign.bean_multiplier > 1 && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E48A3A] w-fit mb-2">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white">{displayCampaign.bean_multiplier}× beans today</span>
                  </div>
                )}
                <h3 className="font-bold text-white text-[15px] leading-snug">{displayCampaign.name}</h3>
                <p className="text-[11px] text-white/75 mt-0.5">{displayCampaign.description}</p>
              </div>
            </div>
          </div>

          {/* Your Vouchers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-[#2C1810] tracking-tight">Your Vouchers</h2>
              <span className="text-[11px] font-semibold text-[#C49A6C]">{displayVouchers.length} active</span>
            </div>
            <div className="flex gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide -mx-5 px-5">
              {displayVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  style={{ minWidth: 'calc(50vw - 28px)', maxWidth: '180px' }}
                  className="relative rounded-[18px] h-[130px] flex-shrink-0 snap-start overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.14)]"
                  onClick={() => {
                    setSelectedVoucher(voucher)
                    generateVoucherQRCode(voucher)
                  }}
                >
                  {voucher.image ? (
                    <img src={voucher.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-[#3D1520]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0E]/85 via-[#1A0A0E]/30 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-between p-3.5">
                    <Gift className="w-4 h-4 text-white/60" />
                    <div>
                      <h3 className="font-bold text-white text-[12px] leading-tight mb-1">{voucher.template?.name}</h3>
                      <p className="text-[10px] text-white/60 font-medium">
                        Expires {new Date(voucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Try Something New */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-[#2C1810] tracking-tight">Try Something New</h2>
            </div>
            <div className="space-y-3">
              {sampleFeatured.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-[18px] h-[128px] overflow-hidden cursor-pointer active:scale-[0.985] transition-all duration-200 shadow-[0_3px_16px_rgba(0,0,0,0.12)]"
                  onClick={() => setSelectedFeatured(item)}
                >
                  <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-center p-4">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E48A3A] w-fit mb-2">
                      <span className="text-[10px] font-bold text-white">{item.description}</span>
                    </div>
                    <h3 className="font-bold text-white text-[15px]">{item.title}</h3>
                  </div>
                </div>
              ))}
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
              { icon: Gift, color: '#C49A6C', bg: '#FFF5EB', title: 'Reward Available', body: 'You have enough beans for a free coffee', time: '2h ago' },
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
