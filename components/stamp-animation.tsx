'use client'

import { useEffect, useState } from 'react'

interface StampAnimationProps {
  onComplete?: () => void
  show?: boolean
}

export function StampAnimation({ onComplete, show = false }: StampAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'stamping' | 'splatter' | 'complete'>('idle')

  useEffect(() => {
    console.log('StampAnimation show prop:', show)
    if (!show) {
      setPhase('idle')
      return
    }

    // Start stamping animation
    console.log('Starting stamp animation')
    setPhase('stamping')

    // Timeline:
    // 0ms: stamper starts moving down
    // 300ms: stamper hits (splatter starts)
    // 600ms: stamper moves up
    // 900ms: animation complete

    const splatterTimer = setTimeout(() => {
      setPhase('splatter')
    }, 300)

    const completeTimer = setTimeout(() => {
      setPhase('complete')
      onComplete?.()
    }, 900)

    return () => {
      clearTimeout(splatterTimer)
      clearTimeout(completeTimer)
    }
  }, [show, onComplete])

  if (!show || phase === 'idle') return null

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <style>{`
        @keyframes stamper3D {
          0% { transform: scale(3) translateY(-300px); opacity: 0; }
          30% { transform: scale(1.5) translateY(-100px); opacity: 1; }
          60% { transform: scale(1) translateY(100px); opacity: 1; }
          100% { transform: scale(0.8) translateY(200px); opacity: 0; }
        }
        @keyframes splatterPulse {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes particleBurst {
          0% { transform: rotate(var(--rotation)) translateX(0); opacity: 1; }
          100% { transform: rotate(var(--rotation)) translateX(60px); opacity: 0; }
        }
        @keyframes stampAppear {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
      <div className="relative">
        {/* Stamper */}
        <div
          className="relative z-10"
          style={{
            animation: phase === 'stamping' ? 'stamper3D 0.9s ease-in-out forwards' : 'none',
          }}
        >
          <img
            src="/image-assets/stamps/stamper.png"
            alt="Stamper"
            className="w-96 h-96 object-contain"
          />
        </div>
      </div>
    </div>
  )
}
