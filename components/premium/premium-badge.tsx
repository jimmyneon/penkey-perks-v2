'use client'

import { ReactNode } from 'react'

interface PremiumBadgeProps {
  children: ReactNode
  variant?: 'orange' | 'burgundy' | 'green'
  className?: string
}

export function PremiumBadge({ children, variant = 'orange', className = '' }: PremiumBadgeProps) {
  const variantStyles = {
    orange: 'bg-[#E48A3A] shadow-[0_4px_12px_rgba(228,138,58,0.4)]',
    burgundy: 'bg-[#8D123F] shadow-[0_4px_12px_rgba(141,18,63,0.4)]',
    green: 'bg-[#214B39] shadow-[0_4px_12px_rgba(33,75,57,0.4)]',
  }

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${variantStyles[variant]} ${className}`}>
      <span className="text-xs font-bold text-white">{children}</span>
    </div>
  )
}
