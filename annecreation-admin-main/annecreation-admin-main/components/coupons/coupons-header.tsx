"use client"

import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CouponDialog } from "./coupon-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePermissions } from "@/hooks/use-permissions"

export function CouponsHeader() {
  const { canCreate } = usePermissions()

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/marketing">Marketing</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/marketing/coupons">Coupons</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">Create and manage discount coupons for your store.</p>
        </div>
        {canCreate('coupons') && (
          <CouponDialog>
            <Button className="gap-1 bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90">
              <PlusCircle className="h-4 w-4" />
              Add Coupon
            </Button>
          </CouponDialog>
        )}
      </div>
    </div>
  )
}
