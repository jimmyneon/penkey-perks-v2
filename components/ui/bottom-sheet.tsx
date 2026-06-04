'use client'

import * as React from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  showCloseButton?: boolean
  className?: string
  fullScreen?: boolean
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  showCloseButton = true,
  className,
  fullScreen = false,
}: BottomSheetProps) {
  const y = useMotionValue(0)

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 50) {
      onOpenChange(false)
    }
  }

  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [open])

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Backdrop - instant appearance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999]"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Sheet - entire sheet draggable */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 250 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 1000 }}
            dragElastic={false}
            dragSnapToOrigin={true}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[10000] shadow-premium-xl",
              fullScreen ? "h-screen rounded-t-0" : "bg-cream-card rounded-t-3xl max-h-[85vh]",
              className
            )}
          >
            {/* Handle - visual only */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-brown/20 rounded-full" />
            </div>
            
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 pb-4">
                {title && (
                  <h2 className="text-xl font-bold text-brown">{title}</h2>
                )}
                {!title && <div />}
                {showCloseButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onOpenChange(false)
                    }}
                    className="p-2 rounded-full hover:bg-blush transition-colors"
                  >
                    <X className="w-5 h-5 text-brown" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content - no scroll container, let content handle its own scrolling */}
            <motion.div dragListener={false}>
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function BottomSheetContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>
}
