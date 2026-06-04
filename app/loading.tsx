'use client'

import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="text-center">
        <Image 
          src="/logo.webp" 
          alt="PENKEY Perks" 
          width={140} 
          height={140}
          className="mx-auto"
        />
      </div>
    </div>
  )
}
