'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coffee, CheckCircle, XCircle, Loader2, MapPin } from 'lucide-react'
import { Confetti } from '@/components/confetti'

interface AddCoffeeClientProps {
  userId: string
  userName: string
  initialStampCount: number
}

export function AddCoffeeClient({ userId, userName, initialStampCount }: AddCoffeeClientProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'location'>('location')
  const [message, setMessage] = useState('')
  const [stampCount, setStampCount] = useState(initialStampCount)
  const [showConfetti, setShowConfetti] = useState(false)
  const [milestoneReached, setMilestoneReached] = useState(false)
  const router = useRouter()

  // Get user's GPS location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Geolocation is not supported by your browser')
      return
    }

    setStatus('loading')
    setMessage('Getting your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        addCoffeeStamp(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        setStatus('error')
        if (error.code === error.PERMISSION_DENIED) {
          setMessage('Location permission denied. Please enable location services.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setMessage('Location unavailable. Please try again.')
        } else if (error.code === error.TIMEOUT) {
          setMessage('Location request timed out. Please try again.')
        } else {
          setMessage('Unable to get your location. Please try again.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const addCoffeeStamp = async (latitude: number, longitude: number) => {
    setStatus('loading')
    setMessage('Adding your stamp...')
    
    try {
      const response = await fetch('/api/add-coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
        setStampCount(data.stamp_count)
        setMilestoneReached(data.milestone_reached)
        if (data.milestone_reached) {
          setShowConfetti(true)
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to add coffee stamp')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-penkey-cream flex items-center justify-center p-4">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'location' && (
            <>
              <div className="w-20 h-20 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-penkey-orange" />
              </div>
              <CardTitle className="text-2xl">Add Coffee Stamp</CardTitle>
              <CardDescription>We need to verify you're at Penkey</CardDescription>
            </>
          )}

          {status === 'loading' && (
            <>
              <div className="w-20 h-20 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-penkey-orange animate-spin" />
              </div>
              <CardTitle className="text-2xl">{message}</CardTitle>
              <CardDescription>Please wait...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-penkey-orange/10 flex items-center justify-center mx-auto mb-4">
                {milestoneReached ? (
                  <CheckCircle className="w-10 h-10 text-penkey-orange animate-bounce" />
                ) : (
                  <Coffee className="w-10 h-10 text-penkey-orange" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {milestoneReached ? 'Free Coffee Earned!' : 'Stamp Added!'}
              </CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Oops!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center p-6 bg-penkey-orange/5 rounded-lg border border-penkey-orange/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                {Array.from({ length: Math.min(stampCount, 10) }).map((_, i) => (
                  <Coffee key={i} className="w-5 h-5 text-penkey-orange" />
                ))}
                {Array.from({ length: Math.max(0, 10 - (stampCount % 10)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-5 h-5 rounded-full border-2 border-dashed border-penkey-gray-light" />
                ))}
              </div>
              <p className="text-2xl font-bold text-penkey-orange">{stampCount % 10}/10</p>
              <p className="text-sm text-penkey-gray mt-1">
                {10 - (stampCount % 10)} more for a free coffee!
              </p>
            </div>
          )}

          {status === 'location' && (
            <div className="space-y-3">
              <div className="p-4 bg-penkey-orange/10 border border-penkey-orange/20 rounded-lg">
                <p className="text-sm text-penkey-dark">
                  ☕ Add a stamp when you buy a coffee at Penkey!
                </p>
                <p className="text-xs text-penkey-gray mt-1">
                  We'll verify you're at our location using GPS
                </p>
              </div>
              
              <Button
                size="lg"
                className="w-full"
                onClick={getLocation}
              >
                <Coffee className="w-5 h-5 mr-2" />
                Add Coffee Stamp
              </Button>
            </div>
          )}

          {status !== 'location' && (
            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                {status === 'success' ? 'View Dashboard' : 'Back to Dashboard'}
              </Button>

              {status === 'error' && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStatus('location')}
                >
                  Try Again
                </Button>
              )}
            </div>
          )}

          {status === 'location' && (
            <p className="text-xs text-center text-penkey-gray">
              Current stamps: {initialStampCount}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
