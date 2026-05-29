'use client'

import Image from 'next/image'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-penkey-cream">
      {/* Floating Duck Loading */}
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-penkey-cream/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="mb-4">
            <Image 
              src="/logo.png" 
              alt="Loading" 
              width={100} 
              height={100}
              className="mx-auto drop-shadow-lg"
            />
          </div>
          <p className="text-lg text-penkey-dark font-medium">Loading your dashboard...</p>
          <p className="text-sm text-penkey-gray mt-2">Just a moment!</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: ``}} />

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6 opacity-50">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-penkey-gray-light rounded animate-pulse" />
            <div className="h-4 w-32 bg-penkey-gray-light rounded animate-pulse" />
          </div>
          <div className="h-10 w-10 bg-penkey-gray-light rounded-full animate-pulse" />
        </div>

        {/* Check-in Card Skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 w-32 bg-grey-light rounded animate-pulse mb-4" />
          <div className="h-12 w-full bg-grey-light rounded-lg animate-pulse" />
        </div>

        {/* Duck Pond Skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 w-40 bg-grey-light rounded animate-pulse mb-4" />
          <div className="h-48 w-full bg-grey-light rounded-lg animate-pulse" />
        </div>

        {/* Games Skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 w-32 bg-grey-light rounded animate-pulse mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-grey-light rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
