'use client'

import { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  showBottomNav?: boolean
  className?: string
}

export function AppShell({ children, showBottomNav = true, className = '' }: AppShellProps) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <div className={`max-w-[430px] mx-auto min-h-screen bg-cream-bg ${showBottomNav ? 'pb-24' : ''} ${className}`}>
        {children}
      </div>
    </div>
  )
}
