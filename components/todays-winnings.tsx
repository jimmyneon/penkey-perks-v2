'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface TodaysWinningsProps {
  userId: string
}

interface WinningsSummary {
  totalPoints: number
  totalStamps: number
  rewardsWon: number
  gamesPlayed: number
}

export function TodaysWinnings({ userId }: TodaysWinningsProps) {
  const [winnings, setWinnings] = useState<WinningsSummary>({
    totalPoints: 0,
    totalStamps: 0,
    rewardsWon: 0,
    gamesPlayed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodaysWinnings()
  }, [userId])

  const loadTodaysWinnings = async () => {
    try {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get today's game plays
      const { data: plays } = await supabase
        .from('game_plays')
        .select('prize_type, prize_value, reward_id')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      if (!plays) {
        setLoading(false)
        return
      }

      const summary: WinningsSummary = {
        totalPoints: 0,
        totalStamps: 0,
        rewardsWon: 0,
        gamesPlayed: plays.length,
      }

      plays.forEach(play => {
        if (play.prize_type === 'points' && play.prize_value) {
          summary.totalPoints += play.prize_value
        } else if (play.prize_type === 'stamps' && play.prize_value) {
          summary.totalStamps += play.prize_value
        } else if (play.prize_type === 'reward' && play.reward_id) {
          summary.rewardsWon += 1
        }
      })

      setWinnings(summary)
    } catch (error) {
      console.error('Failed to load winnings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if no games played today
  if (!loading && winnings.gamesPlayed === 0) {
    return null
  }

  const hasWinnings = winnings.totalPoints > 0 || winnings.totalStamps > 0 || winnings.rewardsWon > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-penkey-orange bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-penkey-dark">
            <Sparkles className="w-5 h-5 text-penkey-orange" />
            Today's Game Winnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-penkey-orange"></div>
            </div>
          ) : hasWinnings ? (
            <div className="grid grid-cols-3 gap-4">
              {winnings.totalPoints > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="text-center p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="text-3xl mb-1">⭐</div>
                  <div className="text-2xl font-bold text-yellow-600">+{winnings.totalPoints}</div>
                  <div className="text-xs text-gray-600">Beans</div>
                </motion.div>
              )}
              
              {winnings.totalStamps > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="text-center p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="text-3xl mb-1">☕</div>
                  <div className="text-2xl font-bold text-penkey-orange">+{winnings.totalStamps}</div>
                  <div className="text-xs text-gray-600">Stamps</div>
                </motion.div>
              )}
              
              {winnings.rewardsWon > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-center p-3 bg-white rounded-lg border border-green-200"
                >
                  <div className="text-3xl mb-1">🎁</div>
                  <div className="text-2xl font-bold text-green-600">{winnings.rewardsWon}</div>
                  <div className="text-xs text-gray-600">Rewards</div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">You played {winnings.gamesPlayed} game{winnings.gamesPlayed !== 1 ? 's' : ''} today!</p>
              <p className="text-xs mt-1">Better luck tomorrow! 🍀</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
