import React from 'react'

interface GiftIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

export function GiftIcon({ className = '', ...props }: GiftIconProps) {
  return (
    <img
      src="/gift.webp"
      alt=""
      className={className}
      {...props}
    />
  )
}
