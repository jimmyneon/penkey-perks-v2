import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tap-highlight-none touch-manipulation active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-orange text-white hover:bg-orange-dark shadow-premium-sm hover:shadow-premium hover:-translate-y-0.5",
        destructive:
          "bg-error text-white hover:bg-error/90 shadow-premium-sm hover:shadow-premium",
        outline:
          "border-2 border-[#F0EBE5] bg-transparent text-brown hover:bg-blush hover:border-blush",
        secondary:
          "bg-burgundy text-white hover:bg-burgundy-dark shadow-premium-sm hover:shadow-premium hover:-translate-y-0.5",
        ghost: "hover:bg-blush hover:text-brown",
        link: "text-orange underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-burgundy to-burgundy-dark text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
