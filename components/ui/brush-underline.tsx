import React from 'react'

interface BrushUnderlineProps extends React.SVGAttributes<SVGElement> {
  className?: string
}

export function BrushUnderline({ className = '', ...props }: BrushUnderlineProps) {
  return (
    <svg
      viewBox="0 0 100 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M5 5C20 3 35 7 50 5C65 3 80 7 95 5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.85 }}
      />
    </svg>
  )
}
