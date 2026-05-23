'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Gift, Sparkles, User, Scan } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/scan', icon: Scan, label: 'Scan' },
  { href: '/campaigns', icon: Sparkles, label: 'Campaigns' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#EFE7DC] z-50">
      <div className="container mx-auto max-w-lg">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full relative group min-h-[44px]"
              >
                <div className={`flex flex-col items-center justify-center transition-all ${
                  isActive ? 'text-[#D98A4E]' : 'text-[#6A4B3A] group-hover:text-[#2A2A2A]'
                }`}>
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#D98A4E] rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
