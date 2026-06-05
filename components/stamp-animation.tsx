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

  // Constants for size and position
  const STAMPER_OFFSET_Y = -180
  const STAMP_RESULT_OFFSET_Y = -80
  const STAMPER_WIDTH = 'clamp(900px, 220vw, 1300px)'
  const SPLASH_SIZE = 520
  const RESULT_STAMP_SIZE = 180

  const tx = targetPosition?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)
  const ty = targetPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 400)

  useEffect(() => {
    console.log('[StampAnimation] show:', show, 'runningRef:', runningRef.current, 'targetPosition:', targetPosition)

    if (!show) {
      runningRef.current = false
      // Reset animation controls for next run
      stamperCtrl.set({ scale: 1.0, opacity: 0, filter: 'blur(12px)' })
      splashCtrl.set({ scale: 0.3, opacity: 0 })
      stampCtrl.set({ scale: 1.4, opacity: 0 })
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
        scale: [1.1, 1],
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
        scale: [1, 0.92, 1.03],
        rotate: [5, 3, 7, 5],
        transition: { duration: 0.18, ease: 'easeInOut' },
      })

      // ─── Step 3: Stamper retracts / fades ─────────────────────────
      await stamperCtrl.start({
        scale: 1.15,
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
          top: ty + STAMP_RESULT_OFFSET_Y,
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
            style={{ width: RESULT_STAMP_SIZE, height: RESULT_STAMP_SIZE, objectFit: 'contain', display: 'block' }}
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
            style={{ width: SPLASH_SIZE, height: SPLASH_SIZE, objectFit: 'contain', display: 'block' }}
          />
        </motion.div>
      </div>

      {/* Stamper - on top */}
      <div
        style={{
          position: 'fixed',
          left: tx,
          top: ty + STAMPER_OFFSET_Y,
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
              width: STAMPER_WIDTH,
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
