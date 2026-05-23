'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Coffee, Clock, Zap } from 'lucide-react'

interface TodayActivityProps {
  canCheckIn: boolean
  lastVisit: string | null
  pointsEarnedToday: number
}

export function TodayActivity({ canCheckIn, lastVisit, pointsEarnedToday: beansEarnedToday }: TodayActivityProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={canCheckIn ? 'border-penkey-border' : 'border-penkey-orange border-2'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-penkey-dark">
          <Zap className="w-5 h-5 text-penkey-orange" />
          Today's Activity
        </CardTitle>
        <CardDescription>
          {canCheckIn ? 'Ready for your next visit!' : 'Thanks for visiting today!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Check-in Status */}
          <div className="flex items-center justify-between p-4 bg-penkey-cream rounded-lg">
            <div className="flex items-center gap-3">
              {canCheckIn ? (
                <div className="w-10 h-10 rounded-full bg-penkey-orange/10 flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-penkey-orange" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-penkey-orange flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-medium text-penkey-dark">
                  {canCheckIn ? 'Ready to Check In' : 'Checked In'}
                </p>
                <p className="text-sm text-penkey-gray">
                  {canCheckIn ? 'Visit us to earn beans' : 'Come back tomorrow!'}
                </p>
              </div>
            </div>
            {!canCheckIn && beansEarnedToday > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-penkey-orange">+{beansEarnedToday}</p>
                <p className="text-xs text-penkey-gray">beans today</p>
              </div>
            )}
          </div>

          {/* Last Visit */}
          {lastVisit && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-penkey-border">
              <Clock className="w-5 h-5 text-penkey-gray" />
              <div>
                <p className="text-sm font-medium text-penkey-dark">Last Visit</p>
                <p className="text-sm text-penkey-gray">{formatDate(lastVisit)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
