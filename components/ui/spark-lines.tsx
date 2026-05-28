import React from 'react'

interface SparkLinesProps extends React.SVGAttributes<SVGElement> {
  className?: string
}

export function SparkLines({ className = '', ...props }: SparkLinesProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Top ray */}
      <path
        d="M12 2L14 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ opacity: 0.8 }}
      />
      {/* Middle ray (longer) */}
      <path
        d="M12 2L12 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ opacity: 0.9 }}
      />
      {/* Bottom ray */}
      <path
        d="M12 2L10 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ opacity: 0.8 }}
      />
    </svg>
  )
}
