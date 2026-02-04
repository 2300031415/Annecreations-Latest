"use client"

import { CustomersHeader } from "@/components/customers/customers-header"
import { CustomersList } from "@/components/customers/customers-list"
import { CustomersShell } from "@/components/customers/customers-shell"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function CustomersContent() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasCustomersReadAccess = isSuperAdmin || canRead('customers')

  if (isLoading) {
    return (
      <CustomersShell>
        <CustomersHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </CustomersShell>
    )
  }

  if (!hasCustomersReadAccess) {
    return (
      <CustomersShell>
        <CustomersHeader />
        <AccessDenied
          description="You don't have permission to view customers"
          message="This page requires customers read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </CustomersShell>
    )
  }

  return (
    <CustomersShell>
      <CustomersHeader />
      <CustomersList />
    </CustomersShell>
  )
}

