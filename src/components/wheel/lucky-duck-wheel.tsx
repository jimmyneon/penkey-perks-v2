'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sparkles, X } from 'lucide-react'

interface WheelPrize {
  id: string
  name: string
  description: string
  type: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  weight: number
}

interface LuckyDuckWheelProps {
  prizes: WheelPrize[]
  onSpin: () => Promise<{ prize: WheelPrize; success: boolean }>
  isAvailable: boolean
  campaignName?: string
}

const rarityColors = {
  common: '#78716c',
  rare: '#4a8c66',
  epic: '#f97316',
  legendary: '#dc2626',
}

export function LuckyDuckWheel({ prizes, onSpin, isAvailable, campaignName }: LuckyDuckWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<WheelPrize | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    drawWheel()
  }, [prizes])

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const segmentAngle = (2 * Math.PI) / prizes.length

    prizes.forEach((prize, index) => {
      const startAngle = index * segmentAngle
      const endAngle = startAngle + segmentAngle

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Use cream/forest palette
      const isEven = index % 2 === 0
      ctx.fillStyle = isEven ? '#f5f3ed' : '#e7e5e4'
      ctx.fill()

      ctx.strokeStyle = '#d6d3d1'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw prize icon/text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + segmentAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#1c1917'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.fillText(prize.name, radius - 20, 4)
      ctx.restore()
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#4a8c66'
    ctx.fill()

    // Draw duck icon in center
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🦆', centerX, centerY)
  }

  const handleSpin = async () => {
    if (!isAvailable || isSpinning) return

    setIsSpinning(true)
    setShowResult(false)

    // Calculate target rotation
    const spinResult = await onSpin()
    
    if (!spinResult.success) {
      setIsSpinning(false)
      return
    }

    const prizeIndex = prizes.findIndex(p => p.id === spinResult.prize.id)
    const segmentAngle = 360 / prizes.length
    const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2)
    const spins = 5 + Math.random() * 3
    const finalRotation = rotation + (spins * 360) + targetAngle

    setRotation(finalRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setResult(spinResult.prize)
      setShowResult(true)
    }, 4000)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-full shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        />
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-[#4a8c66]" />
        </div>
      </div>

      <Button
        onClick={handleSpin}
        disabled={!isAvailable || isSpinning}
        className="mt-6 bg-[#4a8c66] hover:bg-[#3d7356] text-white px-8 py-6 text-lg"
        size="lg"
      >
        {isSpinning ? (
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-spin" />
            Spinning...
          </span>
        ) : !isAvailable ? (
          'Not Available'
        ) : (
          'Spin the Wheel'
        )}
      </Button>

      {campaignName && (
        <p className="mt-3 text-sm text-[#78716c]">
          Campaign: {campaignName}
        </p>
      )}

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#f97316]" />
                You Won!
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResult(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">Your prize from the lucky duck wheel</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: rarityColors[result?.rarity || 'common'] }}
            >
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#1c1917] mb-2">{result?.name}</h3>
            <p className="text-[#78716c] text-center mb-4">{result?.description}</p>
            <span 
              className="px-3 py-1 rounded-full text-white text-sm capitalize"
              style={{ backgroundColor: rarityColors[result?.rarity || 'common'] }}
            >
              {result?.rarity}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
