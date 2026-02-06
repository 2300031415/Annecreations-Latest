"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RoleForm } from "@/components/roles/role-form"
import { Role } from "@/lib/redux/api/rolesApi"
import { usePermissions } from "@/hooks/use-permissions"

interface RoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  mode?: "create" | "edit"
}

export function RoleDialog({ open, onOpenChange, role = null, mode = "create" }: RoleDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }
  const { isSuperAdmin, hasPermission } = usePermissions()
  
  // Check if user has permission to create/update roles
  // Role management is SuperAdmin-only, so check isSuperAdmin or admins feature permission
  const canManageRoles = isSuperAdmin || hasPermission('admins', mode === "create" ? 'create' : 'update')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Role" : "Edit Role"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new role with custom permissions." : "Edit role details and permissions."}
          </DialogDescription>
        </DialogHeader>
        <RoleForm role={role} onSuccess={handleSuccess} />
        {canManageRoles && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="role-form" className="bg-[#ffb729] text-[#311807] hover:bg-[#ffb729]/90">
              {mode === "create" ? "Create Role" : "Save Changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
