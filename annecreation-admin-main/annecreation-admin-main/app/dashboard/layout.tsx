import type { ReactNode } from "react"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>{children}</SidebarProvider>
    </ProtectedRoute>
  )
}
