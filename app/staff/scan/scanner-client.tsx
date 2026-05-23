'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, QrCode, CheckCircle, XCircle, Coffee, Gift } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ScannerClientProps {
  staffId: string
  staffName: string
}

export function ScannerClient({ staffId, staffName }: ScannerClientProps) {
  const [qrCode, setQrCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; type?: string } | null>(null)
  const { toast } = useToast()

  const handleScan = async () => {
    if (!qrCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a QR code',
        variant: 'destructive'
      })
      return
    }

    setProcessing(true)
    setResult(null)

    try {
      // Determine what type of QR code this is
      // Format: REWARD-{id} or CHECKIN-{userId} or STAMP-{userId}
      const parts = qrCode.toUpperCase().split('-')
      
      if (parts.length !== 2) {
        throw new Error('Invalid QR code format')
      }

      const [type, id] = parts

      if (type === 'REWARD') {
        // Redeem reward
        const response = await fetch('/api/admin/rewards/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to redeem reward')
        }

        setResult({
          success: true,
          message: `✅ Reward redeemed successfully!`,
          type: 'reward'
        })

        toast({
          title: 'Success!',
          description: 'Reward has been redeemed',
        })
      } else if (type === 'CHECKIN') {
        // Process check-in
        const response = await fetch('/api/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process check-in')
        }

        setResult({
          success: true,
          message: `✅ Check-in successful! +${data.points} beans`,
          type: 'checkin'
        })

        toast({
          title: 'Check-in Complete!',
          description: `Customer earned ${data.points} beans`,
        })
      } else if (type === 'STAMP') {
        // Add coffee stamp
        const response = await fetch('/api/stamps/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to add stamp')
        }

        setResult({
          success: true,
          message: `✅ Coffee stamp added! ${data.stampsCount}/10`,
          type: 'stamp'
        })

        toast({
          title: 'Stamp Added!',
          description: `Customer has ${data.stampsCount}/10 stamps`,
        })
      } else {
        throw new Error('Unknown QR code type')
      }

      // Clear input after successful scan
      setTimeout(() => {
        setQrCode('')
        setResult(null)
      }, 3000)

    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to process QR code'
      })

      toast({
        title: 'Error',
        description: error.message || 'Failed to process QR code',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2">
            <QrCode className="w-8 h-8 text-penkey-orange" />
            <h1 className="text-2xl font-bold text-penkey-dark">QR Scanner</h1>
          </div>
          <Link href="/staff/dashboard">
            <Button variant="ghost" size="icon" className="text-penkey-gray hover:text-penkey-dark">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">

        {/* Scanner Card */}
        <Card className="border-penkey-border bg-white">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-amber-950">
              <QrCode className="w-6 h-6 text-amber-700" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Manual Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-amber-900">
                Enter QR Code Manually
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., REWARD-abc123 or CHECKIN-xyz789"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  className="flex-1 text-lg"
                  disabled={processing}
                />
                <Button 
                  onClick={handleScan} 
                  disabled={processing || !qrCode.trim()}
                  className="bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {processing ? 'Processing...' : 'Scan'}
                </Button>
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className={`p-4 rounded-lg border-2 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">How to use:</h3>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>• Ask customer to show their QR code</li>
                <li>• Type the code shown on their screen</li>
                <li>• Click "Scan" to process</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <Gift className="w-6 h-6 mx-auto mb-1 text-amber-700" />
                <p className="text-xs text-amber-800 font-medium">Rewards</p>
                <p className="text-xs text-amber-600">REWARD-xxx</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <CheckCircle className="w-6 h-6 mx-auto mb-1 text-orange-700" />
                <p className="text-xs text-orange-800 font-medium">Check-in</p>
                <p className="text-xs text-orange-600">CHECKIN-xxx</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <Coffee className="w-6 h-6 mx-auto mb-1 text-amber-700" />
                <p className="text-xs text-amber-800 font-medium">Stamp</p>
                <p className="text-xs text-amber-600">STAMP-xxx</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Camera Scanner Coming Soon */}
        <Card className="border-penkey-border bg-white">
          <CardContent className="p-6 text-center">
            <QrCode className="w-16 h-16 mx-auto mb-3 text-amber-300" />
            <h3 className="font-semibold text-amber-900 mb-2">Camera Scanner</h3>
            <p className="text-sm text-amber-700">
              Camera-based QR scanning coming in a future update!
            </p>
            <p className="text-xs text-amber-600 mt-2">
              For now, use manual entry above
            </p>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
