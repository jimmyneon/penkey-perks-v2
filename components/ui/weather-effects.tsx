'use client'

import { motion } from 'framer-motion'

export function RainyEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-8 bg-blue-400"
          initial={{ 
            top: -20, 
            left: `${Math.random() * 100}%` 
          }}
          animate={{ 
            top: '110%',
            transition: {
              duration: Math.random() * 1 + 0.5,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }
          }}
        />
      ))}
    </div>
  )
}

export function SunnyEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute top-2 right-2 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Sun rays */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-4 right-4 w-12 h-0.5 bg-yellow-300/20 origin-left"
          style={{
            transform: `rotate(${i * 45}deg)`
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scaleX: [1, 1.3, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export function SnowEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          initial={{ 
            top: -20, 
            left: `${Math.random() * 100}%` 
          }}
          animate={{ 
            top: '110%',
            x: [0, Math.random() * 40 - 20, 0],
            transition: {
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }
          }}
        />
      ))}
    </div>
  )
}

export function CloudyEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-24 h-12 bg-gray-300 rounded-full blur-xl"
          initial={{ 
            top: `${Math.random() * 50}%`,
            left: '-10%'
          }}
          animate={{ 
            left: '110%',
            transition: {
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 5,
              ease: "linear"
            }
          }}
        />
      ))}
    </div>
  )
}

export function HotEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 w-16 h-32 bg-gradient-to-t from-orange-200/20 to-transparent blur-sm"
          style={{
            left: `${i * 20}%`
          }}
          animate={{
            y: [-20, -40, -20],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}
