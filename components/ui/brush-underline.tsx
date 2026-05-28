import React from 'react'

interface BrushUnderlineProps extends React.SVGAttributes<SVGElement> {
  className?: string
}

export function BrushUnderline({ className = '', ...props }: BrushUnderlineProps) {
  return (
    <svg
      viewBox="0 0 120 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M2 6C15 2 35 10 50 8C65 6 85 2 98 6C105 8 112 4 118 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.9 }}
      />
    </svg>
  )
}
