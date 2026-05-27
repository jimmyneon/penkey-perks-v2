'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Coffee, Gift, User, Scan } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/order', icon: Coffee, label: 'Order' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="w-full max-w-[430px] mx-auto pointer-events-auto">
        <div className="mx-4 mb-5 bg-white/92 backdrop-blur-2xl rounded-[26px] shadow-[0_8px_40px_rgba(44,24,16,0.16),0_2px_8px_rgba(44,24,16,0.08)] border border-white/60">
          <div className="flex items-center h-[60px] px-1">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 min-h-[44px]"
                >
                  <div className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'text-[#2C1810]' : 'text-[#B8A098]'
                  }`}>
                    <Icon className={`w-[22px] h-[22px] transition-all ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
                    <span className={`text-[9px] font-bold tracking-wide transition-all ${isActive ? 'text-[#2C1810]' : 'text-[#C4AFA8]'}`}>
                      {item.label}
                    </span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-[#E48A3A]" />}
                  </div>
                </Link>
              )
            })}

            {/* Central Scan Button */}
            <Link href="/scan" className="flex items-center justify-center flex-shrink-0 -mt-7 mx-1">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-[#F0D0B8] to-[#E8B898] opacity-40 blur-sm" />
                {/* Main button */}
                <div className="relative w-[58px] h-[58px] rounded-full bg-gradient-to-br from-[#3D1520] to-[#2C1810] flex items-center justify-center shadow-[0_8px_24px_rgba(44,24,16,0.40),0_2px_8px_rgba(44,24,16,0.20)] border-[3px] border-white active:scale-95 transition-transform duration-150">
                  {/* Inner highlight */}
                  <div className="absolute top-1 left-2 right-2 h-px bg-white/20 rounded-full" />
                  <Scan className="w-6 h-6 text-white stroke-[1.8px]" />
                </div>
              </div>
            </Link>

            {navItems.slice(2).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 min-h-[44px]"
                >
                  <div className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'text-[#2C1810]' : 'text-[#B8A098]'
                  }`}>
                    <Icon className={`w-[22px] h-[22px] transition-all ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
                    <span className={`text-[9px] font-bold tracking-wide transition-all ${isActive ? 'text-[#2C1810]' : 'text-[#C4AFA8]'}`}>
                      {item.label}
                    </span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-[#E48A3A]" />}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
