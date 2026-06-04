'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StampAnimationProps {
  onComplete?: () => void
  show?: boolean
  targetPosition?: { x: number; y: number }
}

// Generate consistent random values for each stamp index
const getStampVariations = (index: number) => {
  const seed = index * 12345
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000
    const r = x - Math.floor(x)
    return min + r * (max - min)
  }
  return {
    rotation: random(-12, 12),
    offsetX: random(-4, 4),
    offsetY: random(-4, 4),
    scale: random(0.95, 1.05),
  }
}

// Cache variations for each stamp index
const stampVariationsCache: Record<number, ReturnType<typeof getStampVariations>> = {}

export function StampAnimation({ onComplete, show = false, targetPosition }: StampAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'approach' | 'impact' | 'splash' | 'stamp' | 'exit'>('idle')
  const [stampIndex, setStampIndex] = useState(0)
  const [stampVariations, setStampVariations] = useState(getStampVariations(0))

  useEffect(() => {
    if (!show) {
      setPhase('idle')
      return
    }

    // Set stamp index and get variations
    const currentBeans = targetPosition ? Math.floor(targetPosition.x / 100) : 0
    setStampIndex(currentBeans)
    if (!stampVariationsCache[currentBeans]) {
      stampVariationsCache[currentBeans] = getStampVariations(currentBeans)
    }
    setStampVariations(stampVariationsCache[currentBeans])

    // Timeline (total ~1000ms):
    // 0ms: stamper appears (approach)
    // 400ms: impact
    // 450ms: splash
    // 700ms: stamp appears
    // 1000ms: stamper exits

    setPhase('approach')

    const impactTimer = setTimeout(() => {
      setPhase('impact')
      // Mobile vibration
      if (navigator.vibrate) {
        navigator.vibrate(30)
      }
    }, 400)

    const splashTimer = setTimeout(() => {
      setPhase('splash')
    }, 450)

    const stampTimer = setTimeout(() => {
      setPhase('stamp')
    }, 700)

    const exitTimer = setTimeout(() => {
      setPhase('exit')
      onComplete?.()
    }, 1000)

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
          {/* Shadow layer */}
          <AnimatePresence>
            {phase !== 'exit' && (
              <motion.div
                className="absolute"
                initial={{
                  scale: 0.4,
                  opacity: 0,
                  x: (targetPosition?.x || window.innerWidth / 2) + 50,
                  y: (targetPosition?.y || window.innerHeight / 2) - 100 + 120,
                }}
                animate={
                  phase === 'approach'
                    ? {
                        scale: 1.4,
                        opacity: 0.35,
                        x: targetPosition?.x || window.innerWidth / 2,
                        y: (targetPosition?.y || window.innerHeight / 2) + 120,
                      }
                    : phase === 'impact'
                    ? {
                        scale: 0.8,
                        opacity: 0,
                      }
                    : {}
                }
                exit={{ opacity: 0 }}
                transition={{
                  duration: phase === 'approach' ? 0.4 : phase === 'impact' ? 0.08 : 0.2,
                  ease: phase === 'approach' ? 'easeOut' : 'easeInOut',
                }}
                style={{
                  width: '90px',
                  height: '28px',
                  borderRadius: '999px',
                  background: 'rgba(0,0,0,0.25)',
                  filter: 'blur(14px)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Stamper */}
          <AnimatePresence>
            {phase !== 'exit' && (
              <motion.div
                className="absolute"
                initial={{
                  scale: 0.2,
                  opacity: 0,
                  filter: 'blur(12px)',
                  x: (targetPosition?.x || window.innerWidth / 2) + 150,
                  y: (targetPosition?.y || window.innerHeight / 2) - 200,
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
                        rotate: [0, -3, 3, 0],
                      }
                    : {}
                }
                exit={{
                  scale: 1.3,
                  opacity: 0,
                  filter: 'blur(8px)',
                }}
                transition={{
                  duration: phase === 'approach' ? 0.4 : phase === 'impact' ? 0.08 : 0.2,
                  ease: phase === 'approach' ? 'easeOut' : 'easeInOut',
                }}
                style={{ border: 'none', outline: 'none' }}
              >
                <img
                  src="/image-assets/stamps/stamper.webp"
                  alt="Stamper"
                  className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain"
                  style={{ transform: 'rotate(5deg)', border: 'none', outline: 'none' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Splash */}
          <AnimatePresence>
            {phase === 'splash' && (
              <motion.div
                className="absolute"
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 1.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  x: targetPosition?.x || window.innerWidth / 2 - 50,
                  y: targetPosition?.y || window.innerHeight / 2 - 50,
                }}
              >
                <img
                  src="/image-assets/stamps/beansplatter.webp"
                  alt="Splash"
                  className="w-32 h-32 object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stamp result */}
          <AnimatePresence>
            {(phase === 'stamp' || phase === 'exit') && (
              <motion.div
                className="absolute"
                initial={{ scale: 1.4, opacity: 0, rotate: stampVariations.rotation }}
                animate={{ 
                  scale: stampVariations.scale, 
                  opacity: 1, 
                  rotate: stampVariations.rotation,
                  x: stampVariations.offsetX,
                  y: stampVariations.offsetY,
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  x: (targetPosition?.x || window.innerWidth / 2) - 50 + stampVariations.offsetX,
                  y: (targetPosition?.y || window.innerHeight / 2) - 50 + stampVariations.offsetY,
                }}
              >
                <img
                  src="/image-assets/stamps/stamp.webp"
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
