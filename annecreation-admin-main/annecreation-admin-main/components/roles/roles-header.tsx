"use client"

import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { RoleDialog } from "@/components/roles/role-dialog"
import { usePermissions } from "@/hooks/use-permissions"

export function RolesHeader() {
  const [open, setOpen] = useState(false)
  const { isSuperAdmin, hasPermission } = usePermissions()
  
  // Check if user has permission to create roles
  // Role management is SuperAdmin-only, so check isSuperAdmin or admins feature permission
  const canCreateRoles = isSuperAdmin || hasPermission('admins', 'create')

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Roles</h1>
        <p className="text-muted-foreground">Manage user roles and their permissions</p>
      </div>
      {canCreateRoles && (
        <>
          <Button onClick={() => setOpen(true)} className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Role
          </Button>
          <RoleDialog open={open} onOpenChange={setOpen} role={null} mode="create" />
        </>
      )}
    </div>
  )
}
