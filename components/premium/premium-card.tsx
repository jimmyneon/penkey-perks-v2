'use client'

import { ReactNode } from 'react'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  variant?: 'cream' | 'dark' | 'gradient-green' | 'voucher'
  onClick?: () => void
}

export function PremiumCard({ children, className = '', variant = 'cream', onClick }: PremiumCardProps) {
  const baseStyles = 'relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform'
  
  const variantStyles = {
    cream: 'bg-[#FFFDFC] rounded-[28px] shadow-[0_4px_20px_rgba(36,21,26,0.15),0_12px_40px_rgba(36,21,26,0.12)] border border-[#F3DCD4]',
    dark: 'bg-gradient-to-br from-[#214B39] via-[#2A5A40] to-[#1A3A2A] rounded-[28px] shadow-[0_4px_20px_rgba(33,75,57,0.2),0_12px_40px_rgba(33,75,57,0.15)]',
    'gradient-green': 'bg-gradient-to-br from-green-500 to-emerald-600 rounded-[28px] shadow-[0_4px_20px_rgba(34,197,94,0.2),0_12px_40px_rgba(34,197,94,0.15)]',
    voucher: 'rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.2),0_12px_40px_rgba(0,0,0,0.15)]',
  }

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {children}
    </div>
  )
}
