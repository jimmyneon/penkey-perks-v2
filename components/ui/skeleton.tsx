import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-penkey-gray-light/20", className)}
      {...props}
    />
  )
}

export { Skeleton }
