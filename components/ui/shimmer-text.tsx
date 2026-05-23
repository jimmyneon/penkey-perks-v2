'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ShimmerTextProps {
  children: ReactNode
  trigger: any
  className?: string
}

export function ShimmerText({ children, trigger, className = '' }: ShimmerTextProps) {
  return (
    <motion.div
      key={trigger}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      {children}
    </motion.div>
  )
}

export function PulsingDot({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`w-2 h-2 bg-orange-500 rounded-full ${className}`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <motion.div
        className="h-4 bg-gray-200 rounded w-3/4"
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="h-3 bg-gray-200 rounded w-1/2"
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
      />
    </div>
  )
}
