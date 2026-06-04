'use client'

import { useEffect, useRef } from 'react'
import { useAnimate, motion } from 'framer-motion'

interface StampAnimationProps {
  onComplete?: () => void
  show?: boolean
  targetPosition?: { x: number; y: number }
}

export function StampAnimation({ onComplete, show = false, targetPosition }: StampAnimationProps) {
  const [stamperScope, animateStamper] = useAnimate()
  const [shadowScope, animateShadow] = useAnimate()
  const [splashScope, animateSplash] = useAnimate()
  const [stampScope, animateStamp] = useAnimate()
  const runningRef = useRef(false)

  const tx = targetPosition?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)
  const ty = targetPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 400)

  useEffect(() => {
    if (!show || runningRef.current) return
    runningRef.current = true

    const rotation = (Math.random() - 0.5) * 24
    const offsetX = (Math.random() - 0.5) * 8
    const offsetY = (Math.random() - 0.5) * 8

    const run = async () => {
      // ─── Approach ───────────────────────────────────────────────
      await Promise.all([
        animateStamper(stamperScope.current, {
          x: tx, y: ty,
          scale: 1.15, opacity: 1, filter: 'blur(0px)',
        }, { duration: 0.4, ease: 'easeOut' }),
        animateShadow(shadowScope.current, {
          x: tx, y: ty + 110,
          scale: 1.4, opacity: 0.35,
        }, { duration: 0.4, ease: 'easeOut' }),
      ])

      // ─── Impact ─────────────────────────────────────────────────
      if (navigator.vibrate) navigator.vibrate(30)
      await Promise.all([
        animateStamper(stamperScope.current, { scale: 0.92 }, { duration: 0.07, ease: 'easeIn' }),
        animateShadow(shadowScope.current, { scale: 0.8, opacity: 0 }, { duration: 0.07 }),
      ])
      await animateStamper(stamperScope.current,
        { rotate: [0, -3, 3, -2, 2, 0] },
        { duration: 0.15, ease: 'easeInOut' }
      )

      // ─── Splash ──────────────────────────────────────────────────
      animateSplash(splashScope.current,
        { opacity: [1, 0], scale: [0.3, 1.3] },
        { duration: 0.25, ease: 'easeOut' }
      )

      // ─── Stamp appears ───────────────────────────────────────────
      await new Promise(r => setTimeout(r, 150))
      await animateStamp(stampScope.current, {
        opacity: 1, scale: 1, rotate: rotation, x: tx - 48 + offsetX, y: ty - 48 + offsetY,
      }, { duration: 0.25, ease: 'easeOut' })

      // ─── Exit ────────────────────────────────────────────────────
      await Promise.all([
        animateStamper(stamperScope.current, {
          scale: 1.3, opacity: 0, filter: 'blur(8px)',
        }, { duration: 0.25, ease: 'easeIn' }),
        animateStamp(stampScope.current, { opacity: 0 }, { duration: 0.2 }),
      ])

      runningRef.current = false
      onComplete?.()
    }

    run()
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when hidden
  useEffect(() => {
    if (!show) {
      runningRef.current = false
      if (stamperScope.current) {
        animateStamper(stamperScope.current, { opacity: 0, scale: 0.2 }, { duration: 0 })
      }
      if (shadowScope.current) {
        animateShadow(shadowScope.current, { opacity: 0 }, { duration: 0 })
      }
      if (splashScope.current) {
        animateSplash(splashScope.current, { opacity: 0 }, { duration: 0 })
      }
      if (stampScope.current) {
        animateStamp(stampScope.current, { opacity: 0 }, { duration: 0 })
      }
    }
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null

  const startX = tx + 150
  const startY = ty - 200

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Shadow */}
      <motion.div
        ref={shadowScope}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 90,
          height: 28,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.25)',
          filter: 'blur(14px)',
          x: startX,
          y: startY + 110,
          scale: 0.4,
          opacity: 0,
        }}
      />

      {/* Stamper */}
      <motion.div
        ref={stamperScope}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          x: startX,
          y: startY,
          scale: 0.2,
          opacity: 0,
          filter: 'blur(12px)',
        }}
      >
        <img
          src="/image-assets/stamps/stamper.webp"
          alt="Stamper"
          style={{
            width: 192,
            height: 192,
            objectFit: 'contain',
            transform: 'rotate(5deg)',
            display: 'block',
            border: 'none',
            outline: 'none',
          }}
        />
      </motion.div>

      {/* Splash */}
      <motion.div
        ref={splashScope}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          x: tx - 64,
          y: ty - 64,
          scale: 0.3,
          opacity: 0,
        }}
      >
        <img
          src="/image-assets/stamps/beansplatter.webp"
          alt="Splash"
          style={{ width: 128, height: 128, objectFit: 'contain', display: 'block' }}
        />
      </motion.div>

      {/* Stamp result */}
      <motion.div
        ref={stampScope}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          x: tx - 48,
          y: ty - 48,
          scale: 1.4,
          opacity: 0,
        }}
      >
        <img
          src="/image-assets/stamps/stamp.webp"
          alt="Stamp"
          style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }}
        />
      </motion.div>
    </div>
  )
}
