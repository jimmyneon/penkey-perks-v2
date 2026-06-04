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
  const shadowCtrl = useAnimation()
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
      // ─── Approach: stamper flies in from above ───────────────
      await Promise.all([
        stamperCtrl.start({
          scale: [0.35, 1.25],
          opacity: [0, 1],
          filter: ['blur(14px)', 'blur(0px)'],
          y: [-180, 0],
          transition: { duration: 0.45, ease: 'easeOut' },
        }),
        shadowCtrl.start({
          scale: [0.4, 1.6],
          opacity: [0, 0.35],
          transition: { duration: 0.45, ease: 'easeOut' },
        }),
      ])

      // ─── Impact: all effects happen together ─────────────────────
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30)
      }

      splashCtrl.start({
        scale: [0.2, 1.8],
        opacity: [1, 0],
        transition: { duration: 0.35, ease: 'easeOut' },
      })

      stampCtrl.start({
        scale: [1.6, 1],
        opacity: [0, 1],
        rotate: rotation,
        x: offsetX,
        y: offsetY,
        transition: { duration: 0.25, ease: 'easeOut' },
      })

      await Promise.all([
        stamperCtrl.start({
          scale: [1.25, 0.92, 1.05],
          rotate: [5, 2, 8, 5],
          transition: { duration: 0.22, ease: 'easeInOut' },
        }),
        shadowCtrl.start({
          scale: 0.8,
          opacity: 0,
          transition: { duration: 0.15 },
        }),
      ])

      // ─── Exit: stamper disappears ───────────────────────────────
      await stamperCtrl.start({
        scale: 1.45,
        opacity: 0,
        filter: 'blur(10px)',
        y: -80,
        transition: { duration: 0.38, ease: 'easeIn' },
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
      {/* Shadow */}
      <div
        style={{
          position: 'fixed',
          left: tx,
          top: ty + 50,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={shadowCtrl}
          initial={{ scale: 0.3, opacity: 0 }}
          style={{
            width: 90,
            height: 28,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.25)',
            filter: 'blur(14px)',
          }}
        />
      </div>

      {/* Stamp result overlay - underneath stamper */}
      <div
        style={{
          position: 'fixed',
          left: tx,
          top: ty,
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
              width: 'clamp(700px, 180vw, 1000px)',
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
