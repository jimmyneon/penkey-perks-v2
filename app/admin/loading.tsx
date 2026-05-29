'use client'

import Image from 'next/image'

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Floating Logo Loading */}
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="mb-4">
            <Image 
              src="/logo.png" 
              alt="PENKEY Perks" 
              width={100} 
              height={100}
              className="mx-auto drop-shadow-lg"
            />
          </div>
          <p className="text-lg text-penkey-dark font-medium">Loading admin...</p>
          <p className="text-sm text-penkey-gray mt-2">Just a moment!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 opacity-50">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-grey-light rounded animate-pulse" />
          <div className="h-4 w-64 bg-grey-light rounded animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-4 w-24 bg-grey-light rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-grey-light rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 w-32 bg-grey-light rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-grey-light rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
