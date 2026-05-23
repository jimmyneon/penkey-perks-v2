'use client'

import { ReactNode } from 'react'

interface PremiumImageCardProps {
  image: string
  title: string
  description?: string
  badge?: string
  height?: string
  onClick?: () => void
  children?: ReactNode
  className?: string
}

export function PremiumImageCard({ 
  image, 
  title, 
  description, 
  badge, 
  height = '220px',
  onClick,
  children,
  className = '' 
}: PremiumImageCardProps) {
  return (
    <div 
      className={`relative rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.2),0_12px_40px_rgba(0,0,0,0.15)] h-[${height}] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${className}`}
      onClick={onClick}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      
      {/* Background image */}
      <img 
        src={image} 
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5">
        {badge && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#E48A3A] w-fit mb-3 shadow-[0_4px_12px_rgba(228,138,58,0.4)]">
            <span className="text-[11px] font-bold text-white">{badge}</span>
          </div>
        )}
        <h3 className="font-bold text-white text-[clamp(1.25rem,5vw,1.5rem)]">{title}</h3>
        {description && (
          <p className="text-sm text-white/95 mt-1">{description}</p>
        )}
        {children}
      </div>
    </div>
  )
}
