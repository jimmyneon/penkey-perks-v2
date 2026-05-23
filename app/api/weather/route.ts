import { NextResponse } from 'next/server'

// Lymington coordinates
const LYMINGTON_LAT = 50.7594
const LYMINGTON_LON = -1.5339

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    
    if (!apiKey) {
      console.error('OPENWEATHER_API_KEY not set')
      return NextResponse.json({
        weather: 'unknown',
        temperature: null,
        description: 'Weather unavailable'
      })
    }

    // Fetch weather from OpenWeatherMap
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LYMINGTON_LAT}&lon=${LYMINGTON_LON}&appid=${apiKey}&units=metric`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    )

    if (!response.ok) {
      throw new Error('Weather API failed')
    }

    const data = await response.json()

    // Simplify weather conditions
    const weatherMain = data.weather[0].main.toLowerCase()
    const temp = Math.round(data.main.temp)
    
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
    
    console.log('🌤️ Weather API response:', {
      raw: weatherMain,
      simplified: weatherCondition,
      temperature: temp,
      description: data.weather[0].description
    })

    return NextResponse.json({
      weather: weatherCondition,
      temperature: temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      location: 'Lymington'
    })

  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json({
      weather: 'unknown',
      temperature: null,
      description: 'Weather unavailable'
    })
  }
}
