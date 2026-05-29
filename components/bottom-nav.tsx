'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, MessageCircle, QrCode, Gift, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import QRCodeLib from 'qrcode'

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
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
    }
    loadUser()
  }, [])

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

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-sm rounded-[24px] bg-white border-0 shadow-[0_24px_64px_rgba(28,43,58,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-[#1C2B3A] text-lg font-extrabold text-center">Your QR Code</DialogTitle>
            <DialogDescription className="text-[#8A96A0] text-[13px] text-center">Show to staff to earn stamps and beans</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pb-1">
            <div
              className="rounded-[16px] p-5 flex items-center justify-center"
              style={{
                backgroundColor: '#F4F7F9',
                border: '1px solid #EDF1F4',
              }}
            >
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52" />
              ) : (
                <div className="w-52 h-52 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#EDF1F4' }}>
                  <QrCode className="w-12 h-12" style={{ color: '#9AAAB8' }} />
                </div>
              )}
            </div>
            <div className="rounded-[14px] px-4 py-3" style={{ backgroundColor: '#F4F7F9', border: '1px solid #EDF1F4' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: '#9AAAB8' }}>Staff can use this to</p>
              <div className="flex gap-2 flex-wrap">
                {['Check-ins', 'Add stamps', 'Award beans'].map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(224,122,58,0.12)', color: '#E07A3A' }}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowQR(false)} className="w-full py-3.5 text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all" style={{ backgroundColor: '#2C3E50' }}>Done</button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
