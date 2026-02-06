import type React from "react"
import { cn } from "@/lib/utils"

interface ProductsShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ProductsShell({ children, className, ...props }: ProductsShellProps) {
  return (
    <div className={cn("grid gap-8", className)} {...props}>
      {children}
    </div>
  )
}
