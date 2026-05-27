'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Gift, User, Scan, Megaphone } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full max-w-[430px] mx-auto">
        <div className="bg-white border-t border-[#EDE0D8] shadow-[0_-2px_16px_rgba(61,26,14,0.08)]">
          <div className="flex items-center h-[62px] px-1 pb-safe">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] min-h-[44px]"
                >
                  <Icon
                    className="w-[22px] h-[22px] transition-all"
                    style={{ color: isActive ? '#C8472A' : '#C0ADA4' }}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span
                    className="text-[9px] font-bold tracking-wide"
                    style={{ color: isActive ? '#C8472A' : '#C0ADA4' }}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Central Scan Button — burgundy, lifted */}
            <Link href="/scan" className="flex items-center justify-center flex-shrink-0 -mt-6 mx-1">
              <div
                className="w-[58px] h-[58px] rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150"
                style={{
                  backgroundColor: '#7B1234',
                  boxShadow: '0 4px 20px rgba(123,18,52,0.40)',
                  border: '3px solid white',
                }}
              >
                <Scan className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
              </div>
            </Link>

            {navItems.slice(2).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] min-h-[44px]"
                >
                  <Icon
                    className="w-[22px] h-[22px] transition-all"
                    style={{ color: isActive ? '#C8472A' : '#C0ADA4' }}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span
                    className="text-[9px] font-bold tracking-wide"
                    style={{ color: isActive ? '#C8472A' : '#C0ADA4' }}
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
