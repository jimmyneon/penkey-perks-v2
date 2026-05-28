import React from 'react'

interface SparkLinesProps extends React.SVGAttributes<SVGElement> {
  className?: string
}

export function SparkLines({ className = '', ...props }: SparkLinesProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Three small lines radiating upward */}
      <path
        d="M6 1L6 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.8 }}
      />
      <path
        d="M4 2L5 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.6 }}
      />
      <path
        d="M8 2L7 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.6 }}
      />
    </svg>
  )
}
