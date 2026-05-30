'use client'

import { useEffect, useState } from 'react'

interface FlipNumberProps {
  value: number
  className?: string
  style?: React.CSSProperties
}

export function FlipNumber({ value, className = '', style }: FlipNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsPulsing(true)
      setDisplayValue(value)
      setTimeout(() => setIsPulsing(false), 300)
    }
  }, [value, displayValue])

  return (
    <span
      className={`inline-block transition-transform duration-300 ${isPulsing ? 'scale-125' : 'scale-100'} ${className}`}
      style={style}
    >
      {displayValue}
    </span>
  )
}
