'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface VoucherRedemptionAnimationProps {
  show: boolean
  onClose: () => void
  voucherName?: string
}

export function VoucherRedemptionAnimation({ show, onClose, voucherName }: VoucherRedemptionAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter')

  useEffect(() => {
    if (show) {
      setAnimationPhase('enter')
      // Start celebration after enter animation
      setTimeout(() => setAnimationPhase('celebrate'), 300)
      // Auto-close after 3 seconds
      setTimeout(() => {
        setAnimationPhase('exit')
        setTimeout(onClose, 500)
      }, 3000)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`
          relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl p-8 text-white text-center
          transform transition-all duration-500 ease-out
          ${animationPhase === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
          ${animationPhase === 'exit' ? 'scale-0 opacity-0' : ''}
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center gap-4">
          {/* Confetti/celebration icon */}
          <div className={`
            text-6xl transition-all duration-500
            ${animationPhase === 'celebrate' ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}
          `}>
            🎉
          </div>

          <h2 className="text-3xl font-bold">Voucher Redeemed!</h2>
          
          {voucherName && (
            <p className="text-xl text-white/90">{voucherName}</p>
          )}

          <p className="text-white/80">Enjoy your reward!</p>

          {/* Success checkmark */}
          <div className={`
            mt-4 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center
            transition-all duration-500
            ${animationPhase === 'celebrate' ? 'scale-110' : 'scale-100'}
          `}>
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
