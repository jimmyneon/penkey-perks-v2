'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, Gift, Gamepad2, ScrollText, UserCog, LogOut, QrCode, Coffee, Bell, Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminNavProps {
  role: 'owner' | 'employee'
}

export function AdminNav({ role }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/rewards', label: 'Rewards', icon: Gift },
    { href: '/admin/points-config', label: 'Points', icon: Coins },
    { href: '/admin/games', label: 'Games', icon: Gamepad2 },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    { href: '/admin/scan', label: 'Scan', icon: QrCode },
    { href: '/admin/logs', label: 'Logs', icon: ScrollText },
    ...(role === 'owner' ? [{ href: '/admin/staff', label: 'Staff', icon: UserCog }] : []),
  ]

  return (
    <nav className="bg-white border-b border-penkey-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-penkey-orange/10 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-penkey-orange" />
              </div>
              <span className="font-heading font-bold text-lg text-penkey-dark">Admin Panel</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
