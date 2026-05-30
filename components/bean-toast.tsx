'use client'

import { useEffect, useState } from 'react'
import { Coffee } from 'lucide-react'

interface BeanToastProps {
  show: boolean
  beansAwarded: number
  onClose: () => void
}

export function BeanToast({ show, beansAwarded, onClose }: BeanToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show && !visible) return null

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-full shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #E07A3A 0%, #D05A18 100%)',
        }}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <div className="text-white">
          <p className="text-sm font-semibold">
            {beansAwarded === 1 ? 'You earned a bean!' : `You earned ${beansAwarded} beans!`}
          </p>
          <p className="text-xs opacity-90">Keep it up!</p>
        </div>
      </div>
    </div>
  )
}
