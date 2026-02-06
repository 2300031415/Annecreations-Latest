"use client"

import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { UserDialog } from "@/components/users/user-dialog"
import { usePermissions } from "@/hooks/use-permissions"

export function UsersHeader() {
  const [open, setOpen] = useState(false)
  const { isSuperAdmin, hasPermission } = usePermissions()
  
  // Check if user has permission to create admin users
  // Admin user management is SuperAdmin-only, so check isSuperAdmin or admins feature permission
  const canCreateUsers = isSuperAdmin || hasPermission('admins', 'create')

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
        <p className="text-muted-foreground">Manage admin users and their role assignments</p>
      </div>
      {canCreateUsers && (
        <>
          <Button onClick={() => setOpen(true)} className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Admin User
          </Button>
          <UserDialog open={open} onOpenChange={setOpen} user={null} mode="create" />
        </>
      )}
    </div>
  )
}
