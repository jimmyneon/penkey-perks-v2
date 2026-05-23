'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QrCode, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function ScanClient() {
  const [rewardCode, setRewardCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scannedReward, setScannedReward] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleScan = async () => {
    if (!rewardCode.trim()) return

    setIsLoading(true)
    try {
      // Verify the reward exists and is active
      const response = await fetch('/api/admin/rewards/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: rewardCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid reward code')
      }

      setScannedReward(data.reward)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!scannedReward) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRewardId: scannedReward.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward')
      }

      toast({
        title: 'Success!',
        description: 'Reward redeemed successfully',
      })

      setScannedReward(null)
      setRewardCode('')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Reward</h1>
        <p className="text-muted-foreground">Scan customer QR codes to redeem rewards</p>
      </div>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Enter Reward Code
          </CardTitle>
          <CardDescription>
            Scan QR code or enter code manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">Reward Code</Label>
            <Input
              id="code"
              value={rewardCode}
              onChange={(e) => setRewardCode(e.target.value)}
              placeholder="Enter code from QR"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
          </div>

          <Button 
            onClick={handleScan} 
            disabled={isLoading || !rewardCode.trim()}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify Reward'}
          </Button>
        </CardContent>
      </Card>

      {/* Scanned Reward */}
      {scannedReward && (
        <Card className="border-success-green">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success-green">
              <CheckCircle className="w-5 h-5" />
              Reward Verified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-penkey-orange to-penkey-orange-light rounded-lg text-center">
              <p className="text-3xl font-bold text-white mb-2">
                {scannedReward.rewards?.name}
              </p>
              <p className="text-xl text-white/90">
                {scannedReward.rewards?.value}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{scannedReward.users?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{scannedReward.status}</span>
              </div>
              {scannedReward.expires_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">
                    {new Date(scannedReward.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {scannedReward.status === 'active' ? (
              <Button 
                onClick={handleRedeem} 
                disabled={isLoading}
                className="w-full bg-success-green hover:bg-success-green/90"
              >
                {isLoading ? 'Redeeming...' : 'Redeem Reward'}
              </Button>
            ) : (
              <div className="p-4 bg-grey-light rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  This reward has already been {scannedReward.status}
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => {
                setScannedReward(null)
                setRewardCode('')
              }}
              className="w-full"
            >
              Scan Another
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-penkey-orange">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">How to use:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Ask customer to show their reward QR code</li>
            <li>Scan the QR code or enter the code manually</li>
            <li>Verify the reward details</li>
            <li>Click "Redeem Reward" to complete</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
