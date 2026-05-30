'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, MessageCircle, QrCode, Gift, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet'
import { createClient } from '@/lib/supabase/client'
import QRCodeLib from 'qrcode'
import { RealtimeChannel } from '@supabase/supabase-js'

const leftItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/order', icon: MessageCircle, label: 'Order Now', external: false },
]

const rightItems = [
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

interface BottomNavProps {
  onShowQRCode?: () => void
}

export function BottomNav({ onShowQRCode }: BottomNavProps) {
  const pathname = usePathname()
  const [showQR, setShowQR] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  console.log('[BottomNav] Component mounted')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (showQR && user) {
      generateQRCode()
    }
  }, [showQR, user])

  useEffect(() => {
    const loadUser = async () => {
      console.log('[BottomNav] Loading user...')
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('[BottomNav] User loaded:', authUser?.id)
      setUser(authUser)
    }
    loadUser()
  }, [])

  // Auto-close QR when beans are awarded
  useEffect(() => {
    if (!user) {
      console.log('[BottomNav] No user, skipping subscription')
      return
    }

    console.log('[BottomNav] Setting up real-time subscription for user:', user.id)
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    channel = supabase
      .channel(`bean_balances:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bean_balances',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[BottomNav] Bean balance change received:', payload)
          console.log('[BottomNav] Closing QR')
          setShowQR(false)
        }
      )
      .subscribe((status, err) => {
        console.log('[BottomNav] Subscription status:', status)
        if (err) {
          console.error('[BottomNav] Subscription error:', err)
        }
      })

    return () => {
      if (channel) {
        console.log('[BottomNav] Cleaning up subscription')
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const generateQRCode = async () => {
    if (!user) return
    
    try {
      const qrData = JSON.stringify({
        type: 'customer',
        id: user.id,
        email: user.email,
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
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleQRClick = () => {
    if (onShowQRCode) {
      onShowQRCode()
    } else {
      setShowQR(true)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full max-w-[430px] mx-auto px-4 pb-4">
        <div
          className="backdrop-blur-xl rounded-[28px]"
          style={{
            backgroundColor: 'rgba(249,247,242,0.97)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 -2px 0 rgba(36,54,75,0.06), 0 -8px 32px rgba(36,54,75,0.12), 0 4px 24px rgba(36,54,75,0.08)',
            border: '1px solid rgba(36,54,75,0.08)',
          }}
        >
          <div className="flex items-center h-[64px]">

            {/* Left two items */}
            {leftItems.map((item) => {
              const isActive = !item.external && (pathname === item.href || pathname.startsWith(item.href + '/'))
              const Icon = item.icon
              const content = (
                <span className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] min-h-[44px] w-full">
                  <Icon
                    className="w-[22px] h-[22px] transition-colors"
                    style={{ color: isActive ? '#D87A2E' : '#A8B8C8' }}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? '#D87A2E' : '#A8B8C8' }}
                  >
                    {item.label}
                  </span>
                </span>
              )
              return item.external ? (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center flex-1 h-full">
                  {content}
                </a>
              ) : (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full">
                  {content}
                </Link>
              )
            })}

            {/* Centre QR Code button */}
            <button
              onClick={handleQRClick}
              className="flex items-center justify-center flex-shrink-0 -mt-5 mx-2"
            >
              <div
                className="w-[60px] h-[60px] rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150"
                style={{
                  background: 'linear-gradient(135deg, #E87A2E 0%, #D66B1F 100%)',
                  boxShadow: '0 4px 16px rgba(232,122,46,0.4)',
                  border: '3px solid white',
                }}
              >
                <QrCode className="w-[24px] h-[24px] text-white" strokeWidth={1.8} />
              </div>
            </button>

            {/* Right two items */}
            {rightItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] min-h-[44px]">
                  <Icon
                    className="w-[22px] h-[22px] transition-colors"
                    style={{ color: isActive ? '#D87A2E' : '#A8B8C8' }}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? '#D87A2E' : '#A8B8C8' }}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}

          </div>
        </div>
      </div>

      {/* QR Code Bottom Sheet */}
      <BottomSheet open={showQR} onOpenChange={setShowQR} showCloseButton={false}>
        <div className="flex flex-col items-center p-5">
          <div className="text-center mb-6">
            <p className="text-[24px] font-bold leading-tight" style={{ color: '#E07A3A', fontFamily: 'cursive, Georgia, serif' }}>
              Your QR Code
            </p>
            <p className="text-[13px] mt-1" style={{ color: '#8A96A0' }}>
              Show to staff to earn beans
            </p>
          </div>
          
          <div
            className="rounded-[24px] p-6 flex items-center justify-center mb-6"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(36,54,75,0.12)',
              border: '1px solid #E8E2D8',
            }}
          >
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 rounded-[20px] flex items-center justify-center" style={{ backgroundColor: '#F4EFE7' }}>
                <QrCode className="w-16 h-16" style={{ color: '#C4AFA8' }} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <img src="/heart.png" alt="" className="w-4 h-4 object-contain" />
            <p className="text-[12px]" style={{ color: '#8A96A0' }}>
              Swipe down to close
            </p>
          </div>
        </div>
      </BottomSheet>
    </nav>
  )
}
