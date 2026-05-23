'use client'

import { ReactNode } from 'react'

interface PremiumTextProps {
  children: ReactNode
  variant?: 'heading' | 'subheading' | 'body' | 'caption'
  color?: 'brown' | 'orange' | 'burgundy' | 'white'
  className?: string
}

export function PremiumText({ children, variant = 'body', color = 'brown', className = '' }: PremiumTextProps) {
  const variantStyles = {
    heading: 'text-[clamp(1.5rem,5vw,2rem)] font-extrabold',
    subheading: 'text-[clamp(1.1rem,4vw,1.25rem)] font-bold',
    body: 'text-sm font-medium',
    caption: 'text-xs font-semibold',
  }

  const colorStyles = {
    brown: 'text-[#4B3028]',
    orange: 'text-[#E48A3A]',
    burgundy: 'text-[#8D123F]',
    white: 'text-white',
  }

  return (
    <p className={`${variantStyles[variant]} ${colorStyles[color]} ${className}`}>
      {children}
    </p>
  )
}
