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
          scale: 1.15, opacity: 1, filter: 'blur(0px)',
          transition: { duration: 0.45, ease: 'easeOut' },
        }),
        shadowCtrl.start({
          scale: 1.4, opacity: 0.35,
          transition: { duration: 0.45, ease: 'easeOut' },
        }),
      ])

      // ─── Impact ──────────────────────────────────────────────────
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30)
      await Promise.all([
        stamperCtrl.start({ scale: 0.9, transition: { duration: 0.07 } }),
        shadowCtrl.start({ scale: 0.8, opacity: 0, transition: { duration: 0.07 } }),
      ])

      // ─── Wobble ──────────────────────────────────────────────────
      await stamperCtrl.start({
        rotate: [0, -4, 4, -2, 2, 0],
        transition: { duration: 0.2, ease: 'easeInOut' },
      })

      // ─── Splash ──────────────────────────────────────────────────
      splashCtrl.start({
        scale: [0.3, 1.4], opacity: [1, 0],
        transition: { duration: 0.3, ease: 'easeOut' },
      })

      // ─── New stamp appears ────────────────────────────────────────
      await new Promise(r => setTimeout(r, 100))
      await stampCtrl.start({
        scale: 1, opacity: 1, rotate: rotation,
        x: offsetX, y: offsetY,
        transition: { duration: 0.25, ease: 'easeOut' },
      })

      // ─── Exit: stamper lifts away ─────────────────────────────────
      await Promise.all([
        stamperCtrl.start({
          y: -300, scale: 0.5, opacity: 0, filter: 'blur(10px)',
          transition: { duration: 0.35, ease: 'easeIn' },
        }),
        stampCtrl.start({ opacity: 0, transition: { duration: 0.2 } }),
      ])

      runningRef.current = false
      onComplete?.()
    }

    run()
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  console.log('[StampAnimation] render', { show, targetPosition })

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Debug marker */}
      <div style={{
        position: 'fixed',
        left: tx,
        top: ty,
        width: 10,
        height: 10,
        background: 'red',
        zIndex: 999999,
        transform: 'translate(-50%, -50%)'
      }} />

      {/* Shadow */}
      <motion.div
        animate={shadowCtrl}
        initial={{ scale: 0.3, opacity: 0 }}
        style={{
          position: 'fixed',
          left: tx,
          top: ty + 50,
          width: 90,
          height: 28,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.25)',
          filter: 'blur(14px)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Stamper */}
      <motion.div
        animate={stamperCtrl}
        initial={{ scale: 1.0, opacity: 0, filter: 'blur(12px)' }}
        style={{
          position: 'fixed',
          left: tx,
          top: ty,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src="/image-assets/stamps/stamper.png"
          alt="Stamper"
          style={{
            width: 2000,
            height: 2000,
            objectFit: 'contain',
            transform: 'rotate(5deg)',
            display: 'block',
          }}
        />
      </motion.div>

      {/* Splash */}
      <motion.div
        animate={splashCtrl}
        initial={{ scale: 0.3, opacity: 0 }}
        style={{
          position: 'fixed',
          left: tx,
          top: ty,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src="/image-assets/stamps/beansplatter.png"
          alt="Splash"
          style={{ width: 128, height: 128, objectFit: 'contain', display: 'block' }}
        />
      </motion.div>

      {/* Stamp result overlay */}
      <motion.div
        animate={stampCtrl}
        initial={{ scale: 1.4, opacity: 0 }}
        style={{
          position: 'fixed',
          left: tx,
          top: ty,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src="/image-assets/stamps/stamp.png"
          alt="Stamp"
          style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }}
        />
      </motion.div>
    </div>
  )
}
