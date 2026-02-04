import { ProductsContent } from "@/components/products/products-content"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { SidebarProvider } from "@/contexts/sidebar-context"

export default function ProductsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-auto">
            <DashboardShell>
              <ProductsContent />
            </DashboardShell>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
