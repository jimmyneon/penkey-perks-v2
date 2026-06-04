'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface StampAnimationProps {
  onComplete?: () => void
  show?: boolean
  targetPosition?: { x: number; y: number }
}

export function StampAnimation({ onComplete, show = false, targetPosition }: StampAnimationProps) {
  const stamperCtrl = useAnimation()
  const splashCtrl = useAnimation()
  const stampCtrl = useAnimation()
  const runningRef = useRef(false)

  const tx = targetPosition?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)
  const ty = targetPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 400)

  useEffect(() => {
    console.log('[StampAnimation] show:', show, 'runningRef:', runningRef.current, 'targetPosition:', targetPosition)

    if (!show) {
      runningRef.current = false
      return
    }
    if (runningRef.current) return
    runningRef.current = true

    const rotation = (Math.random() - 0.5) * 24
    const offsetX = (Math.random() - 0.5) * 8
    const offsetY = (Math.random() - 0.5) * 8

    const run = async () => {
      // ─── Step 1: Big stamper enters ───────────────────────────────
      await stamperCtrl.start({
        scale: [1.8, 1.15],
        opacity: [0, 1],
        filter: ['blur(12px)', 'blur(0px)'],
        y: [-120, 0],
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      })

      // ─── Step 2: Impact ───────────────────────────────────────────
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25)
      }

      splashCtrl.start({
        scale: [0.4, 1.5],
        opacity: [0.9, 0],
        transition: { duration: 0.22, ease: 'easeOut' },
      })

      await stamperCtrl.start({
        scale: [1.15, 0.92, 1.04],
        rotate: [5, 3, 7, 5],
        transition: { duration: 0.18, ease: 'easeInOut' },
      })

      // ─── Step 3: Stamper retracts / fades ─────────────────────────
      await stamperCtrl.start({
        scale: 1.35,
        opacity: 0,
        filter: 'blur(8px)',
        y: -60,
        transition: { duration: 0.25, ease: 'easeIn' },
      })

      // ─── Step 4: Reveal actual stamp ─────────────────────────────
      await stampCtrl.start({
        scale: [1.4, 1],
        opacity: [0, 1],
        rotate: rotation,
        x: offsetX,
        y: offsetY,
        transition: { duration: 0.22, ease: 'easeOut' },
      })

      runningRef.current = false
      onComplete?.()
    }

    run()
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  console.log('[StampAnimation] render', { show, targetPosition })

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Stamp result overlay - underneath stamper */}
      <div
        style={{
          position: 'fixed',
          left: tx,
          top: ty - 80,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={stampCtrl}
          initial={{ scale: 1.4, opacity: 0 }}
        >
          <img
            src="/image-assets/stamps/stamp.png"
            alt="Stamp"
            style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }}
          />
        </motion.div>
      </div>

      {/* Splash */}
      <div
        style={{
          position: 'fixed',
          left: tx,
          top: ty,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={splashCtrl}
          initial={{ scale: 0.3, opacity: 0 }}
        >
          <img
            src="/image-assets/stamps/beansplatter.png"
            alt="Splash"
            style={{ width: 400, height: 400, objectFit: 'contain', display: 'block' }}
          />
        </motion.div>
      </div>

      {/* Stamper - on top */}
      <div
        style={{
          position: 'fixed',
          left: tx,
          top: ty,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={stamperCtrl}
          initial={{ scale: 1.0, opacity: 0, filter: 'blur(12px)' }}
        >
          <img
            src="/image-assets/stamps/stamper.png"
            alt="Stamper"
            style={{
              width: 'clamp(600px, 150vw, 900px)',
              height: 'auto',
              objectFit: 'contain',
              transform: 'rotate(5deg)',
              display: 'block',
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
