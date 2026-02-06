import type React from "react"
import { cn } from "@/lib/utils"

interface BannersShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BannersShell({ children, className, ...props }: BannersShellProps) {
  return (
    <div className={cn("grid gap-8", className)} {...props}>
      {children}
    </div>
  )
}
