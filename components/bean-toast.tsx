'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Coffee } from 'lucide-react'

interface BeanModalProps {
  show: boolean
  beansAwarded: number
  onClose: () => void
}

export function BeanModal({ show, beansAwarded, onClose }: BeanModalProps) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-[24px] p-0 border-0">
        <div
          className="p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #E07A3A 0%, #D05A18 100%)',
          }}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {beansAwarded === 1 ? 'You earned a bean!' : `You earned ${beansAwarded} beans!`}
          </h2>
          <p className="text-white/90 mb-4">Keep it up!</p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-white text-[#D05A18] font-semibold hover:bg-white/90 transition-colors"
          >
            Awesome
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
