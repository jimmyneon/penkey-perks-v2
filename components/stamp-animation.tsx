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
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <style>{`
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
          className="relative z-10 transition-transform duration-300 ease-out"
          style={{
            transform: phase === 'stamping' ? 'translateY(60px)' : 'translateY(-60px)',
          }}
        >
          <img
            src="/image-assets/stamps/stamper.png"
            alt="Stamper"
            className="w-32 h-32 object-contain"
          />
        </div>

        {/* Splatter effect */}
        {phase === 'splatter' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-0">
            <div className="relative">
              {/* Main splatter */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'radial-gradient(circle, #E07A3A 0%, transparent 70%)',
                  animation: 'splatterPulse 0.5s ease-out forwards',
                }}
              />
              {/* Particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#E07A3A',
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 45}deg) translateX(40px)`,
                    animation: `particleBurst 0.4s ease-out ${i * 0.05}s forwards`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stamp result */}
        {phase === 'complete' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
            <img
              src="/image-assets/stamps/stamp.png"
              alt="Stamp"
              className="w-20 h-20 object-contain"
              style={{
                animation: 'stampAppear 0.3s ease-out',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
