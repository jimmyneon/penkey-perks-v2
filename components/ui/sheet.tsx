'use client'

import { ReactNode } from 'react'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxHeight?: string
}

export function Sheet({ isOpen, onClose, children, maxHeight = '85vh' }: SheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />
      <div 
        className="relative bg-white rounded-t-[24px] w-full overflow-y-auto animate-sheet-up"
        style={{ maxHeight, backgroundColor: '#F9F7F2' }}
      >
        {children}
      </div>
    </div>
  )
}
