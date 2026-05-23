'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame, TrendingUp, Award, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface StreakData {
  check_in_streak: number
  check_in_streak_multiplier: number
  longest_streak: number
  total_check_ins: number
  last_check_in: string | null
}

export function StreakCard() {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreakData()
  }, [])

  const fetchStreakData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase
      .from('users')
      .select('check_in_streak, check_in_streak_multiplier, longest_streak, total_check_ins, last_check_in')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setStreakData(data)
    }
    setLoading(false)
  }

  if (loading || !streakData) {
    return null
  }

  const currentStreak = streakData.check_in_streak || 0
  const multiplier = streakData.check_in_streak_multiplier || 1.0
  const longestStreak = streakData.longest_streak || 0
  const totalCheckIns = streakData.total_check_ins || 0

  // Calculate progress to next milestone
  const getNextMilestone = () => {
    if (currentStreak < 3) return { target: 3, multiplier: 1.25, label: 'Bronze Streak' }
    if (currentStreak < 5) return { target: 5, multiplier: 1.5, label: 'Silver Streak' }
    if (currentStreak < 7) return { target: 7, multiplier: 2.0, label: 'Gold Streak' }
    return { target: 7, multiplier: 2.0, label: 'Legendary!' }
  }

  const nextMilestone = getNextMilestone()
  const progressToNext = currentStreak >= 7 ? 100 : (currentStreak / nextMilestone.target) * 100

  const getStreakColor = () => {
    if (currentStreak >= 7) return 'from-yellow-400 to-orange-500'
    if (currentStreak >= 5) return 'from-blue-400 to-purple-500'
    if (currentStreak >= 3) return 'from-green-400 to-blue-500'
    return 'from-gray-400 to-gray-500'
  }

  const getStreakEmoji = () => {
    if (currentStreak >= 7) return '🔥'
    if (currentStreak >= 5) return '⭐'
    if (currentStreak >= 3) return '✨'
    return '💫'
  }

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${getStreakColor()}`} />
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Check-In Streak
        </CardTitle>
        <CardDescription>
          Visit daily to increase your beans multiplier
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-penkey-orange to-yellow-500 bg-clip-text text-transparent mb-2">
            {currentStreak}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mb-4">
            {currentStreak === 1 ? 'Day Streak' : 'Days Streak'} {getStreakEmoji()}
          </div>

          {/* Multiplier Badge */}
          <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r ${getStreakColor()} text-white font-bold shadow-lg text-xs sm:text-base`}>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{multiplier}x Beans Multiplier</span>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {currentStreak < 7 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to {nextMilestone.label}</span>
              <span className="font-semibold text-penkey-orange">
                {currentStreak}/{nextMilestone.target} days
              </span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="text-xs text-gray-500 text-center">
              {nextMilestone.target - currentStreak} more {nextMilestone.target - currentStreak === 1 ? 'day' : 'days'} to unlock {nextMilestone.multiplier}x multiplier!
            </p>
          </div>
        )}

        {/* Streak Milestones */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className={`text-center p-2 sm:p-3 rounded-lg border-2 ${currentStreak >= 3 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="text-xl sm:text-2xl mb-1">{currentStreak >= 3 ? '✅' : '🔒'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-700">3 Days</div>
            <div className="text-[10px] sm:text-xs text-gray-600">1.25x</div>
          </div>

          <div className={`text-center p-2 sm:p-3 rounded-lg border-2 ${currentStreak >= 5 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="text-xl sm:text-2xl mb-1">{currentStreak >= 5 ? '✅' : '🔒'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-700">5 Days</div>
            <div className="text-[10px] sm:text-xs text-gray-600">1.5x</div>
          </div>

          <div className={`text-center p-2 sm:p-3 rounded-lg border-2 ${currentStreak >= 7 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="text-xl sm:text-2xl mb-1">{currentStreak >= 7 ? '✅' : '🔒'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-700">7 Days</div>
            <div className="text-[10px] sm:text-xs text-gray-600">2.0x</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 mb-1">
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs">Longest Streak</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-penkey-dark">{longestStreak}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">days</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 mb-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs">Total Check-Ins</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-penkey-dark">{totalCheckIns}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">visits</div>
          </div>
        </div>

        {/* Motivation Message */}
        <div className="bg-penkey-cream rounded-lg p-3 text-center">
          <p className="text-sm text-penkey-dark">
            {currentStreak === 0 ? (
              <>🎯 Start your streak today! Check in to earn <strong>1.25x beans</strong> after 3 days!</>
            ) : currentStreak < 3 ? (
              <>🔥 Keep it up! {3 - currentStreak} more {3 - currentStreak === 1 ? 'day' : 'days'} to unlock <strong>1.25x beans</strong>!</>
            ) : currentStreak < 5 ? (
              <>⭐ Great streak! {5 - currentStreak} more {5 - currentStreak === 1 ? 'day' : 'days'} to unlock <strong>1.5x beans</strong>!</>
            ) : currentStreak < 7 ? (
              <>🌟 Amazing! {7 - currentStreak} more {7 - currentStreak === 1 ? 'day' : 'days'} to unlock <strong>2x beans</strong>!</>
            ) : (
              <>🏆 Legendary streak! You're earning <strong>double beans</strong> on every visit!</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
