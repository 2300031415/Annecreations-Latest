"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopProducts } from "@/components/dashboard/top-products"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function DashboardContent() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasDashboardAccess = isSuperAdmin || canRead('dashboard')

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-auto">
              <DashboardShell>
                {isLoading ? (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  </div>
                ) : hasDashboardAccess ? (
                    <div className="grid gap-6">
                    <OverviewCards />
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <RevenueChart className="lg:col-span-4" />
                        <TopProducts className="lg:col-span-3" />
                    </div>
                    <RecentOrders />
                    </div>
                ) : (
                    <AccessDenied
                    description="You don't have permission to access the dashboard"
                    message="This page requires dashboard read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
                    />
                )}
            </DashboardShell>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

