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
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full max-w-[430px] mx-auto">
        {/* Solid white bar with top border */}
        <div className="bg-[#FFFDF9] border-t border-[#E4D8CC] shadow-[0_-4px_24px_rgba(38,20,8,0.10)]">
          <div className="flex items-center h-[62px] px-2 pb-safe">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 min-h-[44px]"
                >
                  <Icon className={`w-[22px] h-[22px] transition-all ${isActive ? 'text-[#D05A18] stroke-[2.2px]' : 'text-[#AE9888] stroke-[1.6px]'}`} />
                  <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-[#D05A18]' : 'text-[#AE9888]'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Central Scan Button */}
            <Link href="/scan" className="flex items-center justify-center flex-shrink-0 -mt-5 mx-2">
              <div className="w-[56px] h-[56px] rounded-full bg-[#261408] flex items-center justify-center shadow-[0_4px_20px_rgba(38,20,8,0.40)] border-[3px] border-[#FFFDF9] active:scale-95 transition-transform duration-150">
                <Scan className="w-[22px] h-[22px] text-white stroke-[1.8px]" />
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
                  <Icon className={`w-[22px] h-[22px] transition-all ${isActive ? 'text-[#D05A18] stroke-[2.2px]' : 'text-[#AE9888] stroke-[1.6px]'}`} />
                  <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-[#D05A18]' : 'text-[#AE9888]'}`}>
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
