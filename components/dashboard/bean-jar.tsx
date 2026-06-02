'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TrendingUp, Gift, Sparkles, Info } from 'lucide-react'
import Link from 'next/link'

interface BeanJarProps {
  beans: number
  nextReward?: {
    name: string
    beansRequired: number
  }
}

export function BeanJar({ beans, nextReward }: BeanJarProps) {
  const [animatedBeans, setAnimatedBeans] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const targetBeans = nextReward?.beansRequired || beans
  const fillPercentage = Math.min((beans / targetBeans) * 100, 100)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Animate bean count on mount
  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = beans / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= beans) {
        setAnimatedBeans(beans)
        clearInterval(timer)
      } else {
        setAnimatedBeans(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [beans])
  
  // Calculate number of visible beans to show
  const visibleBeanCount = Math.min(Math.floor(beans / 50), 30)
  
  return (
    <>
      <div 
        className="relative w-full max-w-xs mx-auto cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
      {/* Label */}
      <div className="text-center mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">Your Bean Jar</p>
        <motion.p 
          className="text-3xl sm:text-4xl font-bold text-[#8B4513]"
          key={animatedBeans}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {animatedBeans.toLocaleString()}
        </motion.p>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
          {nextReward ? (
            <>
              {(targetBeans - beans).toLocaleString()} more for {nextReward.name}
            </>
          ) : (
            'Keep collecting!'
          )}
        </p>
      </div>
      
      {/* Jar Container */}
      <div className="relative w-40 h-56 sm:w-48 sm:h-64 mx-auto">
        {/* Jar Outline */}
        <div className="absolute inset-0 border-4 border-[#8B4513] rounded-b-[3rem] rounded-t-lg bg-gradient-to-b from-transparent via-amber-50/20 to-amber-50/40 overflow-hidden">
          {/* Lid */}
          <div className="absolute -top-2 left-0 right-0 h-4 bg-[#8B4513] rounded-t-lg border-2 border-[#654321]" />
          
          {/* Beans Filling */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#8B4513] via-[#A0522D] to-[#D2691E] rounded-b-[2.5rem] overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: `${fillPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {/* Animated Beans Inside */}
            <div className="absolute inset-0 overflow-hidden">
              {mounted && Array.from({ length: visibleBeanCount }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  initial={{ y: -20, opacity: 0, scale: 0 }}
                  animate={{
                    y: `${10 + Math.random() * 80}%`,
                    x: `${5 + Math.random() * 85}%`,
                    opacity: [0, 1, 0.8],
                    scale: [0, 1.2, 1],
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                >
                  🫘
                </motion.span>
              ))}
            </div>
            
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear"
              }}
            />
          </motion.div>
          
          {/* Glass Reflection */}
          <div className="absolute top-4 left-2 w-16 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-sm pointer-events-none" />
        </div>
        
        {/* Progress Indicator */}
        {nextReward && (
          <div className="absolute -right-12 sm:-right-16 top-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#8B4513] to-[#D2691E] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
                {Math.round(fillPercentage)}%
              </div>
              <div className="text-[10px] sm:text-xs text-gray-600 text-center w-16 sm:w-20">
                to next reward
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Milestone Markers */}
      {nextReward && (
        <div className="mt-4 sm:mt-6 flex justify-between text-[10px] sm:text-xs text-gray-500">
          <span>0</span>
          <span className="font-semibold text-[#8B4513]">
            {targetBeans.toLocaleString()}
          </span>
        </div>
      )}
      
      {/* Click hint */}
      <div className="mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          Click for more info
        </p>
      </div>
    </div>

    {/* Bean Jar Info Modal */}
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-md sm:max-w-md w-full h-full sm:h-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg rounded-none sm:max-h-[90vh] max-h-[100dvh] bg-[#FAF6F1]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#8B4513]" />
            Your Bean Collection
          </DialogTitle>
          <DialogDescription>
            Track your beans and see what you can earn
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Current Beans Display */}
          <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-[#8B4513]/20">
            <p className="text-5xl font-bold text-[#8B4513] mb-2">
              {beans.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Beans in Your Jar</p>
          </div>

          {/* Next Reward Progress */}
          {nextReward && (
            <div className="space-y-3 p-4 bg-white rounded-lg border border-[#8B4513]/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Next Reward:</span>
                <span className="text-sm font-bold text-[#8B4513]">{nextReward.name}</span>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B4513] to-[#D2691E] transition-all duration-500"
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{beans} beans</span>
                  <span>{nextReward.beansRequired} beans</span>
                </div>
              </div>
              
              <p className="text-sm text-center text-gray-600">
                {(nextReward.beansRequired - beans).toLocaleString()} more beans needed
              </p>
            </div>
          )}

          {/* How to Earn Beans */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8B4513]" />
              How to Earn More Beans
            </h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[#8B4513] font-bold">•</span>
                <span>Play daily games (up to 50 beans per game!)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8B4513] font-bold">•</span>
                <span>Check in at Penkey to claim pending beans</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8B4513] font-bold">•</span>
                <span>Refer friends (10 beans per referral)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8B4513] font-bold">•</span>
                <span>Celebrate your birthday (special bonus!)</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/games">
              <Button variant="outline" className="w-full border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/10">
                Play Games
              </Button>
            </Link>
            <Link href="/rewards">
              <Button className="w-full bg-[#8B4513] hover:bg-[#8B4513]/90 text-white">
                <Gift className="w-4 h-4 mr-2" />
                View Rewards
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
