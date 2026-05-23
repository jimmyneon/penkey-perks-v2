'use client'

import { ReactNode } from 'react'

interface PremiumContainerProps {
  children: ReactNode
  className?: string
}

export function PremiumContainer({ children, className = '' }: PremiumContainerProps) {
  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <div className="w-full max-w-[430px] mx-auto min-h-screen relative">
        {/* Subtle Header Gradient */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#F4D8CC] via-[#F8E9E0] to-[#FAF7F4] -z-10" />
        
        <div className={`px-[clamp(20px,5vw,32px)] pt-4 pb-24 space-y-5 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
