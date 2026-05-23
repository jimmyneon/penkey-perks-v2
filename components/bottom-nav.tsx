'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Coffee, Gift, User, Scan } from 'lucide-react'

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/order', icon: Coffee, label: 'Order' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="w-full max-w-[430px] mx-auto">
        <div className="mx-4 mb-4 bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.08)] border border-[#F0EBE5]">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 2).map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full relative group min-h-[44px]"
                >
                  <div className={`flex flex-col items-center justify-center transition-all rounded-xl px-3 py-2 ${
                    isActive ? 'bg-[#F4D8CC] text-[#C49A6C] shadow-[0_4px_12px_rgba(244,216,204,0.4)]' : 'text-[#4B3028]/60 group-hover:text-[#C49A6C] group-hover:bg-[#F4D8CC]/50'
                  }`}>
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                </Link>
              )
            })}
            
            {/* Central Scan Button */}
            <Link
              href="/scan"
              className="relative -top-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#F4D8CC] flex items-center justify-center shadow-[0_8px_24px_rgba(244,216,204,0.4),0_4px_12px_rgba(244,216,204,0.3)] border-4 border-white">
                <Scan className="w-7 h-7 text-[#7B1234]" />
              </div>
            </Link>

            {navItems.slice(2).map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full relative group min-h-[44px]"
                >
                  <div className={`flex flex-col items-center justify-center transition-all rounded-xl px-3 py-2 ${
                    isActive ? 'bg-[#F4D8CC] text-[#C49A6C] shadow-[0_4px_12px_rgba(244,216,204,0.4)]' : 'text-[#4B3028]/60 group-hover:text-[#C49A6C] group-hover:bg-[#F4D8CC]/50'
                  }`}>
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
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
