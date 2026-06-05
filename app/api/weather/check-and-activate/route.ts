import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Weather Check & Activate Endpoint
 * Called by cron job to check weather and activate/deactivate rainy day offers
 * Requires CRON_SECRET for security
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!authHeader || !authHeader.includes(`Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // 1. Get location from app_settings (or use Lymington as default)
    const { data: locationSettings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'weather_location')
      .single()

    let lat = 50.7594 // Default: Lymington
    let lon = -1.5339
    let locationName = 'Lymington'

    if (locationSettings?.value) {
      try {
        const locationData = JSON.parse(locationSettings.value)
        lat = locationData.lat || lat
        lon = locationData.lon || lon
        locationName = locationData.name || locationName
      } catch (e) {
        console.log('Using default location (Lymington)')
      }
    }

    // 2. Fetch 5-day weather forecast from OpenWeatherMap
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.error('OPENWEATHER_API_KEY not set')
      return NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 })
    }

    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
      { cache: 'no-store' }
    )

    if (!forecastResponse.ok) {
      throw new Error('Weather forecast API failed')
    }

    const forecastData = await forecastResponse.json()
    
    // Check forecast for lunch period (12 PM - 2 PM today)
    // Forecast returns 3-hour intervals: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
    const today = new Date().toISOString().split('T')[0]
    const lunchForecasts = forecastData.list.filter((item: any) => {
      const forecastDate = item.dt_txt.split(' ')[0]
      const forecastHour = parseInt(item.dt_txt.split(' ')[1].split(':')[0])
      return forecastDate === today && (forecastHour >= 12 && forecastHour <= 15)
    })
    
    // Determine if rain is expected during lunch
    let willRainDuringLunch = false
    let maxRainChance = 0
    let expectedCondition = 'clear'
    let expectedTemp = 20
    
    if (lunchForecasts.length > 0) {
      for (const forecast of lunchForecasts) {
        const weatherMain = forecast.weather[0].main.toLowerCase()
        const rainChance = forecast.pop || 0 // Probability of precipitation
        
        if (rainChance > maxRainChance) {
          maxRainChance = rainChance
        }
        
        if (weatherMain.includes('rain') || weatherMain.includes('drizzle') || rainChance > 50) {
          willRainDuringLunch = true
          expectedCondition = 'rainy'
        } else if (weatherMain.includes('cloud')) {
          expectedCondition = 'cloudy'
        } else if (weatherMain.includes('snow')) {
          expectedCondition = 'snowy'
        } else if (weatherMain.includes('clear') || weatherMain.includes('sun')) {
          expectedCondition = 'sunny'
        }
        
        expectedTemp = Math.round(forecast.main.temp)
      }
    }

    console.log('🌧️ Weather forecast check:', {
      location: locationName,
      date: today,
      lunchForecasts: lunchForecasts.length,
      willRainDuringLunch,
      maxRainChance,
      expectedCondition,
      expectedTemp
    })

    // 3. Update app settings with weather forecast
    await supabase
      .from('app_settings')
      .upsert({
        key: 'current_weather',
        value: JSON.stringify({
          weather: expectedCondition,
          temperature: expectedTemp,
          willRainDuringLunch,
          maxRainChance,
          description: willRainDuringLunch ? 'Rain expected during lunch' : 'No rain expected',
          location: locationName,
          updated_at: new Date().toISOString()
        })
      }, { onConflict: 'key' })

    // 3. Check and activate/deactivate weather offers
    const { data: activationResult, error: activationError } = await supabase
      .rpc('check_and_activate_weather_offers')

    if (activationError) {
      console.error('Weather offer activation error:', activationError)
    } else {
      console.log('Weather offer activation result:', activationResult)
    }

    // 4. If rainy day offer was just activated, send notifications to all users
    if (activationResult && activationResult.length > 0) {
      const activatedOffer = activationResult[0]
      if (activatedOffer.offer_activated && activatedOffer.offer_id) {
        console.log('🌧️ Rainy day offer activated! Sending notifications...')
        
        // Send staff message to all users about rainy day offer
        const { data: staff } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'staff')
          .limit(1)
          .single()

        if (staff) {
          // Import sendStaffMessage dynamically to avoid circular dependency
          const { sendStaffMessage } = await import('@/lib/messaging/send-notification')
          
          await sendStaffMessage({
            title: '🌧️ Rainy Day Rescue!',
            message: 'It\'s raining! Get 20% off any hot drink today. Check your dashboard to claim your voucher!',
            staffId: staff.id,
            channels: { push: true, email: true, inApp: true },
            priority: 5, // High priority
            expiresInHours: 24
          })
          
          // Also send individual notifications using the rainy day template
          const { data: customers } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'customer')

          if (customers && customers.length > 0) {
            const { sendNotification } = await import('@/lib/messaging/send-notification')
            
            // Send to all customers (batch)
            for (const customer of customers) {
              await sendNotification({
                userId: customer.id,
                templateName: 'rainy_day_voucher',
                channels: { push: true, email: true, inApp: true },
                priority: 5,
                expiresInHours: 24
              })
            }
            
            console.log(`🌧️ Sent rainy day notifications to ${customers.length} customers`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      weather: {
        condition: expectedCondition,
        temperature: expectedTemp,
        willRainDuringLunch,
        maxRainChance,
        description: willRainDuringLunch ? 'Rain expected during lunch' : 'No rain expected',
        location: locationName
      },
      activation: activationResult
    })

  } catch (error) {
    console.error('Weather check error:', error)
    return NextResponse.json({ error: 'Weather check failed' }, { status: 500 })
  }
}
