'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    console.error('Application error:', error)
  }, [error])

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
        <p className="text-gray-600 mb-4">Don't worry, our ducks are working on it!</p>
        <div className="p-4 bg-gray-100 rounded-lg mb-4">
          <p className="text-sm text-gray-600">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
