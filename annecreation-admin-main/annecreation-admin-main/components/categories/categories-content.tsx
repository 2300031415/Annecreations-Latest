"use client"

import { CategoriesHeader } from "@/components/categories/categories-header"
import { CategoriesList } from "@/components/categories/categories-list"
import { CategoriesShell } from "@/components/categories/categories-shell"
import { usePermissions } from "@/hooks/use-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

export function CategoriesContent() {
  const { canRead, isSuperAdmin, isLoading } = usePermissions()
  const hasCategoriesReadAccess = isSuperAdmin || canRead('categories')

  if (isLoading) {
    return (
      <CategoriesShell>
        <CategoriesHeader />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#ffb729]"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </CategoriesShell>
    )
  }

  if (!hasCategoriesReadAccess) {
    return (
      <CategoriesShell>
        <CategoriesHeader />
        <AccessDenied
          description="You don't have permission to view categories"
          message="This page requires categories read permission that hasn't been granted to your account. Please contact your administrator if you believe you should have access."
        />
      </CategoriesShell>
    )
  }

  return (
    <CategoriesShell>
      <CategoriesHeader />
      <CategoriesList />
    </CategoriesShell>
  )
}

