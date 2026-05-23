'use client'

import { motion } from 'framer-motion'

interface AnimatedGradientProps {
  variant?: 'default' | 'rainy' | 'sunny' | 'cold' | 'hot' | 'reward' | 'streak' | 'morning' | 'afternoon' | 'evening' | 'night' | 'at_penkey' | 'nearby'
  className?: string
}

export function AnimatedGradient({ variant = 'default', className = '' }: AnimatedGradientProps) {
  const gradients = {
    default: 'from-orange-50 via-amber-50 to-yellow-50',
    rainy: 'from-blue-50 via-cyan-50 to-blue-100',
    sunny: 'from-yellow-50 via-orange-50 to-amber-100',
    cold: 'from-blue-50 via-indigo-50 to-blue-100',
    hot: 'from-red-50 via-orange-50 to-yellow-100',
    reward: 'from-orange-100 via-amber-100 to-yellow-100',
    streak: 'from-red-50 via-orange-50 to-yellow-50',
    morning: 'from-yellow-50 via-orange-50 to-amber-50',
    afternoon: 'from-orange-50 via-amber-50 to-yellow-50',
    evening: 'from-purple-50 via-pink-50 to-purple-100',
    night: 'from-indigo-50 via-blue-50 to-indigo-100',
    at_penkey: 'from-green-50 via-emerald-50 to-green-100',
    nearby: 'from-orange-50 via-amber-50 to-orange-100'
  }

  return (
    <motion.div
      className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]} ${className}`}
      animate={{
        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{
        backgroundSize: '200% 200%'
      }}
    />
  )
}
