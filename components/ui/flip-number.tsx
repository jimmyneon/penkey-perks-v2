'use client'

import { useEffect, useState } from 'react'

interface FlipNumberProps {
  value: number
  className?: string
  style?: React.CSSProperties
}

export function FlipNumber({ value, className = '', style }: FlipNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true)
      setDisplayValue(value)
      setTimeout(() => setIsAnimating(false), 600)
    }
  }, [value, displayValue])

  return (
    <span
      className={`inline-block ${isAnimating ? 'animate-bounce' : ''} ${className}`}
      style={style}
    >
      {displayValue}
    </span>
  )
}
