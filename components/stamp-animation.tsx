'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StampAnimationProps {
  onComplete?: () => void
  show?: boolean
  targetPosition?: { x: number; y: number }
}

const randomRotations = [-15, 12, 18, -8, 10, -12, 14, -6]

export function StampAnimation({ onComplete, show = false, targetPosition }: StampAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'approach' | 'impact' | 'splash' | 'stamp' | 'exit'>('idle')
  const [stampRotation, setStampRotation] = useState(0)

  useEffect(() => {
    if (!show) {
      setPhase('idle')
      return
    }

    // Set random rotation for this stamp
    setStampRotation(randomRotations[Math.floor(Math.random() * randomRotations.length)])

    // Timeline (total ~1200ms):
    // 0ms: stamper appears (approach)
    // 500ms: impact
    // 600ms: splash
    // 900ms: stamp appears
    // 1200ms: stamper exits

    setPhase('approach')

    const impactTimer = setTimeout(() => {
      setPhase('impact')
      // Mobile vibration
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)

    const splashTimer = setTimeout(() => {
      setPhase('splash')
    }, 600)

    const stampTimer = setTimeout(() => {
      setPhase('stamp')
    }, 900)

    const exitTimer = setTimeout(() => {
      setPhase('exit')
      onComplete?.()
    }, 1200)

    return () => {
      clearTimeout(impactTimer)
      clearTimeout(splashTimer)
      clearTimeout(stampTimer)
      clearTimeout(exitTimer)
    }
  }, [show, onComplete])

  if (!show || phase === 'idle') return null

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {/* Stamper */}
          <AnimatePresence>
            {phase !== 'exit' && (
              <motion.div
                className="absolute"
                initial={{
                  scale: 0.2,
                  opacity: 0,
                  filter: 'blur(12px)',
                  x: (targetPosition?.x || window.innerWidth / 2) + 200,
                  y: (targetPosition?.y || window.innerHeight / 2) - 150,
                }}
                animate={
                  phase === 'approach'
                    ? {
                        scale: 1.15,
                        opacity: 1,
                        filter: 'blur(0px)',
                        x: targetPosition?.x || window.innerWidth / 2,
                        y: targetPosition?.y || window.innerHeight / 2,
                      }
                    : phase === 'impact'
                    ? {
                        scale: 0.92,
                        rotate: [0, -2, 2, 0],
                      }
                    : {}
                }
                exit={{
                  scale: 1.3,
                  opacity: 0,
                  filter: 'blur(8px)',
                }}
                transition={{
                  duration: phase === 'approach' ? 0.5 : phase === 'impact' ? 0.1 : 0.3,
                  ease: phase === 'approach' ? 'easeOut' : 'easeInOut',
                }}
                style={{ border: 'none', outline: 'none' }}
              >
                <motion.div
                  animate={
                    phase === 'approach'
                      ? {
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }
                      : {}
                  }
                  style={{ border: 'none', outline: 'none' }}
                >
                  <img
                    src="/image-assets/stamps/stamper.png"
                    alt="Stamper"
                    className="w-[30rem] h-[30rem] object-contain"
                    style={{ transform: 'rotate(5deg)', border: 'none', outline: 'none' }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Splash */}
          <AnimatePresence>
            {phase === 'splash' && (
              <motion.div
                className="absolute"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  x: targetPosition?.x || window.innerWidth / 2 - 75,
                  y: targetPosition?.y || window.innerHeight / 2 - 75,
                }}
              >
                <img
                  src="/image-assets/stamps/beansplatter.svg"
                  alt="Splash"
                  className="w-64 h-64 object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stamp result */}
          <AnimatePresence>
            {(phase === 'stamp' || phase === 'exit') && (
              <motion.div
                className="absolute"
                initial={{ scale: 1.4, opacity: 0, rotate: stampRotation }}
                animate={{ scale: 1, opacity: 1, rotate: stampRotation }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  x: targetPosition?.x || window.innerWidth / 2 - 50,
                  y: targetPosition?.y || window.innerHeight / 2 - 50,
                }}
              >
                <img
                  src="/image-assets/stamps/stamp.svg"
                  alt="Stamp"
                  className="w-24 h-24 object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}
