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
          className="bg-white/80 backdrop-blur-xl shadow-[0_-1px_0_rgba(28,43,58,0.08),0_-4px_20px_rgba(28,43,58,0.06)] rounded-[28px]"
          style={{ WebkitBackdropFilter: 'blur(20px)' }}
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
                    style={{ color: isActive ? '#E07A3A' : '#9AAAB8' }}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isActive ? '#E07A3A' : '#9AAAB8' }}
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

            {/* Centre Scan button — orange, lifted, matches reference */}
            <Link
              href="/scan"
              className="flex items-center justify-center flex-shrink-0 -mt-7 mx-2"
            >
              <div
                className="w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform duration-150"
                style={{
                  backgroundColor: '#E07A3A',
                  boxShadow: '0 4px 18px rgba(224,122,58,0.50)',
                  border: '3px solid white',
                }}
              >
                <ScanLine className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
                <span className="text-[8px] font-bold text-white tracking-wide">SCAN</span>
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
                    style={{ color: isActive ? '#E07A3A' : '#9AAAB8' }}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isActive ? '#E07A3A' : '#9AAAB8' }}
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
