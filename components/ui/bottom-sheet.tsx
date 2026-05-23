'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  showCloseButton?: boolean
  className?: string
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-cream-card rounded-t-3xl shadow-premium-xl max-h-[85vh] overflow-hidden",
              className
            )}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-brown/20 rounded-full" />
            </div>
            
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 pb-4 border-b border-[#F0EBE5]">
                {title && (
                  <h2 className="text-xl font-bold text-brown">{title}</h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-2 rounded-full hover:bg-blush transition-colors"
                  >
                    <X className="w-5 h-5 text-brown" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function BottomSheetContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>
}
