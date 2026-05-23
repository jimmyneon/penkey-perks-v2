'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { X, Camera } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    )

    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText)
          if (data.type === 'customer') {
            onScan(decodedText)
            scanner.clear()
          }
        } catch (e) {
          setError('Invalid QR code format')
        }
      },
      (errorMessage) => {
        // Ignore scan errors (normal during scanning)
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-[#1c1917]">Scan Customer QR</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div id="qr-reader" className="mb-4" />
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-[#78716c]">
            <p className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Point camera at customer's QR code
            </p>
            <p>QR codes are found in the customer's app under "Show My QR Code"</p>
          </div>
        </div>
      </div>
    </div>
  )
}
