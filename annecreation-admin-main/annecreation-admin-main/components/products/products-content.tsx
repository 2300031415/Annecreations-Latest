"use client"

import { ProductsHeader } from "@/components/products/products-header"
import { ProductsList } from "@/components/products/products-list"
import { ProductsShell } from "@/components/products/products-shell"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function ProductsContent() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasProductsReadAccess = isSuperAdmin || canRead('products')

  // Show loading indicator first
  if (isLoading) {
    return (
      <ProductsShell>
        <ProductsHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </ProductsShell>
    )
  }

  // Only show access denied if not loading and user doesn't have access
  if (!hasProductsReadAccess) {
    return (
      <ProductsShell>
        <ProductsHeader />
        <AccessDenied
          description="You don't have permission to view products"
          message="This page requires products read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </ProductsShell>
    )
  }

  return (
    <ProductsShell>
      <ProductsHeader />
      <ProductsList />
    </ProductsShell>
  )
}

