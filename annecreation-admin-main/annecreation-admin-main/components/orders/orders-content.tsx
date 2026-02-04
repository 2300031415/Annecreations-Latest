"use client"

import { OrdersHeader } from "@/components/orders/orders-header"
import { OrdersList } from "@/components/orders/orders-list"
import { OrdersShell } from "@/components/orders/orders-shell"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function OrdersContent() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasOrdersReadAccess = isSuperAdmin || canRead('orders')

  if (isLoading) {
    return (
      <OrdersShell>
        <OrdersHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </OrdersShell>
    )
  }

  if (!hasOrdersReadAccess) {
    return (
      <OrdersShell>
        <OrdersHeader />
        <AccessDenied
          description="You don't have permission to view orders"
          message="This page requires orders read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </OrdersShell>
    )
  }

  return (
    <OrdersShell>
      <OrdersHeader />
      <OrdersList />
    </OrdersShell>
  )
}

