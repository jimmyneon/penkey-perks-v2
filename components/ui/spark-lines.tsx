import React from 'react'

interface SparkLinesProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

export function SparkLines({ className = '', ...props }: SparkLinesProps) {
  return (
    <img
      src="/sparks.webp"
      alt=""
      className={className}
      {...props}
    />
  )
}
