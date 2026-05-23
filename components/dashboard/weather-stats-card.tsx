'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Cloud, CloudRain, CloudSnow, Sun, Thermometer, Award } from 'lucide-react'

interface WeatherStatsCardProps {
  stats: {
    total_weather_visits?: number
    unique_conditions_visited?: number
    total_weather_bonus_points?: number
    rainy_day_visits?: number
    snowy_day_visits?: number
    hot_day_visits?: number
    cold_day_visits?: number
  }
  achievements?: Array<{
    achievement_name: string
    badge_emoji: string
    earned_at: string
  }>
}

export function WeatherStatsCard({ stats, achievements = [] }: WeatherStatsCardProps) {
  if (!stats || stats.total_weather_visits === 0) {
    return null
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Cloud className="w-5 h-5" />
          Weather Warrior Stats
        </CardTitle>
        <CardDescription className="text-blue-700">
          You've earned {stats.total_weather_bonus_points || 0} bonus points from weather visits!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather visit counts */}
        <div className="grid grid-cols-2 gap-3">
          {(stats.rainy_day_visits ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="bg-blue-100 rounded-lg p-3 text-center"
            >
              <CloudRain className="w-6 h-6 mx-auto text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-blue-900">{stats.rainy_day_visits}</p>
              <p className="text-xs text-blue-700">Rainy Days</p>
            </motion.div>
          )}
          
          {(stats.snowy_day_visits ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="bg-indigo-100 rounded-lg p-3 text-center"
            >
              <CloudSnow className="w-6 h-6 mx-auto text-indigo-600 mb-1" />
              <p className="text-2xl font-bold text-indigo-900">{stats.snowy_day_visits}</p>
              <p className="text-xs text-indigo-700">Snowy Days</p>
            </motion.div>
          )}
          
          {(stats.hot_day_visits ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="bg-orange-100 rounded-lg p-3 text-center"
            >
              <Sun className="w-6 h-6 mx-auto text-orange-600 mb-1" />
              <p className="text-2xl font-bold text-orange-900">{stats.hot_day_visits}</p>
              <p className="text-xs text-orange-700">Hot Days (25°C+)</p>
            </motion.div>
          )}
          
          {(stats.cold_day_visits ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="bg-cyan-100 rounded-lg p-3 text-center"
            >
              <Thermometer className="w-6 h-6 mx-auto text-cyan-600 mb-1" />
              <p className="text-2xl font-bold text-cyan-900">{stats.cold_day_visits}</p>
              <p className="text-xs text-cyan-700">Cold Days (&lt;5°C)</p>
            </motion.div>
          )}
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <Award className="w-4 h-4" />
              Weather Achievements
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.achievement_name}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: index * 0.1 }}
                >
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    {achievement.badge_emoji} {achievement.achievement_name}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Progress to next achievement */}
        {(stats.rainy_day_visits ?? 0) > 0 && (stats.rainy_day_visits ?? 0) < 5 && (
          <div className="bg-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700 mb-1">Next Achievement:</p>
            <p className="text-sm font-medium text-blue-900">
              🌧️ Rain Warrior ({stats.rainy_day_visits ?? 0}/5 rainy days)
            </p>
            <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${((stats.rainy_day_visits ?? 0) / 5) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
