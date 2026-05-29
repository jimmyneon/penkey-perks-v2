'use client'

import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-penkey-cream overflow-hidden">
      <div className="text-center">
        <div className="mb-4">
          <div style={{ animation: 'bounce 1.2s ease-in-out infinite' }}>
            <Image 
              src="/logo.png" 
              alt="PENKEY Perks" 
              width={120} 
              height={120}
              className="mx-auto drop-shadow-lg"
              style={{
                animation: 'spin 1.5s linear infinite'
              }}
            />
          </div>
        </div>
        <p className="text-lg text-penkey-dark font-medium">Loading...</p>
        <p className="text-sm text-penkey-gray mt-2">Just a moment!</p>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% {
            transform: rotateZ(0deg);
          }
          100% {
            transform: rotateZ(360deg);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-70px);
          }
        }
      `}} />
    </div>
  )
}
