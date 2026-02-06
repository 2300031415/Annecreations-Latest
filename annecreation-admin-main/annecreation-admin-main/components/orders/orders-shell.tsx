import type React from "react"
import { cn } from "@/lib/utils"

interface OrdersShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function OrdersShell({ children, className, ...props }: OrdersShellProps) {
  return (
    <div className={cn("grid gap-8", className)} {...props}>
      {children}
    </div>
  )
}
