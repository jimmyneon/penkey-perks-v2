'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Check, X } from 'lucide-react'

export default function ScanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [scanned, setScanned] = useState(false)
  const [result, setResult] = useState('')

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real implementation, this would process the QR code
      // For now, just simulate a successful scan
      setScanned(true)
      setResult('QR-123456')
    }
  }

  const handleReset = () => {
    setScanned(false)
    setResult('')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {!scanned ? (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8D123F] to-[#A8224E] flex items-center justify-center mx-auto shadow-lg">
            <Camera className="w-12 h-12 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-[#4B3028] mb-2">Scan QR Code</h1>
            <p className="text-sm text-[#4B3028]/70">Tap to open camera and scan</p>
          </div>

          <Button
            onClick={handleCameraClick}
            className="bg-gradient-to-br from-[#8D123F] to-[#A8224E] hover:from-[#A8224E] hover:to-[#8D123F] text-white font-semibold h-14 px-8 rounded-2xl shadow-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Open Camera
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
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
      )}
    </div>
  )
}
