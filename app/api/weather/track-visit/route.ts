import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, checkInId, weather } = await request.json()

    if (!userId || !weather) {
      return NextResponse.json(
        { error: 'User ID and weather data are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Calculate weather bonus
    const { data: bonusData, error: bonusError } = await supabase
      .rpc('calculate_weather_bonus', {
        p_weather_condition: weather.weather,
        p_temperature: weather.temperature
      })

    if (bonusError) {
      console.error('Error calculating weather bonus:', bonusError)
    }

    const bonus = bonusData?.[0] || { bonus_points: 0, bonus_message: null, bonus_emoji: null }

    // Record weather visit
    const { data: weatherVisit, error: visitError } = await supabase
      .from('weather_visits')
      .insert({
        user_id: userId,
        check_in_id: checkInId,
        weather_condition: weather.weather,
        temperature: weather.temperature,
        feels_like: weather.feels_like,
        humidity: weather.humidity,
        wind_speed: weather.wind_speed,
        bonus_points: bonus.bonus_points || 0,
        bonus_reason: bonus.bonus_message
      })
      .select()
      .single()

    if (visitError) {
      console.error('Error recording weather visit:', visitError)
      return NextResponse.json(
        { error: 'Failed to record weather visit' },
        { status: 500 }
      )
    }

    // Award bonus points if any
    if (bonus.bonus_points > 0) {
      const { error: pointsError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: userId,
          amount: bonus.bonus_points,
          source: 'weather_bonus',
          description: bonus.bonus_message || 'Weather bonus points'
        })

      if (pointsError) {
        console.error('Error awarding bonus points:', pointsError)
      }
    }

    // Check for weather achievements
    const { data: achievements, error: achievementError } = await supabase
      .rpc('check_weather_achievements', {
        p_user_id: userId
      })

    if (achievementError) {
      console.error('Error checking achievements:', achievementError)
    }

    // Award achievement points
    if (achievements && achievements.length > 0) {
      for (const achievement of achievements) {
        if (achievement.reward_points > 0) {
          await supabase
            .from('points_transactions')
            .insert({
              user_id: userId,
              amount: achievement.reward_points,
              source: 'weather_achievement',
              description: `${achievement.achievement_name} achievement unlocked!`
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      weatherVisit,
      bonus: bonus.bonus_points > 0 ? {
        points: bonus.bonus_points,
        message: bonus.bonus_message,
        emoji: bonus.bonus_emoji
      } : null,
      achievements: achievements || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
