'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getUserLocation, getDistanceToPenkey } from '@/lib/location-utils'

export default function TestGPSPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testGPS = async () => {
    setTesting(true)
    setResult(null)

    try {
      // Get user location
      const location = await getUserLocation()

      if (!location) {
        setResult({
          success: false,
          error: 'Could not get your location. Please enable location services in your browser.',
        })
        setTesting(false)
        return
      }

      // Get distance to Penkey
      const distance = await getDistanceToPenkey()

      setResult({
        success: true,
        latitude: location.latitude,
        longitude: location.longitude,
        distance: distance ? Math.round(distance) : null,
        isNear: distance ? distance <= 100 : false,
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to test GPS',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-penkey-cream p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-penkey-orange" />
              GPS Testing Tool
            </CardTitle>
            <CardDescription>
              Test if GPS location services are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testGPS}
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing GPS...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Test GPS Location
                </>
              )}
            </Button>

            {result && (
              <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="pt-6">
                  {result.success ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-bold text-lg">GPS Working!</span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Latitude:</span>
                          <span className="font-mono">{result.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Longitude:</span>
                          <span className="font-mono">{result.longitude.toFixed(6)}</span>
                        </div>
                        {result.distance !== null && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance to Penkey:</span>
                              <span className="font-bold">{result.distance}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Within Range:</span>
                              <span className={result.isNear ? 'text-green-600 font-bold' : 'text-red-600'}>
                                {result.isNear ? '✅ Yes (within 100m)' : '❌ No (too far)'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {result.isNear && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            🎉 You're at Penkey! QR scanner will be visible on dashboard.
                          </p>
                        </div>
                      )}

                      {!result.isNear && result.distance !== null && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800">
                            📍 You're {result.distance}m away from Penkey. Get within 100m to use location features.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-6 h-6" />
                        <span className="font-bold text-lg">GPS Not Working</span>
                      </div>
                      <p className="text-sm text-gray-600">{result.error}</p>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium mb-2">
                          How to fix:
                        </p>
                        <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                          <li>Enable location services in your browser settings</li>
                          <li>Allow location access when prompted</li>
                          <li>Make sure you're not in private/incognito mode</li>
                          <li>Check your device location settings</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <h3 className="font-bold text-sm mb-2">📍 Penkey Location</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Penkey Deli, Isle of Wight:
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <div>Latitude: 50.7586</div>
                  <div>Longitude: -1.5423</div>
                </div>
                <p className="text-xs text-green-700 mt-2 font-medium">
                  ✅ Coordinates configured!
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
