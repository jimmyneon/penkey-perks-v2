'use client'

import { useEffect, useState } from 'react'

interface FlipNumberProps {
  value: number
  className?: string
  style?: React.CSSProperties
}

export function FlipNumber({ value, className = '', style }: FlipNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true)
      setTimeout(() => {
        setDisplayValue(value)
        setIsFlipping(false)
      }, 150)
    }
  }, [value, displayValue])

  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <div
        className={`transition-all duration-150 ${isFlipping ? 'translate-y-[-50%] opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        {displayValue}
      </div>
      {isFlipping && (
        <div
          className="absolute top-0 left-0 w-full transition-all duration-150 translate-y-[50%] opacity-0"
        >
          {value}
        </div>
      )}
    </div>
  )
}
