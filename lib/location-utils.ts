/**
 * Location utilities for GPS detection
 * 
 * 📍 SETUP REQUIRED:
 * 1. Find Penkey's GPS coordinates using Google Maps
 * 2. Right-click on Penkey location → Click coordinates
 * 3. Replace the values below
 * 4. Test at /test-gps
 * 
 * See GPS_SETUP_GUIDE.md for detailed instructions
 */

// 🎯 Penkey's GPS Location
// Penkey Deli, Isle of Wight
const PENKEY_LOCATION = {
  latitude: 50.7586,   // Isle of Wight
  longitude: -1.5423,  // Isle of Wight
}

// 📏 How close customers need to be (in meters)
// 100m = ~1 city block, 50m = very strict, 200m = lenient
const NEARBY_RADIUS = 100 // meters

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Get user's current location and optionally save to database
 */
export async function getUserLocation(saveToDb = false): Promise<{
  latitude: number
  longitude: number
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        // Save to database if requested
        if (saveToDb) {
          try {
            await fetch('/api/update-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(location)
            })
          } catch (error) {
            console.error('Failed to save location to database:', error)
            // Don't fail the whole operation if DB save fails
          }
        }

        resolve(location)
      },
      () => {
        resolve(null)
      },
      { timeout: 5000, enableHighAccuracy: true }
    )
  })
}

/**
 * Check if user is near Penkey
 * Automatically saves location to database
 */
export async function isNearPenkey(): Promise<boolean> {
  const location = await getUserLocation(true) // Save to DB
  if (!location) return false

  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    PENKEY_LOCATION.latitude,
    PENKEY_LOCATION.longitude
  )

  return distance <= NEARBY_RADIUS
}

/**
 * Get distance to Penkey in meters
 */
export async function getDistanceToPenkey(): Promise<number | null> {
  const location = await getUserLocation()
  if (!location) return null

  return calculateDistance(
    location.latitude,
    location.longitude,
    PENKEY_LOCATION.latitude,
    PENKEY_LOCATION.longitude
  )
}
