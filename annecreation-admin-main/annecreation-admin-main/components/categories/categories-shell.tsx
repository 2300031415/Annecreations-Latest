import type React from "react"
import { cn } from "@/lib/utils"

interface CategoriesShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CategoriesShell({ children, className, ...props }: CategoriesShellProps) {
  return (
    <div className={cn("grid gap-8", className)} {...props}>
      {children}
    </div>
  )
}
