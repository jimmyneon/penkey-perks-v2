'use client'

import { ReactNode } from 'react'
import { Bell } from 'lucide-react'

interface PremiumHeaderProps {
  title: string
  subtitle?: string
  showNotification?: boolean
  onNotificationClick?: () => void
  rightContent?: ReactNode
}

export function PremiumHeader({ 
  title, 
  subtitle, 
  showNotification = true,
  onNotificationClick,
  rightContent 
}: PremiumHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2 relative z-10">
      <div>
        <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-extrabold text-[#4B3028]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#4B3028]">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {rightContent}
        {showNotification && (
          <button 
            className="w-10 h-10 rounded-full bg-[#F4D8CC] flex items-center justify-center shadow-[0_4px_12px_rgba(244,216,204,0.4)]"
            onClick={onNotificationClick}
          >
            <Bell className="w-5 h-5 text-[#8D123F]" />
          </button>
        )}
      </div>
    </div>
  )
}
