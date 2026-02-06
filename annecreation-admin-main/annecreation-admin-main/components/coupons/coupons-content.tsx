"use client"

import { CouponsHeader } from "@/components/coupons/coupons-header"
import { CouponsList } from "@/components/coupons/coupons-list"
import { CouponsShell } from "@/components/coupons/coupons-shell"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function CouponsContent() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasCouponsReadAccess = isSuperAdmin || canRead('coupons')

  if (isLoading) {
    return (
      <CouponsShell>
        <CouponsHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </CouponsShell>
    )
  }

  if (!hasCouponsReadAccess) {
    return (
      <CouponsShell>
        <CouponsHeader />
        <AccessDenied
          description="You don't have permission to view coupons"
          message="This page requires coupons read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </CouponsShell>
    )
  }

  return (
    <CouponsShell>
      <CouponsHeader />
      <CouponsList />
    </CouponsShell>
  )
}

