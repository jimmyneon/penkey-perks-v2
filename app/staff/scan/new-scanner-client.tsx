'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, QrCode, CheckCircle, Coffee, Gift, User, Coins, Camera, X, Sparkles, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Html5Qrcode } from 'html5-qrcode'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  current_points: number
  lifetime_points: number
  stamps: number
  can_check_in: boolean
  last_check_in: string | null
}

interface ConfirmationData {
  reward: {
    id: string
    reward_name: string
    reward_description?: string
  }
  customer: {
    id: string
    name: string
    email: string
  }
}

export function NewScannerClient() {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<ConfirmationData | null>(null)
  const { toast } = useToast()
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Initialize and start scanner when modal opens
  useEffect(() => {
    if (!showScanner) return

    let mounted = true
    const initScanner = async () => {
      try {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 150))

        if (!mounted) return

        const element = document.getElementById('qr-reader')
        if (!element) {
          console.error('QR reader element not found')
          setScannerError('Scanner element not found. Please try again.')
          return
        }

        console.log('Initializing scanner...')

        // Create new scanner instance
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        console.log('Starting camera...')

        // Get available cameras
        const devices = await Html5Qrcode.getCameras()
        console.log('Available cameras:', devices.length)

        let cameraId: string | undefined
        
        // Try to find back camera, otherwise use first available
        if (devices.length > 0) {
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          )
          cameraId = backCamera?.id || devices[0].id
          console.log('Using camera:', cameraId)
        }

        // Start scanning - use camera ID for better Safari compatibility
        await scanner.start(
          cameraId || { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          async (decodedText) => {
            if (!mounted) return
            
            console.log('QR Code scanned:', decodedText)
            
            // Successfully scanned
            await stopScanner()
            setQrCode(decodedText)
            
            // Auto-process the scanned QR code
            await processQRCode(decodedText)
          },
          (errorMessage) => {
            // Scanning errors are normal when no QR code is visible
          }
        )

        console.log('Camera started successfully')
      } catch (error: any) {
        console.error('Scanner initialization error:', error)
        if (mounted) {
          let errorMsg = 'Failed to start camera.'
          
          if (error.name === 'NotAllowedError') {
            errorMsg = 'Camera permission denied. Please allow camera access.'
          } else if (error.name === 'NotFoundError') {
            errorMsg = 'No camera found on this device.'
          } else if (error.name === 'NotReadableError') {
            errorMsg = 'Camera is already in use by another app.'
          } else if (error.message) {
            errorMsg = error.message
          }
          
          setScannerError(errorMsg)
        }
      }
    }

    initScanner()

    // Cleanup
    return () => {
      mounted = false
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {
            // Ignore errors - scanner might already be stopped
          })
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null
      }
    }
  }, [showScanner])

  // Process QR code - handles both customer profiles and reward redemptions
  const processQRCode = async (code: string) => {
    setLoading(true)
    setCustomer(null)

    try {
      const trimmedCode = code.trim().toUpperCase()
      console.log('Processing QR code:', trimmedCode)

      // Check if this is a reward QR code (REWARD-xxx, COFFEE-xxx, or PROMO-xxx)
      if (trimmedCode.startsWith('REWARD-') || trimmedCode.startsWith('COFFEE-') || trimmedCode.startsWith('PROMO-')) {
        await handleRewardRedemption(trimmedCode)
        return
      }

      // Otherwise, treat as customer profile QR code
      const response = await fetch('/api/staff/get-customer-by-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: trimmedCode })
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMsg = data.error || 'Failed to scan QR code'
        
        if (response.status === 404) {
          errorMsg = `Customer not found. ${data.customerId ? `ID: ${data.customerId}` : ''}`
          if (data.dbError) {
            errorMsg += ` (${data.dbError})`
          }
        } else if (response.status === 400) {
          errorMsg = `Invalid QR code format. ${data.received ? `Received: ${data.received}` : ''}`
        }
        
        toast({
          title: 'Scan Failed',
          description: errorMsg,
          variant: 'destructive',
          duration: 5000
        })
        
        throw new Error(errorMsg)
      }

      if (!data.customer || !data.customer.id) {
        throw new Error('Invalid customer data received')
      }

      setCustomer(data.customer)
      toast({
        title: 'Customer Found!',
        description: `${data.customer.name} (${data.customer.current_points ?? 0} beans, ${data.customer.stamps ?? 0}/10 stamps)`,
        duration: 3000
      })

    } catch (error: any) {
      console.error('QR processing error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScanQR = async () => {
    if (!qrCode.trim()) {
      toast({
        title: 'Missing QR Code',
        description: 'Please enter a QR code',
        variant: 'destructive'
      })
      return
    }

    await processQRCode(qrCode)
  }

  // Handle reward redemption (REWARD-xxx, COFFEE-xxx, or PROMO-xxx QR codes)
  const handleRewardRedemption = async (rewardQRCode: string) => {
    try {
      console.log('Starting reward redemption:', rewardQRCode)

      // First, verify the reward exists and get details
      console.log('📡 Calling verify-by-qr API...')
      const verifyResponse = await fetch('/api/admin/rewards/verify-by-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: rewardQRCode })
      })

      const verifyData = await verifyResponse.json()
      console.log('📥 Verify response:', { 
        ok: verifyResponse.ok, 
        status: verifyResponse.status,
        data: verifyData 
      })

      if (!verifyResponse.ok) {
        console.error('Verification failed:', verifyData)
        toast({
          title: 'Invalid Reward',
          description: verifyData.error || 'Reward not found or invalid',
          variant: 'destructive',
          duration: 5000
        })
        return
      }

      const { reward, customer } = verifyData

      // Show styled confirmation modal
      setConfirmationData({ reward, customer })
      setShowConfirmation(true)

    } catch (error: any) {
      console.error('Reward redemption error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to process reward',
        variant: 'destructive',
        duration: 5000
      })
    }
  }

  const handleCheckIn = async () => {
    if (!customer) return

    setProcessing(true)
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: customer.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process check-in')
      }

      toast({
        title: 'Check-in Complete!',
        description: `${customer.name} earned ${data.points ?? 0} beans`,
      })

      // Refresh customer data
      setCustomer({
        ...customer,
        current_points: (customer.current_points ?? 0) + (data.points ?? 0),
        can_check_in: false
      })

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process check-in',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleAddStamp = async () => {
    if (!customer) return

    setProcessing(true)
    try {
      const response = await fetch('/api/stamps/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: customer.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add stamp')
      }

      toast({
        title: 'Stamp Added!',
        description: `${customer.name} now has ${data.stampsCount ?? 0}/10 stamps`,
      })

      // Refresh customer data
      setCustomer({
        ...customer,
        stamps: data.stampsCount ?? 0
      })

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add stamp',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setQrCode('')
    setCustomer(null)
  }

  const handleConfirmRedemption = async () => {
    if (!confirmationData) return

    setShowConfirmation(false)
    setProcessing(true)

    try {
      const { reward, customer } = confirmationData

      // Redeem the reward
      const redeemResponse = await fetch('/api/admin/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRewardId: reward.id })
      })

      const redeemData = await redeemResponse.json()

      if (!redeemResponse.ok) {
        toast({
          title: 'Redemption Failed',
          description: redeemData.error || 'Failed to redeem reward',
          variant: 'destructive',
          duration: 5000
        })
        return
      }

      // Success! Show success modal
      setSuccessData({ reward, customer })
      setShowSuccess(true)
      
      toast({
        title: 'Reward Redeemed',
        description: `${reward.reward_name} redeemed for ${customer.name}`,
        duration: 3000
      })

      // Clear the QR code input
      setQrCode('')
      setConfirmationData(null)

      // Send push + email notification
      // Note: Email is also sent by DB trigger, but push needs to be sent manually
      console.log('📧 Sending push + email notification to customer:', customer.id)
      try {
        const notifResponse = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: customer.id,
            templateName: 'reward_redeemed',
            variables: {
              name: customer.name,
              rewardName: reward.reward_name
            },
            channels: {
              push: true,
              email: false, // Email already sent by DB trigger
              inApp: true
            }
          })
        })
        
        if (notifResponse.ok) {
          const notifData = await notifResponse.json()
          console.log('Notifications sent:', notifData)
        } else {
          console.error('Notification failed:', await notifResponse.text())
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
      }
    } catch (error: any) {
      console.error('Redemption error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to process redemption',
        variant: 'destructive',
        duration: 5000
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelRedemption = () => {
    setShowConfirmation(false)
    setConfirmationData(null)
    toast({
      title: 'Cancelled',
      description: 'Reward redemption cancelled',
    })
  }

  const startScanner = () => {
    setShowScanner(true)
    setScannerError(null)
  }

  const stopScanner = async () => {
    setShowScanner(false)
    
    // Try to stop scanner, but ignore any errors
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
      }
    } catch (error) {
      // Ignore - scanner might already be stopped
      console.log('Scanner stop (expected if already stopped):', error)
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
            <Button variant="ghost" className="text-penkey-gray hover:text-penkey-dark">
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">

        {/* QR Scanner */}
        <Card className="border-penkey-border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-penkey-dark">
              <QrCode className="w-5 h-5 text-penkey-orange" />
              Scan Customer QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Scanner Button */}
            {!customer && (
              <Button
                onClick={startScanner}
                className="w-full h-16 bg-penkey-orange hover:bg-amber-700 text-white text-lg font-bold"
                disabled={loading}
              >
                <Camera className="w-6 h-6 mr-2" />
                Open Camera Scanner
              </Button>
            )}

            {/* Manual Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter QR code (PROFILE-xxx or REWARD-xxx)"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanQR()}
                disabled={loading || !!customer}
                className="flex-1"
              />
              {customer ? (
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              ) : (
                <Button onClick={handleScanQR} disabled={loading}>
                  {loading ? 'Scanning...' : 'Scan'}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-penkey-gray">
              <div className="text-center p-2 bg-orange-50 rounded">
                <User className="w-4 h-4 mx-auto mb-1 text-penkey-orange" />
                <p className="font-medium">Customer Profile</p>
                <p className="text-[10px]">PROFILE-xxx</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded">
                <Gift className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <p className="font-medium">Redeem Reward</p>
                <p className="text-[10px]">REWARD-xxx</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        {customer && (
          <Card className="border-penkey-border bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2 text-penkey-dark">
                <CheckCircle className="w-5 h-5 text-penkey-orange" />
                Customer Found
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Customer Details */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-penkey-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-penkey-dark truncate">{customer.name}</h3>
                  <p className="text-sm text-penkey-gray truncate">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-sm text-penkey-gray">{customer.phone}</p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className="w-4 h-4 text-penkey-orange" />
                  </div>
                  <div className="text-2xl font-bold text-penkey-orange">{customer.current_points ?? 0}</div>
                  <div className="text-xs text-penkey-gray mt-1">Beans</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coffee className="w-4 h-4 text-penkey-orange" />
                  </div>
                  <div className="text-2xl font-bold text-penkey-orange">{customer.stamps ?? 0}/10</div>
                  <div className="text-xs text-penkey-gray mt-1">Stamps</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-penkey-orange" />
                  </div>
                  <div className="text-2xl font-bold text-penkey-orange">{customer.lifetime_points ?? 0}</div>
                  <div className="text-xs text-penkey-gray mt-1">Lifetime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {customer && (
          <Card className="border-penkey-border bg-white">
            <CardHeader>
              <CardTitle className="text-penkey-dark">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Check-in */}
              <Button
                onClick={handleCheckIn}
                disabled={!customer.can_check_in || processing}
                className="w-full h-auto py-4 bg-penkey-orange hover:bg-penkey-dark"
              >
                <div className="flex items-center gap-3 w-full">
                  <CheckCircle className="w-6 h-6" />
                  <div className="flex-1 text-left">
                    <div className="font-bold">Check-in</div>
                    <div className="text-xs opacity-90">
                      {customer.can_check_in ? 'Award daily check-in beans' : 'Already checked in today'}
                    </div>
                  </div>
                </div>
              </Button>

              {/* Add Stamp */}
              <Button
                onClick={handleAddStamp}
                disabled={processing}
                className="w-full h-auto py-4 bg-amber-600 hover:bg-amber-700"
                variant="default"
              >
                <div className="flex items-center gap-3 w-full">
                  <Coffee className="w-6 h-6" />
                  <div className="flex-1 text-left">
                    <div className="font-bold">Add Coffee Stamp</div>
                    <div className="text-xs opacity-90">
                      Current: {customer.stamps ?? 0}/10 stamps
                    </div>
                  </div>
                </div>
              </Button>

              {/* Award Custom Points */}
              <Link href={`/staff/award-points?customerId=${customer.id}&name=${encodeURIComponent(customer.name)}`} className="block">
                <Button
                  className="w-full h-auto py-4 bg-orange-600 hover:bg-orange-700"
                  variant="default"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Gift className="w-6 h-6" />
                    <div className="flex-1 text-left">
                      <div className="font-bold">Award Custom Beans</div>
                      <div className="text-xs opacity-90">
                        Bonus beans, referrals, etc.
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>

            </CardContent>
          </Card>
        )}

      </main>

      {/* Confirmation Modal */}
      {showConfirmation && confirmationData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-penkey-orange">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2 text-penkey-dark">
                <Gift className="w-6 h-6 text-penkey-orange" />
                Confirm Redemption
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-penkey-orange flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-penkey-dark">{confirmationData.customer.name}</p>
                    <p className="text-sm text-penkey-gray">{confirmationData.customer.email}</p>
                  </div>
                </div>
              </div>

              {/* Reward Info */}
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Coffee className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-900">{confirmationData.reward.reward_name}</p>
                    {confirmationData.reward.reward_description && (
                      <p className="text-sm text-amber-700">{confirmationData.reward.reward_description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  This action cannot be undone
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleCancelRedemption}
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50"
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRedemption}
                  className="bg-penkey-orange hover:bg-penkey-dark"
                  disabled={processing}
                >
                  {processing ? 'Redeeming...' : 'Confirm Redeem'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && successData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-green-500 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Redemption Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Success Icon */}
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">All Done!</h3>
                <p className="text-green-700">Reward has been redeemed</p>
              </div>

              {/* Customer Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-2">CUSTOMER</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">{successData.customer.name}</p>
                    <p className="text-sm text-green-700">{successData.customer.email}</p>
                  </div>
                </div>
              </div>

              {/* Reward Info - For POS Notes */}
              <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300">
                <p className="text-xs font-semibold text-amber-700 mb-2">REDEEMED ITEM</p>
                <div className="flex items-center gap-3 mb-3">
                  <Gift className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900 text-lg">{successData.reward.reward_name}</p>
                    {successData.reward.reward_description && (
                      <p className="text-sm text-amber-700">{successData.reward.reward_description}</p>
                    )}
                  </div>
                </div>
                <div className="bg-amber-100 rounded p-3 border border-amber-300">
                  <p className="text-xs font-semibold text-amber-800 mb-1">📝 FOR POS:</p>
                  <p className="text-sm text-amber-900 font-medium">
                    Apply: <span className="font-bold">{successData.reward.reward_name}</span>
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Customer: {successData.customer.name}
                  </p>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-center text-xs text-gray-500">
                Redeemed at {new Date().toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>

              {/* Close Button */}
              <Button
                onClick={() => {
                  setShowSuccess(false)
                  setSuccessData(null)
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-penkey-orange" />
                  <h2 className="text-lg font-bold text-penkey-dark">Scan Customer QR</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopScanner}
                  className="text-penkey-gray hover:text-penkey-dark"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Scanner */}
              {scannerError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{scannerError}</p>
                  <Button onClick={stopScanner}>Close</Button>
                </div>
              ) : (
                <>
                  <div id="qr-reader" className="w-full rounded-lg overflow-hidden mb-4"></div>
                  <p className="text-sm text-center text-penkey-gray mb-2">
                    Point your camera at the customer's QR code
                  </p>
                  <p className="text-xs text-center text-penkey-gray">
                    The QR code will be scanned automatically
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
