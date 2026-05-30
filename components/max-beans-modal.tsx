'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface MaxBeansModalProps {
  show: boolean
  message: string
  onClose: () => void
  onConvertToVouchers: () => void
}

export function MaxBeansModal({ show, message, onClose, onConvertToVouchers }: MaxBeansModalProps) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-sm rounded-[28px] shadow-[0_24px_64px_rgba(36,54,75,0.18)] p-0 overflow-hidden border-0" 
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Maximum Beans Reached</DialogTitle>
        <DialogDescription className="sr-only">You have reached the maximum bean cap</DialogDescription>
        <div style={{ backgroundColor: '#FFF4E5' }}>
          
          {/* Top hero area */}
          <div className="relative px-5 pt-5 pb-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3" style={{ border: '1.5px solid #F28A2E' }}>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="#F28A2E"><circle cx="5" cy="5" r="4"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#F28A2E' }}>Maximum beans</span>
            </div>

            {/* Hero text */}
            <div className="pr-4">
              <h2 className="text-[28px] font-extrabold leading-tight" style={{ color: '#24364B' }}>
                Oops!
              </h2>
              <p className="text-[22px] font-bold mt-0.5 leading-tight" style={{ color: '#F28A2E' }}>
                25 beans max
              </p>
              <p className="text-[13px] mt-2 leading-snug" style={{ color: '#5A6A7A' }}>
                {message}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5" style={{ height: '1px', backgroundColor: 'rgba(36,54,75,0.1)' }} />

          {/* Buttons */}
          <div className="p-5 space-y-3">
            <button
              onClick={onConvertToVouchers}
              className="w-full py-3 rounded-full font-semibold transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: '#F28A2E', color: 'white' }}
            >
              Convert to Vouchers
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full font-semibold transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: 'transparent', color: '#5A6A7A', border: '1.5px solid rgba(90,106,122,0.3)' }}
            >
              Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
