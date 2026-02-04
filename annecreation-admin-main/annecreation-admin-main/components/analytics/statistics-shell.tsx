"use client"

import { StatisticsHeader } from "./statistics-header"
import { StatisticsOverview } from "./statistics-overview"
import { StatisticsSales } from "./statistics-sales"
import { StatisticsProducts } from "./statistics-products"
import { StatisticsCustomers } from "./statistics-customers"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function StatisticsShell() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasAnalyticsReadAccess = isSuperAdmin || canRead('analytics')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <StatisticsHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAnalyticsReadAccess) {
    return (
      <div className="flex flex-col gap-6">
        <StatisticsHeader />
        <AccessDenied
          description="You don't have permission to view statistics"
          message="This page requires analytics read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <StatisticsHeader />
      <div className="grid gap-6">
        <StatisticsOverview />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* <StatisticsSales className="lg:col-span-4" /> */}
          {/* <StatisticsProducts className="lg:col-span-3" /> */}
        </div>
        {/* <StatisticsCustomers /> */}
      </div>
    </div>
  )
}
