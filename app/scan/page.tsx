'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Camera, Check, X, Loader2 } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function ScanPage() {
  const router = useRouter()
  const [scanned, setScanned] = useState(false)
  const [result, setResult] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const readerRef = useRef<any>(null)

  useEffect(() => {
    // Auto-start camera on page load
    startScanning()
    
    return () => {
      // Cleanup on unmount - don't await, just fire and forget
      if (readerRef.current) {
        readerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    setScanning(true)
    setError('')

    try {
      const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode
      readerRef.current = new Html5Qrcode('reader')
      
      await readerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          setScanned(true)
          setResult(decodedText)
          setScanning(false)
          readerRef.current?.stop().catch(console.error)
        },
        (errorMessage: string) => {
          // Ignore scan errors (happens while scanning)
        }
      )
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.')
      setScanning(false)
      console.error(err)
    }
  }

  const handleReset = () => {
    setScanned(false)
    setResult('')
    setError('')
    startScanning()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {scanning ? (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#4B3028] mb-2">Scanning...</h1>
            <p className="text-sm text-[#4B3028]/70">Point camera at QR code</p>
          </div>
          
          <div id="reader" className="w-full rounded-xl overflow-hidden" />
          
          <Button
            onClick={() => {
              setScanning(false)
              // Stop scanner without awaiting to avoid blocking navigation
              if (readerRef.current) {
                readerRef.current.stop().catch(() => {})
              }
              router.push('/dashboard')
            }}
            variant="outline"
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      ) : scanned ? (
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-[#4B3028] mb-2">Scanned!</h1>
            <p className="text-sm text-[#4B3028]/70">Code: {result}</p>
          </div>

          <Button
            onClick={handleReset}
            variant="outline"
            className="h-12 px-8 rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Scan Again
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E48A3A] to-[#D47A2A] flex items-center justify-center mx-auto shadow-lg">
            <Camera className="w-12 h-12 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-[#4B3028] mb-2">Scan QR Code</h1>
            <p className="text-sm text-[#4B3028]/70">Opening camera...</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <Button
            onClick={startScanning}
            className="bg-gradient-to-br from-[#E48A3A] to-[#D47A2A] hover:from-[#D47A2A] hover:to-[#C46A1A] text-white font-semibold h-14 px-8 rounded-2xl shadow-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Open Camera
          </Button>
        </div>
      )}
    </div>
  )
}
