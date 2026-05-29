'use client'

import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-penkey-cream overflow-hidden">
      <div className="text-center">
        <div className="mb-4">
          <Image 
            src="/logo.png" 
            alt="PENKEY Perks" 
            width={120} 
            height={120}
            className="mx-auto drop-shadow-lg"
          />
        </div>
        <p className="text-lg text-penkey-dark font-medium">Loading...</p>
        <p className="text-sm text-penkey-gray mt-2">Just a moment!</p>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: ``}} />
    </div>
  )
}
