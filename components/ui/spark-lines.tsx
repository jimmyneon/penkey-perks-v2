import React from 'react'

interface SparkLinesProps extends React.SVGAttributes<SVGElement> {
  className?: string
}

export function SparkLines({ className = '', ...props }: SparkLinesProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Small decorative spark lines radiating outward */}
      <path
        d="M10 2L10 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.7 }}
      />
      <path
        d="M10 15L10 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.7 }}
      />
      <path
        d="M2 10L5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.7 }}
      />
      <path
        d="M15 10L18 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.7 }}
      />
      {/* Diagonal rays */}
      <path
        d="M4 4L6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.5 }}
      />
      <path
        d="M14 14L16 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.5 }}
      />
      <path
        d="M16 4L14 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.5 }}
      />
      <path
        d="M6 14L4 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.5 }}
      />
    </svg>
  )
}
