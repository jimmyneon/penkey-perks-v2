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
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        {/* Subtle Header Gradient - lighter, cleaner */}
        <div className="absolute top-0 left-0 right-0 h-64 -z-10" style={{ background: 'linear-gradient(180deg, #FFFDFC 0%, #F8F6F4 60%, rgba(255,255,255,0) 100%)' }} />
        
        <div className="px-[clamp(20px,5vw,32px)] pt-4 pb-24 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div>
              <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-extrabold text-[#4B3028]">Hi {user?.user_metadata?.first_name || 'there'}</h1>
              <p className="text-sm text-[#4B3028]">Good coffee. Great people.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNotifications(true)}
                className="w-10 h-10 rounded-full bg-[#F4D8CC] flex items-center justify-center shadow-[0_4px_12px_rgba(244,216,204,0.4)]"
              >
                <Bell className="w-5 h-5 text-[#7B1234]" />
              </button>
            </div>
          </div>

          {/* Bean Progress Card */}
          <div 
            className="bg-[#FFFDFC] rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-[#F3DCD4] relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setShowBeansPanel(true)}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#4B3028] mb-1">Your Beans</p>
                <p className="text-[clamp(2.5rem,8vw,3.5rem)] font-extrabold text-[#C49A6C] mb-2">{currentBeans}</p>
                <p className="text-sm font-medium text-[#4B3028]">
                  {beansNeeded > 0 ? `${beansNeeded} beans unlocks Free Any Coffee` : 'Reward unlocked!'}
                </p>
              </div>
              <div className="relative">
                <svg width="130" height="130" className="transform -rotate-90">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C49A6C" />
                      <stop offset="100%" stopColor="#7B1234" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="65"
                    cy="65"
                    r="58"
                    stroke="#F3DCD4"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="65"
                    cy="65"
                    r="58"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(196,154,108,0.3))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Coffee className="w-8 h-8 text-[#C49A6C]" />
                </div>
              </div>
            </div>
            {/* Lifetime Beans Subtle Strip */}
            <div className="mt-4 pt-4 border-t border-[#F3DCD4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#4B3028]">Lifetime Beans</span>
                <span className="text-xs font-bold text-[#4B3028]">{beanBalance?.lifetime_beans || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#8D123F]">Gold Member</span>
                <ChevronRight className="w-3 h-3 text-[#4B3028]" />
              </div>
            </div>
          </div>

          {/* What's Brewing - Compact */}
          <div>
            <h2 className="text-[clamp(1.1rem,4vw,1.25rem)] font-bold text-[#4B3028] mb-3">What's Brewing</h2>
            <div 
              className="bg-gradient-to-br from-[#214B39] via-[#2A5A40] to-[#1A3A2A] rounded-[20px] p-5 shadow-[0_8px_24px_rgba(33,75,57,0.25),0_4px_12px_rgba(33,75,57,0.15)] relative overflow-hidden h-[140px] cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => router.push('/campaigns')}
            >
              {displayCampaign.image && (
                <img 
                  src={displayCampaign.image} 
                  alt={displayCampaign.name}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end">
                <h3 className="font-bold text-white text-[clamp(1.1rem,4vw,1.3rem)] mb-1">{displayCampaign.name}</h3>
                <p className="text-xs text-white/90 mb-2">{displayCampaign.description}</p>
                {displayCampaign.bean_multiplier > 1 && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C49A6C] to-[#7B1234] shadow-[0_4px_12px_rgba(196,154,108,0.4)]">
                    <span className="text-[10px] font-bold text-white">{displayCampaign.bean_multiplier}x beans</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Vouchers - Compact Horizontal */}
          <div>
            <h2 className="text-[clamp(1.1rem,4vw,1.25rem)] font-bold text-[#4B3028] mb-3">Your Vouchers</h2>
            <div className="flex gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide scroll-smooth">
              {displayVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className={`relative rounded-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.15),0_3px_10px_rgba(0,0,0,0.1)] min-w-[calc(50%-6px)] w-[calc(50%-6px)] h-[120px] flex-shrink-0 snap-start overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
                  onClick={() => {
                    setSelectedVoucher(voucher)
                    generateVoucherQRCode(voucher)
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${voucher.gradient || 'from-[#8D123F] to-[#A8224E]'} opacity-85`} />
                  {voucher.image && (
                    <img 
                      src={voucher.image} 
                      alt={voucher.template?.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-between p-3">
                    <h3 className="font-bold text-white text-xs leading-tight">{voucher.template?.name}</h3>
                    <p className="text-[10px] font-semibold text-white/90">
                      {new Date(voucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Try Something New - Compact Editorial */}
          <div>
            <h2 className="text-[clamp(1.1rem,4vw,1.25rem)] font-bold text-[#4B3028] mb-3">Try Something New</h2>
            <div className="space-y-3">
              {sampleFeatured.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.15),0_3px_10px_rgba(0,0,0,0.1)] h-[140px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setSelectedFeatured(item)}
                >
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-end p-4">
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-[#C49A6C] to-[#7B1234] w-fit mb-2 shadow-[0_4px_12px_rgba(196,154,108,0.4)]">
                      <span className="text-[10px] font-bold text-white">{item.description}</span>
                    </div>
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BottomNav />
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">Your QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64 border-4 border-[#F3DCD4] rounded-[28px] shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
              />
            )}
            <p className="mt-4 text-sm text-[#4B3028] text-center">
              Show this QR code to staff to add beans or redeem rewards
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Detail Dialog */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="sm:max-w-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">{selectedVoucher?.template?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-[#4B3028]">{selectedVoucher?.template?.description}</p>
            <p className="text-xs text-[#8D123F] font-semibold">
              Expires: {selectedVoucher?.expires_at ? new Date(selectedVoucher.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
            {voucherQrCode && (
              <div className="flex flex-col items-center space-y-3">
                <img src={voucherQrCode} alt="Voucher QR Code" className="w-48 h-48" />
                <p className="text-xs text-gray-500">Show this QR code to staff to redeem</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Item Detail Dialog */}
      <Dialog open={!!selectedFeatured} onOpenChange={() => setSelectedFeatured(null)}>
        <DialogContent className="sm:max-w-lg rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-0 overflow-hidden">
          {selectedFeatured?.image && (
            <img 
              src={selectedFeatured.image} 
              alt={selectedFeatured.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <DialogTitle className="text-[#4B3028] text-xl mb-2">{selectedFeatured?.title}</DialogTitle>
            <p className="text-sm text-[#4B3028] mb-4">{selectedFeatured?.description}</p>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C49A6C] to-[#7B1234]">
              <span className="text-xs font-bold text-white">+2 bonus beans today</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="sm:max-w-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">Notifications</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-[#FFFDFC] rounded-xl p-4 border border-[#F3DCD4]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C49A6C]/10 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-[#C49A6C]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4B3028]">Reward Available!</p>
                  <p className="text-xs text-gray-600 mt-1">You have enough beans for a free coffee</p>
                  <p className="text-[10px] text-gray-400 mt-2">2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="bg-[#FFFDFC] rounded-xl p-4 border border-[#F3DCD4]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4B3028]">Check-in Bonus</p>
                  <p className="text-xs text-gray-600 mt-1">You earned 2 beans for checking in today</p>
                  <p className="text-[10px] text-gray-400 mt-2">Yesterday</p>
                </div>
              </div>
            </div>
            <div className="bg-[#FFFDFC] rounded-xl p-4 border border-[#F3DCD4]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C49A6C]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[#C49A6C]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4B3028]">Double Beans Today!</p>
                  <p className="text-xs text-gray-600 mt-1">Rainy Day Double Beans is active until 2pm</p>
                  <p className="text-[10px] text-gray-400 mt-2">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beans Panel Dialog */}
      <Dialog open={showBeansPanel} onOpenChange={setShowBeansPanel}>
        <DialogContent className="sm:max-w-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[#4B3028]">Your Beans & Stamps</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Beans Balance */}
            <div className="bg-gradient-to-br from-[#C49A6C] to-[#7B1234] rounded-[28px] p-6 text-white text-center shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-medium mb-1">Current Balance</p>
              <p className="text-4xl font-extrabold mb-2">{currentBeans}</p>
              <p className="text-sm opacity-90">beans</p>
            </div>

            {/* Stamps Section */}
            <div>
              <h3 className="text-sm font-semibold text-[#4B3028] mb-3">Coffee Stamps</h3>
              <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-[#F3DCD4]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Stamps collected</span>
                  <span className="text-lg font-bold text-[#C49A6C]">3 / 8</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <div
                      key={num}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        num <= 3
                          ? 'bg-gradient-to-br from-[#C49A6C] to-[#7B1234] text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {num <= 3 ? '✓' : num}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  5 more stamps for a free coffee
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-[#4B3028] mb-3">Recent Activity</h3>
              <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-[#F3DCD4] space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-[#F3DCD4]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700">Check-in bonus</span>
                  </div>
                  <span className="text-sm font-semibold text-[#C49A6C]">+2 beans</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F3DCD4]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700">Coffee purchase</span>
                  </div>
                  <span className="text-sm font-semibold text-[#C49A6C]">+1 bean</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-700">Reward redeemed</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-500">-8 beans</span>
                </div>
              </div>
            </div>

            {/* View Rewards Button */}
            <button
              onClick={() => {
                setShowBeansPanel(false)
                router.push('/rewards')
              }}
              className="w-full py-3 bg-gradient-to-br from-[#C49A6C] to-[#7B1234] text-white font-semibold rounded-[28px] shadow-lg hover:from-[#A87D55] hover:to-[#660E2B] transition-all"
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
