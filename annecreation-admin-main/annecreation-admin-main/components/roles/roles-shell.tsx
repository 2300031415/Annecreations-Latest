"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { RolesHeader } from "@/components/roles/roles-header"
import { RolesList } from "@/components/roles/roles-list"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function RolesShell() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasAdminsReadAccess = isSuperAdmin || canRead('admins')

  if (isLoading) {
    return (
      <DashboardShell>
        <RolesHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!hasAdminsReadAccess) {
    return (
      <DashboardShell>
        <RolesHeader />
        <AccessDenied
          description="You don't have permission to view roles"
          message="This page requires admins read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <RolesHeader />
      <RolesList />
    </DashboardShell>
  )
}
