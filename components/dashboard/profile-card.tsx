'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Award, Calendar, TrendingUp, X, Info } from 'lucide-react'
import { getWelcomeMessage } from '@/lib/rotating-messages'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProfileCardProps {
  user: {
    name: string
    email: string
    avatar_url?: string | null
  }
  badge: {
    name: string
    title: string
    tier: string
  }
  lifetimePoints: number
  memberSince: string
  lastVisit?: string | null
  hasCheckedInToday?: boolean
}

export function ProfileCard({ user, badge, lifetimePoints, memberSince, lastVisit, hasCheckedInToday = false }: ProfileCardProps) {
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [showLifetimeModal, setShowLifetimeModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const memberDate = new Date(memberSince).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric'
  })

  const memberDateFull = new Date(memberSince).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <>
      <Card className="border-penkey-orange bg-gradient-to-br from-white to-penkey-cream">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-penkey-orange">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-penkey-orange text-white text-sm sm:text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-penkey-dark">{user.name}</h2>
                <p className="text-xs sm:text-sm text-penkey-orange font-medium">
                  {getWelcomeMessage(lastVisit || null, hasCheckedInToday)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Badge - Clickable */}
            <button
              onClick={() => setShowBadgeModal(true)}
              className="flex flex-col items-center p-2 sm:p-3 bg-white rounded-lg border border-penkey-orange/20 hover:border-penkey-orange hover:shadow-md transition-all cursor-pointer group"
            >
              <Award className="w-4 h-4 sm:w-6 sm:h-6 text-penkey-orange mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] sm:text-xs text-penkey-gray mb-1">Badge</p>
              <Badge variant="secondary" className="bg-penkey-orange text-white text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                {badge.title}
              </Badge>
              <Info className="w-3 h-3 text-penkey-gray/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Lifetime Beans - Clickable */}
            <button
              onClick={() => setShowLifetimeModal(true)}
              className="flex flex-col items-center p-2 sm:p-3 bg-white rounded-lg border border-penkey-orange/20 hover:border-penkey-orange hover:shadow-md transition-all cursor-pointer group"
            >
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-penkey-orange mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] sm:text-xs text-penkey-gray mb-1">Lifetime</p>
              <p className="text-sm sm:text-lg font-bold text-penkey-dark">{lifetimePoints}</p>
              <p className="text-[10px] sm:text-xs text-penkey-gray">beans</p>
              <Info className="w-3 h-3 text-penkey-gray/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Member Since - Clickable */}
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex flex-col items-center p-2 sm:p-3 bg-white rounded-lg border border-penkey-orange/20 hover:border-penkey-orange hover:shadow-md transition-all cursor-pointer group"
            >
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-penkey-orange mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] sm:text-xs text-penkey-gray mb-1">Member</p>
              <p className="text-xs sm:text-sm font-medium text-penkey-dark">{memberDate}</p>
              <Info className="w-3 h-3 text-penkey-gray/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Badge Modal */}
      <Dialog open={showBadgeModal} onOpenChange={setShowBadgeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-penkey-orange" />
              Your Badge: {badge.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Learn about your current badge tier and how to level up
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-penkey-cream rounded-lg border border-penkey-orange/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-penkey-dark">Current Badge:</span>
                <Badge className="bg-penkey-orange text-white">{badge.title}</Badge>
              </div>
              <p className="text-sm text-penkey-gray">
                Badge Name: <span className="font-medium text-penkey-dark">{badge.name}</span>
              </p>
              <p className="text-sm text-penkey-gray">
                Tier Level: <span className="font-medium text-penkey-dark capitalize">{badge.tier}</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-penkey-dark">How to Level Up</h4>
              <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                <li>Earn more beans by playing games</li>
                <li>Check in regularly to build your streak</li>
                <li>Redeem rewards to show your loyalty</li>
                <li>Refer friends to join Penkey Perks</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lifetime Beans Modal */}
      <Dialog open={showLifetimeModal} onOpenChange={setShowLifetimeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-penkey-orange" />
              Lifetime Beans
            </DialogTitle>
            <DialogDescription className="text-sm">
              Your total beans earned since joining Penkey Perks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-penkey-cream to-orange-50 rounded-lg border border-penkey-orange/20">
              <p className="text-3xl sm:text-5xl font-bold text-penkey-dark mb-2">{lifetimePoints.toLocaleString()}</p>
              <p className="text-sm text-penkey-gray">Total Beans Earned</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-penkey-dark">What are Beans?</h4>
              <p className="text-sm text-penkey-gray">
                Beans are your reward currency at Penkey! Earn them by:
              </p>
              <ul className="text-sm text-penkey-gray space-y-1 list-disc list-inside">
                <li>Playing daily games</li>
                <li>Checking in at Penkey</li>
                <li>Referring friends</li>
                <li>Celebrating your birthday</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/points/history">
                <Button variant="outline" className="w-full">
                  View History
                </Button>
              </Link>
              <Link href="/rewards">
                <Button className="w-full bg-penkey-orange hover:bg-orange-600">
                  Redeem Beans
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Since Modal */}
      <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-penkey-orange" />
              Member Since
            </DialogTitle>
            <DialogDescription className="text-sm">
              Your journey with Penkey Perks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-penkey-cream to-orange-50 rounded-lg border border-penkey-orange/20">
              <p className="text-lg sm:text-2xl font-bold text-penkey-dark mb-2">{memberDateFull}</p>
              <p className="text-sm text-penkey-gray">You joined the Penkey family!</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-penkey-orange/20">
                <span className="text-sm text-penkey-gray">Lifetime Beans</span>
                <span className="font-semibold text-penkey-dark">{lifetimePoints}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-penkey-orange/20">
                <span className="text-sm text-penkey-gray">Current Badge</span>
                <Badge className="bg-penkey-orange text-white text-xs">{badge.title}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-penkey-dark">Keep Growing!</h4>
              <p className="text-sm text-penkey-gray">
                Continue earning beans, unlocking badges, and enjoying exclusive rewards at Penkey!
              </p>
            </div>

            <Link href="/profile">
              <Button className="w-full bg-penkey-orange hover:bg-orange-600">
                View Full Profile
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
