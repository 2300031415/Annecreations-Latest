
import { BannerHeader } from "@/components/banners/banner-header"
import {BannersList} from "@/components/banners/banner-list"
import { BannersShell } from "@/components/banners/banner-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { SidebarProvider } from "@/contexts/sidebar-context"

export default function CustomersPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-auto">
            <DashboardShell>
              <BannersShell>
               <BannerHeader>
                </BannerHeader>

                <BannersList></BannersList>

               

              </BannersShell>
            </DashboardShell>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
