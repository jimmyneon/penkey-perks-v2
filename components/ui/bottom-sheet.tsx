'use client'

import * as React from "react"
import { motion, AnimatePresence, useMotionValue, useDragControls, PanInfo } from "framer-motion"
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
  const dragControls = useDragControls()

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldClose =
      info.offset.y > 80 || info.velocity.y > 450

    if (shouldClose) {
      onOpenChange(false)
    } else {
      y.set(0)
    }
  }

  // Reset Y when opening
  React.useEffect(() => {
    if (open) {
      y.set(0)
    }
  }, [open, y])

  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const y = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(y || '0') * -1)
    }
    return () => {
      const y = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(y || '0') * -1)
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
            transition={{
              type: "tween",
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[10000] shadow-premium-xl",
              fullScreen ? "h-screen rounded-t-0" : "bg-cream-card rounded-t-3xl max-h-[85vh]",
              className
            )}
          >
            {/* Drag header - larger drag area */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="flex justify-center pt-4 pb-3">
                <div className="w-12 h-1.5 bg-brown/20 rounded-full" />
              </div>

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
            </div>
            
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
