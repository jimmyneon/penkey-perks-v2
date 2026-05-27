'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, X, Loader2 } from 'lucide-react'

export default function ScanPage() {
  const router = useRouter()
  const [scanned, setScanned] = useState(false)
  const [result, setResult] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
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
    <div className="min-h-screen bg-[#0F0A08] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <button
          onClick={() => {
            if (readerRef.current) readerRef.current.stop().catch(() => {})
            router.push('/dashboard')
          }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-[15px] tracking-tight">Scan QR Code</h1>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        {/* Scanner view */}
        {scanning && (
          <>
            <div className="relative w-[272px] h-[272px]">
              <div id="reader" className="w-full h-full rounded-[20px] overflow-hidden" />
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-9 h-9 border-t-[3px] border-l-[3px] border-[#E48A3A] rounded-tl-[16px] pointer-events-none animate-scanner-glow" />
              <div className="absolute top-0 right-0 w-9 h-9 border-t-[3px] border-r-[3px] border-[#E48A3A] rounded-tr-[16px] pointer-events-none animate-scanner-glow" />
              <div className="absolute bottom-0 left-0 w-9 h-9 border-b-[3px] border-l-[3px] border-[#E48A3A] rounded-bl-[16px] pointer-events-none animate-scanner-glow" />
              <div className="absolute bottom-0 right-0 w-9 h-9 border-b-[3px] border-r-[3px] border-[#E48A3A] rounded-br-[16px] pointer-events-none animate-scanner-glow" />
              {/* Scan line */}
              <div className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#E48A3A] to-transparent rounded-full pointer-events-none animate-scanline" style={{ top: '50%' }} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white/90 text-[14px] font-semibold">Position code in the frame</p>
              <p className="text-white/40 text-[12px]">Hold steady for best results</p>
            </div>
          </>
        )}

        {/* Idle / starting state */}
        {!scanning && !scanned && !error && (
          <div className="flex flex-col items-center gap-4">
            <div id="reader" className="hidden" />
            <Loader2 className="w-10 h-10 text-white/30 animate-spin" />
            <p className="text-white/50 text-[13px]">Starting camera…</p>
          </div>
        )}

        {/* Success state */}
        {scanned && (
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="w-14 h-14 rounded-full bg-[#F0FAF4] flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-[#2A7A4A] stroke-[2.5px]" />
            </div>
            <h2 className="font-extrabold text-[#2C1810] text-[18px] mb-1 animate-qr-pop">Code Scanned!</h2>
            <p className="text-[11px] text-[#9A7A6A] break-all mb-5 font-mono bg-[#FAF8F5] rounded-[10px] px-3 py-2 leading-relaxed">{result}</p>
            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-[#2C1810] text-white text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all"
            >
              Scan Again
            </button>
          </div>
        )}

        {/* Error state */}
        {error && !scanned && (
          <div className="w-full max-w-[320px] text-center space-y-4">
            <div className="bg-white/8 rounded-[20px] p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-white text-[14px] font-semibold">Camera Unavailable</p>
              <p className="text-white/50 text-[12px] leading-relaxed">{error}</p>
            </div>
            <button
              onClick={startScanning}
              className="w-full py-3.5 bg-white text-[#2C1810] text-[14px] font-bold rounded-[14px] active:scale-[0.98] transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
