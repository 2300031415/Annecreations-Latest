import type React from "react"
import { cn } from "@/lib/utils"

interface CouponsShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CouponsShell({ children, className, ...props }: CouponsShellProps) {
  return (
    <div className={cn("grid gap-8", className)} {...props}>
      {children}
    </div>
  )
}
