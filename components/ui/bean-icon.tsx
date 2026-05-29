'use client'

import { useState, useEffect } from 'react'

interface BeanIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function BeanIcon({ className = '', size = 'md' }: BeanIconProps) {
  const [emojiSupported, setEmojiSupported] = useState(true)
  
  // Check if emoji is supported
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillText('🫘', 0, 0)
      const imageData = ctx.getImageData(0, 0, 1, 1).data
      // If emoji not supported, it will render as empty/black
      if (imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 0) {
        setEmojiSupported(false)
      }
    }
  }, [])
  
  const sizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg',
    xl: 'w-8 h-8 text-2xl'
  }
  
  // If emoji is supported, use it
  if (emojiSupported) {
    return <span className={`${sizeClasses[size]} ${className}`}>🫘</span>
  }
  
  // Fallback: Beautiful SVG coffee bean
  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 32 32" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main bean shape with gradient */}
      <defs>
        <linearGradient id="beanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="beanHighlight">
          <stop offset="0%" style={{ stopColor: '#D2691E', stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      
      {/* Bean body - oval shape */}
      <ellipse 
        cx="16" 
        cy="16" 
        rx="10" 
        ry="14" 
        fill="url(#beanGradient)"
        transform="rotate(-15 16 16)"
      />
      
      {/* Center crease/line - signature coffee bean feature */}
      <path 
        d="M 16 6 Q 14 12, 16 16 Q 18 20, 16 26" 
        stroke="#654321" 
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      {/* Highlight for 3D effect */}
      <ellipse 
        cx="13" 
        cy="12" 
        rx="4" 
        ry="6" 
        fill="url(#beanHighlight)"
        transform="rotate(-15 13 12)"
      />
      
      {/* Shadow/depth on the other side */}
      <ellipse 
        cx="19" 
        cy="20" 
        rx="3" 
        ry="5" 
        fill="#654321"
        opacity="0.2"
        transform="rotate(-15 19 20)"
      />
    </svg>
  )
}

// Alternative: Cute rounded bean with shine
export function BeanIconSimple({ className = '', size = 'md' }: BeanIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  
  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="simpleBean" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#D2691E', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Rounded bean shape */}
      <path 
        d="M12 3C8 3 5 6 5 10C5 14 6 17 8 19C10 21 14 21 16 19C18 17 19 14 19 10C19 6 16 3 12 3Z"
        fill="url(#simpleBean)"
      />
      
      {/* Center line */}
      <path 
        d="M12 7C11 9 10.5 11 12 13C13.5 11 13 9 12 7Z"
        fill="#654321"
        opacity="0.4"
      />
      
      {/* Shine effect */}
      <circle cx="10" cy="8" r="2" fill="white" opacity="0.3" />
    </svg>
  )
}

// Alternative: Minimal flat bean (super clean)
export function BeanIconFlat({ className = '', size = 'md' }: BeanIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  
  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 20 20" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Super clean flat bean */}
      <path 
        d="M10 2C7 2 4 4 4 7C4 10 5 13 7 15C9 17 11 17 13 15C15 13 16 10 16 7C16 4 13 2 10 2ZM10 5C9.5 6 9 7.5 10 9C11 7.5 10.5 6 10 5Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Alternative: Coffee cup icon (from lucide-react style)
export function BeanIconCoffee({ className = '', size = 'md' }: BeanIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Coffee cup */}
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
}

// Minimal hand-drawn bean using currentColor for Tailwind compatibility
export function BeanIconMinimal({ className = '', size = 'md' }: BeanIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bean body - slightly imperfect oval */}
      <path
        d="M12 3C8.5 3 5 5.5 5 9C5 12.5 6.5 15.5 8.5 17.5C10.5 19.5 13.5 19.5 15.5 17.5C17.5 15.5 19 12.5 19 9C19 5.5 15.5 3 12 3Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      {/* Center crease - hand-drawn S-curve */}
      <path
        d="M12 6C11 8 10.5 10 12 12C13.5 10 13 8 12 6Z"
        fill="rgba(255,255,255,0.3)"
      />
    </svg>
  )
}
