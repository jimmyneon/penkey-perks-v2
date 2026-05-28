import React from 'react'

interface SparkLinesProps extends React.SVGAttributes<SVGElement> {
  className?: string
}

export function SparkLines({ className = '', ...props }: SparkLinesProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Three small curved bits radiating outward */}
      <path
        d="M8 2Q6 4, 5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.7 }}
      />
      <path
        d="M8 2Q10 4, 11 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.7 }}
      />
      <path
        d="M8 2L8 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ opacity: 0.8 }}
      />
    </svg>
  )
}
