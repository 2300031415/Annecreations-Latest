import type React from "react"
import { cn } from "@/lib/utils"

interface CustomersShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CustomersShell({ children, className, ...props }: CustomersShellProps) {
  return (
    <div className={cn("grid gap-8", className)} {...props}>
      {children}
    </div>
  )
}
