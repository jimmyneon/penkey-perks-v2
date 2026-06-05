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

    // 1. Fetch current weather from OpenWeatherMap
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.error('OPENWEATHER_API_KEY not set')
      return NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 })
    }

    const LYMINGTON_LAT = 50.7594
    const LYMINGTON_LON = -1.5339

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LYMINGTON_LAT}&lon=${LYMINGTON_LON}&appid=${apiKey}&units=metric`,
      { cache: 'no-store' }
    )

    if (!weatherResponse.ok) {
      throw new Error('Weather API failed')
    }

    const weatherData = await weatherResponse.json()
    const weatherMain = weatherData.weather[0].main.toLowerCase()
    const temp = Math.round(weatherData.main.temp)
    
    // Simplify weather conditions
    let weatherCondition = 'clear'
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
      weatherCondition = 'rainy'
    } else if (weatherMain.includes('cloud')) {
      weatherCondition = 'cloudy'
    } else if (weatherMain.includes('snow')) {
      weatherCondition = 'snowy'
    } else if (weatherMain.includes('clear') || weatherMain.includes('sun')) {
      weatherCondition = 'sunny'
    }

    console.log('🌧️ Weather check:', {
      condition: weatherCondition,
      temperature: temp,
      description: weatherData.weather[0].description
    })

    // 2. Update app settings with current weather
    await supabase
      .from('app_settings')
      .upsert({
        key: 'current_weather',
        value: JSON.stringify({
          weather: weatherCondition,
          temperature: temp,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          location: 'Lymington',
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
        condition: weatherCondition,
        temperature: temp,
        description: weatherData.weather[0].description
      },
      activation: activationResult
    })

  } catch (error) {
    console.error('Weather check error:', error)
    return NextResponse.json({ error: 'Weather check failed' }, { status: 500 })
  }
}
