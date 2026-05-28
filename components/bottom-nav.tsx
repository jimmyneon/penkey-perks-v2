'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, MessageCircle, ScanLine, Gift, User } from 'lucide-react'

const leftItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/order', icon: MessageCircle, label: 'Order Now', external: false },
]

const rightItems = [
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full max-w-[430px] mx-auto px-4 pb-4">
        <div
          className="backdrop-blur-xl shadow-[0_-1px_0_rgba(36,54,75,0.06),0_-4px_20px rgba(36,54,75,0.04)] rounded-[28px]"
          style={{ backgroundColor: '#F7F5F0', WebkitBackdropFilter: 'blur(20px)' }}
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
                    style={{ color: isActive ? '#F28A2E' : '#A8B8C8' }}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? '#F28A2E' : '#A8B8C8' }}
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

            {/* Centre Scan button — warmer orange, softer glow */}
            <Link
              href="/scan"
              className="flex items-center justify-center flex-shrink-0 -mt-7 mx-2"
            >
              <div
                className="w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform duration-150"
                style={{
                  background: 'linear-gradient(135deg, #F28A2E 0%, #E67B22 100%)',
                  boxShadow: '0 4px 16px rgba(242,138,46,0.35)',
                  border: '3px solid white',
                }}
              >
                <ScanLine className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
                <span className="text-[8px] font-semibold text-white tracking-wide">SCAN</span>
              </div>
            </Link>

            {/* Right two items */}
            {rightItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] min-h-[44px]">
                  <Icon
                    className="w-[22px] h-[22px] transition-colors"
                    style={{ color: isActive ? '#F28A2E' : '#A8B8C8' }}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? '#F28A2E' : '#A8B8C8' }}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}

          </div>
        </div>
      </div>
    </nav>
  )
}
