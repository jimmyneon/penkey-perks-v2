'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Camera } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('Initializing camera...')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isInitializedRef = useRef(false)
  // Generate unique ID to prevent conflicts
  const scannerIdRef = useRef<string>(`qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (isInitializedRef.current) return

    let mounted = true

    const startScanner = async () => {
      try {
        if (!mounted) return
        
        // Small delay to ensure DOM element is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!mounted) return
        
        isInitializedRef.current = true
        
        // Create scanner instance with unique ID
        const scanner = new Html5Qrcode(scannerIdRef.current)
        scannerRef.current = scanner

        if (!mounted) return

        // Start scanning with optimized settings
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
            // Success callback - QR code detected
            if (mounted) {
              console.log('QR Code detected:', decodedText)
              setScanStatus('QR Code detected! ✓')
              // Small delay to show success message
              setTimeout(() => {
                onScan(decodedText)
              }, 300)
            }
          },
          (errorMessage) => {
            // Error callback - this fires frequently while scanning
            // Ignore common initialization and "not found" errors
            const ignoredErrors = [
              'NotFoundException',
              'Invalid element or state',
              'source width is 0',
              'source height is 0',
              'getImageData'
            ]
            
            const shouldIgnore = ignoredErrors.some(err => 
              errorMessage.includes(err)
            )
            
            if (!shouldIgnore) {
              console.debug('QR scan error:', errorMessage)
            }
          }
        )
        
        if (mounted) {
          setIsScanning(true)
          setScanStatus('Ready to scan - position QR code in frame')
        }
      } catch (err) {
        console.error('Scanner error:', err)
        if (mounted) {
          setError('Failed to start camera. Please allow camera access.')
        }
        isInitializedRef.current = false
      }
    }

    startScanner()

    // Cleanup
    return () => {
      mounted = false
      if (scannerRef.current) {
        // Try to stop the scanner, but don't throw if it's not running
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
            isInitializedRef.current = false
          })
          .catch((err) => {
            // Scanner might not be running yet, that's okay
            console.debug('Scanner cleanup:', err)
            // Still clear and reset
            try {
              scannerRef.current?.clear()
            } catch (e) {
              // Ignore clear errors
            }
            scannerRef.current = null
            isInitializedRef.current = false
          })
      }
    }
  }, [])

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        // Only stop if scanner is actually running
        const state = scannerRef.current.getState()
        if (state === 2) { // Html5QrcodeScannerState.SCANNING = 2
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
        scannerRef.current = null
        isInitializedRef.current = false
      } catch (err) {
        // Silently handle errors during cleanup
        console.debug('Scanner cleanup:', err)
        // Force cleanup even if error
        try {
          scannerRef.current?.clear()
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null
        isInitializedRef.current = false
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-penkey-orange" />
              <h2 className="text-lg font-bold text-penkey-dark">Scan QR Code</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-penkey-gray hover:text-penkey-dark"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Scanner */}
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          ) : (
            <>
              <div id={scannerIdRef.current} className="w-full rounded-lg overflow-hidden mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-center text-penkey-gray">
                  Point your camera at the QR code
                </p>
                <p className="text-xs text-center font-medium" style={{ color: scanStatus.includes('✓') ? '#16a34a' : '#ea580c' }}>
                  {scanStatus}
                </p>
                <p className="text-xs text-center text-penkey-gray">
                  💡 Tip: Hold steady and ensure good lighting
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
