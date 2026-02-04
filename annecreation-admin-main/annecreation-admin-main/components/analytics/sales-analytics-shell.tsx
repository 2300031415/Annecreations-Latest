"use client"

import { SalesAnalyticsHeader } from "./sales-analytics-header"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function SalesAnalyticsShell() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasAnalyticsReadAccess = isSuperAdmin || canRead('analytics')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SalesAnalyticsHeader />
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
        <SalesAnalyticsHeader />
        <AccessDenied
          description="You don't have permission to view sales analytics"
          message="This page requires analytics read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SalesAnalyticsHeader/>
      
    </div>
  )
}
