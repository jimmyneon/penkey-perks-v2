import React from 'react'

interface BrushUnderlineProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

export function BrushUnderline({ className = '', ...props }: BrushUnderlineProps) {
  return (
    <img
      src="/stroke.png"
      alt=""
      className={className}
      {...props}
    />
  )
}
