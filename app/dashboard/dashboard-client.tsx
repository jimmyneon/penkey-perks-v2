'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { DuckPond } from '@/components/duck-pond'
// import { GameTile } from '@/components/game-tile'
import { Confetti } from '@/components/confetti'
import { LogOut, Gift, Users, CheckCircle, RefreshCw, Coffee, Sparkles, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { BottomNavigation } from '@/components/bottom-navigation'

interface DashboardClientProps {
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  }
  duckCount: number
  lastVisit: string | null
  canCheckIn: boolean
  userRewards: any[]
  games: any[]
  playedGameIds: string[]
  referralStats: {
    total: number
    confirmed: number
  }
}

export function DashboardClient({
  user,
  duckCount: initialDuckCount,
  lastVisit,
  canCheckIn: initialCanCheckIn,
  userRewards,
  games,
  playedGameIds: initialPlayedGameIds,
  referralStats,
}: DashboardClientProps) {
  const [duckCount, setDuckCount] = useState(initialDuckCount)
  const [canCheckIn, setCanCheckIn] = useState(initialCanCheckIn)
  const [playedGameIds, setPlayedGameIds] = useState(initialPlayedGameIds)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Pull-to-refresh functionality
  useEffect(() => {
    let startY = 0
    const threshold = 80

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        setPullStartY(startY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0) return
      
      const currentY = e.touches[0].clientY
      const distance = currentY - startY

      if (distance > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(distance, threshold * 1.5))
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > threshold) {
        setIsRefreshing(true)
        router.refresh()
        
        setTimeout(() => {
          setIsRefreshing(false)
          toast({
            title: 'Refreshed!',
            description: 'Dashboard updated',
          })
        }, 1000)
      }
      
      setPullDistance(0)
      setPullStartY(0)
      startY = 0
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, router, toast])

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check in')
      }

      setDuckCount(data.duckCount)
      setCanCheckIn(false)
      setShowConfetti(true)

      toast({
        title: 'Success! You earned a visit!',
        description: data.message,
      })

      // Refresh to show new rewards if any
      if (data.newRewards && data.newRewards.length > 0) {
        setTimeout(() => {
          router.refresh()
        }, 2000)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleGameClick = (gameId: string, gameName: string) => {
    if (playedGameIds.includes(gameId)) {
      toast({
        title: 'Already played today!',
        description: 'Come back tomorrow for another chance to play.',
      })
      return
    }

    router.push(`/games/${gameName}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#F6F1E8] relative">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Pull-to-Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 flex items-center justify-center bg-[#D98A4E] text-white transition-all z-50"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / 80 
          }}
        >
          <RefreshCw 
            className={`w-6 h-6 ${isRefreshing || pullDistance > 80 ? 'animate-spin' : ''}`}
          />
        </div>
      )}

      {/* Header - Premium Clean Design */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#EFE7DC] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D98A4E]/10 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-[#D98A4E]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#2A2A2A]">Good morning, {user.name.split(' ')[0]}</h1>
              <p className="text-sm text-[#6A4B3A]">Welcome to Penkey</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="rounded-xl"
            aria-label="Log out of your account"
          >
            <LogOut className="w-5 h-5 text-[#6A4B3A]" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>

      {/* Main Content - Premium Mobile-First Layout */}
      <main className="container mx-auto px-4 py-6 space-y-5 max-w-lg pb-20">
        {/* Bean Balance Card - Premium Hero */}
        <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#6A4B3A] mb-1">Your Balance</p>
                <p className="text-4xl font-bold text-[#2A2A2A]">{duckCount}</p>
                <p className="text-sm text-[#6A4B3A]">beans</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-[#D98A4E] flex items-center justify-center">
                <Coffee className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="h-2 bg-[#EFE7DC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D98A4E] rounded-full transition-all duration-500"
                style={{ width: `${(duckCount / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[#6A4B3A] mt-2 text-center">
              {duckCount >= 10 ? 'Reward unlocked!' : `${10 - duckCount} beans to next reward`}
            </p>
          </CardContent>
        </Card>

        {/* Check-in Card - Clean Modern */}
        <Card className="bg-white border-0 shadow-sm rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#2A2A2A] mb-1">Today's Visit</h3>
                <p className="text-sm text-[#6A4B3A]">
                  {canCheckIn ? 'Tap to check in at the café' : 'Already checked in today'}
                </p>
              </div>
              <Button
                onClick={handleCheckIn}
                disabled={!canCheckIn || isCheckingIn}
                className="rounded-2xl bg-[#D98A4E] hover:bg-[#C89B3C] text-white h-12 px-6 font-medium"
              >
                {isCheckingIn ? 'Checking in...' : canCheckIn ? 'Check In' : 'Done'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Rewards - Premium Card Style */}
        {userRewards.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#2A2A2A] mb-3">Your Rewards</h2>
            <div className="space-y-3">
              {userRewards.slice(0, 3).map((reward) => (
                <Card key={reward.id} className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D98A4E]/10 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-6 h-6 text-[#D98A4E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#2A2A2A] truncate">{reward.reward_name}</h3>
                        <p className="text-sm text-[#6A4B3A]">{reward.status === 'active' ? 'Ready to redeem' : 'Redeemed'}</p>
                      </div>
                      {reward.status === 'active' && (
                        <ChevronRight className="w-5 h-5 text-[#6A4B3A]" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/rewards" className="block">
            <Card className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#D98A4E]/10 flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-5 h-5 text-[#D98A4E]" />
                </div>
                <p className="text-sm font-medium text-[#2A2A2A]">Rewards</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/profile" className="block">
            <Card className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#6A4B3A]/10 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-[#6A4B3A]" />
                </div>
                <p className="text-sm font-medium text-[#2A2A2A]">Profile</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  )
}
